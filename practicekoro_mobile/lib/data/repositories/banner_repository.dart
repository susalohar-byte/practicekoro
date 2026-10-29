import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/hero_banner_model.dart';

final bannerRepositoryProvider = Provider<BannerRepository>((ref) {
  final repo = BannerRepository();
  ref.onDispose(() => repo.dispose());
  return repo;
});

final homeBannersProvider = FutureProvider<List<HeroBannerModel>>((ref) async {
  final repo = ref.watch(bannerRepositoryProvider);
  return repo.getActiveHomeBanners();
});

class BannerRepository {
  List<HeroBannerModel>? _cache;
  RealtimeChannel? _subscriptionChannel;
  static const String _storageKey = 'cached_hero_banners_list_v2';

  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  /// A saved copy younger than this is shown without asking the server.
  /// Admin changes still arrive within seconds through the realtime sync below.
  static const Duration _diskMaxAge = Duration(minutes: 30);
  static const String _savedAtKey = 'cached_hero_banners_saved_at';
  bool _diskStale = false;

  /// When the banner list was last asked from the server.
  DateTime? _lastNetworkFetch;

  /// Pull-to-refresh asks the server again only after this long.
  static const Duration _manualRefreshMinInterval = Duration(minutes: 1);

  /// Admin saves can arrive as a burst of broadcasts; they are folded into
  /// a single refetch this long after the last one.
  static const Duration _syncDebounce = Duration(seconds: 5);
  Timer? _syncTimer;

  void clearCache() {
    _cache = null;
    _diskStale = true;
  }

  /// For pull-to-refresh: drops the cached list only if it was fetched more
  /// than [_manualRefreshMinInterval] ago, so repeated pulls do not
  /// re-download it. Admin changes still arrive through [setupRealtimeSync].
  void refreshIfStale() {
    final last = _lastNetworkFetch;
    if (last != null &&
        DateTime.now().difference(last) < _manualRefreshMinInterval) {
      return;
    }
    clearCache();
  }

  /// Load cached banners from SharedPreferences
  Future<List<HeroBannerModel>?> _loadFromDiskCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List && decoded.isNotEmpty) {
          final list = decoded
              .whereType<Map>()
              .map(
                (m) => HeroBannerModel.fromJson(Map<String, dynamic>.from(m)),
              )
              .toList();
          list.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
          return list;
        }
      }
    } catch (e) {
      debugPrint('Error loading cached banners: $e');
    }
    return null;
  }

  Future<bool> _diskCacheIsFresh() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedAt = prefs.getInt(_savedAtKey);
      if (savedAt == null) return false;
      final age = DateTime.now().difference(
        DateTime.fromMillisecondsSinceEpoch(savedAt),
      );
      return !age.isNegative && age < _diskMaxAge;
    } catch (_) {
      return false;
    }
  }

  /// Save banners to SharedPreferences
  Future<void> _saveToDiskCache(List<HeroBannerModel> banners) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = banners.map((b) => b.toJson()).toList();
      await prefs.setString(_storageKey, jsonEncode(jsonList));
      await prefs.setInt(_savedAtKey, DateTime.now().millisecondsSinceEpoch);
      _diskStale = false;
    } catch (e) {
      debugPrint('Error saving banners to cache: $e');
    }
  }

  /// Columns [HeroBannerModel.fromJson] reads from `hero_banners` (never `*`).
  static const _bannerColumns =
      'id, badge_text, title, highlight_word, subtitle, primary_cta_text, '
      'primary_cta_link, secondary_cta_text, secondary_cta_link, feature_pills, '
      'image_url, mobile_image_url, banner_type, show_text_overlay, '
      'theme_gradient, target_audience, placement, starts_at, expires_at, '
      'click_count, is_active, display_order, created_at, updated_at';

  /// Fetches the banners configured by the Admin panel.
  /// Priority:
  /// 1. Supabase `public.hero_banners` (row level security returns only live
  ///    banners: active and inside their schedule window)
  /// 2. Disk cache from SharedPreferences
  /// 3. In-memory cache / default PracticeKoro HD hero banner
  Future<List<HeroBannerModel>> getBanners({bool forceRefresh = false}) async {
    if (!forceRefresh && _cache != null && _cache!.isNotEmpty) {
      return _cache!;
    }

    // Try reading disk cache first for instant response if cache is null
    if (!forceRefresh && _cache == null) {
      final diskBanners = await _loadFromDiskCache();
      if (diskBanners != null && diskBanners.isNotEmpty) {
        _cache = diskBanners;
        // A recent copy saves re-downloading the banner list on every open.
        if (!_diskStale && await _diskCacheIsFresh()) return diskBanners;
      }
    }

    final supa = _supabase;
    if (supa != null) {
      _lastNetworkFetch = DateTime.now();
      try {
        final rows = await supa
            .from('hero_banners')
            .select(_bannerColumns)
            .order('display_order', ascending: true)
            .timeout(const Duration(seconds: 15));

        final banners = rows
            .map((r) => HeroBannerModel.fromJson(Map<String, dynamic>.from(r)))
            .toList();
        // An answer from the server is final, empty included (every banner
        // switched off or out of schedule): never fall back to an old copy.
        _cache = banners;
        await _saveToDiskCache(banners);
        return banners;
      } catch (e) {
        debugPrint('hero_banners fetch: $e');
      }
    }

    // Return cached banners if available
    if (_cache != null && _cache!.isNotEmpty) {
      return _cache!;
    }

    // Default fallback banner
    return const [HeroBannerModel.defaultBanner];
  }

  /// Fetches only active, live-scheduled banners for the Student Home carousel
  Future<List<HeroBannerModel>> getActiveHomeBanners({
    bool forceRefresh = false,
  }) async {
    final all = await getBanners(forceRefresh: forceRefresh);
    final active = all.where((b) {
      if (!b.isCurrentlyLive) return false;
      if (b.placement != 'home_hero' && b.placement != 'all') return false;
      return true;
    }).toList();

    if (active.isEmpty) {
      return const [HeroBannerModel.defaultBanner];
    }
    return active;
  }

  /// Record banner click / engagement in the background
  Future<void> recordBannerClick(String bannerId) async {
    final supa = _supabase;
    if (supa == null) return;
    try {
      await supa.rpc(
        'increment_banner_click',
        params: {'p_banner_id': bannerId},
      );
    } catch (_) {
      // Silently ignore if RPC is not present
    }
  }

  /// Listens for the admin panel's tiny `banners_updated` broadcast, used
  /// only as a "something changed" signal. The banner row itself is not
  /// streamed (a `postgres_changes` subscription would ship the whole row to
  /// every phone on each save); instead each phone refetches it once, a few
  /// seconds after the last signal.
  void setupRealtimeSync(VoidCallback onUpdated) {
    final supa = _supabase;
    if (supa == null || _subscriptionChannel != null) return;
    try {
      _subscriptionChannel = supa.channel('banners_sync_channel');
      _subscriptionChannel!
          .onBroadcast(
            event: 'banners_updated',
            callback: (_) {
              _syncTimer?.cancel();
              _syncTimer = Timer(_syncDebounce, () {
                clearCache();
                onUpdated();
              });
            },
          )
          .subscribe();
    } catch (_) {}
  }

  void dispose() {
    _syncTimer?.cancel();
    _syncTimer = null;
    try {
      _subscriptionChannel?.unsubscribe();
    } catch (_) {}
    _subscriptionChannel = null;
  }
}
