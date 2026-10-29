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
  /// Admin changes still arrive at once through the realtime sync below.
  static const Duration _diskMaxAge = Duration(minutes: 30);
  static const String _savedAtKey = 'cached_hero_banners_saved_at';
  bool _diskStale = false;

  void clearCache() {
    _cache = null;
    _diskStale = true;
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

  /// Fetches all banners configured by the Admin panel.
  /// Priority:
  /// 1. Supabase public.app_settings table (id: 'banners_hero_list' / key: 'hero_banners_list')
  /// 2. Supabase public.hero_banners table (if available)
  /// 3. Disk cache from SharedPreferences
  /// 4. In-memory cache / default PracticeKoro HD hero banner
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
      // 1. Try public.app_settings (Admin panel central persistence store)
      try {
        final settingRow = await supa
            .from('app_settings')
            .select('value')
            .eq('id', 'banners_hero_list')
            .maybeSingle()
            .timeout(const Duration(seconds: 15));

        if (settingRow != null && settingRow['value'] != null) {
          final rawValue = settingRow['value'];
          dynamic parsedList = rawValue;
          if (rawValue is String) {
            try {
              parsedList = jsonDecode(rawValue);
            } catch (_) {}
          }
          if (parsedList is List && parsedList.isNotEmpty) {
            final banners = parsedList
                .whereType<Map>()
                .map(
                  (m) => HeroBannerModel.fromJson(Map<String, dynamic>.from(m)),
                )
                .toList();
            banners.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
            if (banners.isNotEmpty) {
              _cache = banners;
              await _saveToDiskCache(banners);
              return banners;
            }
          }
        }
      } catch (e) {
        debugPrint('app_settings banner fetch: $e');
      }

      // 2. Try hero_banners table fallback
      try {
        final rows = await supa
            .from('hero_banners')
            .select('*')
            .order('display_order', ascending: true)
            .timeout(const Duration(seconds: 5));

        if (rows.isNotEmpty) {
          final banners = rows
              .map(
                (r) => HeroBannerModel.fromJson(Map<String, dynamic>.from(r)),
              )
              .toList();
          if (banners.isNotEmpty) {
            _cache = banners;
            await _saveToDiskCache(banners);
            return banners;
          }
        }
      } catch (_) {
        // hero_banners table might not be in the schema cache
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

  /// Subscribes to realtime sync broadcast messages and table changes from Admin Panel
  void setupRealtimeSync(VoidCallback onUpdated) {
    final supa = _supabase;
    if (supa == null || _subscriptionChannel != null) return;
    try {
      _subscriptionChannel = supa.channel('banners_sync_channel');
      _subscriptionChannel!
          .onBroadcast(
            event: 'banners_updated',
            callback: (payload) {
              clearCache();
              onUpdated();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'app_settings',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'id',
              value: 'banners_hero_list',
            ),
            callback: (payload) {
              clearCache();
              onUpdated();
            },
          )
          .subscribe();
    } catch (_) {}
  }

  void dispose() {
    try {
      _subscriptionChannel?.unsubscribe();
    } catch (_) {}
    _subscriptionChannel = null;
  }
}
