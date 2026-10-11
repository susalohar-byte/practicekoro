import 'package:flutter/material.dart';
import '../constants/exam_assets.dart';
import '../utils/image_url_helper.dart';

/// Minimal PracticeKoro design tokens and building blocks shared by the Home and
/// Test Series pages. Brand blue is sampled from the official logo (#0058FB).
class PK {
  PK._();

  static const Color blue = Color(0xFF0158FC);
  static const Color blueSoft = Color(0xFFEAF1FF);
  static const Color navy = Color(0xFF101B4B);
  static const Color canvas = Color(0xFFF7F9FC);
  static const Color card = Colors.white;
  static const Color text = Color(0xFF111827);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textFaint = Color(0xFF94A3B8);
  static const Color border = Color(0xFFE5EAF2);
  static const Color green = Color(0xFF15803D);
  static const Color greenSoft = Color(0xFFEAF7EF);
  static const Color amber = Color(0xFFB45309);
  static const Color amberSoft = Color(0xFFFFF5E6);

  static const double radius = 16;
  static const double gutter = 16;

  static BoxDecoration cardBox({double r = radius, Color color = card}) =>
      BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(r),
        border: Border.all(color: border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A101B4B),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      );

  /// Supporting line for a series card: its description (markdown stripped), else
  /// the exam name when it differs from the title, else "Complete Test Series".
  static String seriesLabel(String title, String? description, String? examTitle) {
    final d = description?.replaceAll(RegExp(r'[*_#`]+'), '').trim();
    if (d != null && d.isNotEmpty) return d;
    final e = examTitle?.trim();
    if (e != null && e.isNotEmpty && e.toLowerCase() != title.trim().toLowerCase()) return e;
    return 'Complete Test Series';
  }

  static String formatCount(int n) => n.toString().replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+$)'),
    (m) => '${m[1]},',
  );
}

/// Section heading with an optional trailing text action.
class PKSectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const PKSectionTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: PK.text,
                  letterSpacing: -0.3,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                    color: PK.textMuted,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: PK.blue,
              minimumSize: const Size(44, 36),
              padding: const EdgeInsets.symmetric(horizontal: 6),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              actionLabel!,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
      ],
    );
  }
}

/// Pill-shaped filter chip: brand blue when active, neutral otherwise.
class PKChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? trailingIcon;

  const PKChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.trailingIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? PK.blue : PK.card,
      shape: StadiumBorder(
        side: BorderSide(color: selected ? PK.blue : PK.border),
      ),
      child: InkWell(
        onTap: onTap,
        customBorder: const StadiumBorder(),
        child: Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : PK.text,
                ),
              ),
              if (trailingIcon != null) ...[
                const SizedBox(width: 4),
                Icon(
                  trailingIcon,
                  size: 16,
                  color: selected ? Colors.white : PK.textMuted,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

enum PKBadgeTone { free, paid, popular }

class PKBadge extends StatelessWidget {
  final String label;
  final PKBadgeTone tone;

  const PKBadge(this.label, {super.key, required this.tone});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg) = switch (tone) {
      PKBadgeTone.free => (PK.greenSoft, PK.green),
      PKBadgeTone.paid => (PK.amberSoft, PK.amber),
      PKBadgeTone.popular => (PK.blueSoft, PK.blue),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          color: fg,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

/// Small icon + text metadata (e.g. "25 Tests").
class PKMeta extends StatelessWidget {
  final IconData icon;
  final String text;

  const PKMeta(this.icon, this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: PK.textFaint),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: PK.textMuted,
            ),
          ),
        ),
      ],
    );
  }
}

/// Neutral message card for empty / error states, with an optional action.
class PKEmptyCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const PKEmptyCard({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: PK.cardBox(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: PK.blueSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: PK.blue, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: PK.text,
                  ),
                ),
                if (message != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    message!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: PK.textMuted,
                      height: 1.35,
                    ),
                  ),
                ],
                if (actionLabel != null) ...[
                  const SizedBox(height: 10),
                  FilledButton(
                    onPressed: onAction,
                    style: FilledButton.styleFrom(
                      backgroundColor: PK.blue,
                      minimumSize: const Size(0, 38),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      actionLabel!,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Exam artwork for a test series. Admin-uploaded images first; otherwise the bundled
/// icon/emblem (when rendered as an icon avatar) or bundled banner (when rendered as a banner);
/// otherwise a neutral monogram, never another exam's artwork.
class PKSeriesArt extends StatelessWidget {
  final String title;
  final String? examTitle;
  final String? slug;
  final String? imageUrl;
  final double width;
  final double height;
  final double radius;
  final bool? isIcon;

  const PKSeriesArt({
    super.key,
    required this.title,
    this.examTitle,
    this.slug,
    this.imageUrl,
    required this.width,
    required this.height,
    this.radius = 12,
    this.isIcon,
  });

  static String? bundledIcon(String title, String? examTitle, String? slug) {
    return ExamAssets.getIconAsset('$title ${examTitle ?? ''} ${slug ?? ''}');
  }

  static String? bundledBanner(String title, String? examTitle, String? slug) {
    final t = '$title ${examTitle ?? ''} ${slug ?? ''}'.toLowerCase();
    if (t.contains('wbssc')) {
      return 'assets/images/banner_series_wbssc_exact.png';
    }
    if ((t.contains('wbp') && !t.contains('wbpsc')) ||
        t.contains('west bengal police')) {
      return 'assets/images/banner_series_wbp_exact.png';
    }
    if (RegExp(r'\bkp\b').hasMatch(t) || t.contains('kolkata police')) {
      return 'assets/images/banner_series_kp_exact.png';
    }
    if (t.contains('ntpc') || t.contains('railway') || t.contains('rrb')) {
      return 'assets/images/banner_series_railway_exact.png';
    }
    if (t.contains('ssc gd') || t.contains('ssc-gd')) {
      return 'assets/images/banner_series_ssc_exact.png';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final admin = imageUrl?.trim();
    final bool asIcon = isIcon ?? (width <= 60);

    // In icon mode, ignore rectangular banner URLs so we don't crop a wide banner into a circle
    final bool isBannerUrl = admin != null &&
        (admin.contains('banner_') || admin.contains('_banner') || admin.contains('banner.'));
    final effectiveAdmin = (asIcon && isBannerUrl) ? null : admin;

    final bundled = asIcon
        ? (bundledIcon(title, examTitle, slug) ?? bundledBanner(title, examTitle, slug))
        : (bundledBanner(title, examTitle, slug) ?? bundledIcon(title, examTitle, slug));

    Widget child;
    if (effectiveAdmin != null && effectiveAdmin.isNotEmpty) {
      child = PkAdminImage(
        imageUrl: effectiveAdmin,
        width: width,
        height: height,
        fit: asIcon ? BoxFit.contain : BoxFit.cover,
        fallbackExamTitle: examTitle ?? title,
      );
    } else if (bundled != null) {
      final isEmblem = bundled.contains('emblem_');
      if (asIcon && isEmblem) {
        child = Padding(
          padding: const EdgeInsets.all(3),
          child: Image.asset(
            bundled,
            width: width,
            height: height,
            fit: BoxFit.contain,
          ),
        );
      } else {
        child = Image.asset(
          bundled,
          width: width,
          height: height,
          fit: BoxFit.cover,
          alignment: asIcon ? Alignment.center : Alignment.centerLeft,
        );
      }
    } else {
      final initials = title
          .split(RegExp(r'\s+'))
          .where((w) => w.isNotEmpty && RegExp(r'[A-Za-z0-9]').hasMatch(w[0]))
          .take(2)
          .map((w) => w[0].toUpperCase())
          .join();
      child = Container(
        width: width,
        height: height,
        color: PK.blueSoft,
        alignment: Alignment.center,
        child: Text(
          initials.isEmpty ? 'PK' : initials,
          style: TextStyle(
            fontSize: height * 0.3,
            fontWeight: FontWeight.w900,
            color: PK.blue,
          ),
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(width: width, height: height, child: child),
    );
  }
}
