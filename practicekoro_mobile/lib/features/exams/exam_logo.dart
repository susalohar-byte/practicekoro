import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/components/ui.dart';
import '../../core/constants/exam_assets.dart';

/// Round exam emblem from custom uploaded URLs, Base64 data, presets, or bundled exam assets.
class ExamLogo extends StatelessWidget {
  final String? examTitle;
  final String? iconUrl;
  final String? assetOverride;
  final double size;

  const ExamLogo(
    this.examTitle, {
    super.key,
    this.iconUrl,
    this.assetOverride,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    final rawUrl = (iconUrl ?? assetOverride)?.trim();
    final fallbackAsset = ExamAssets.resolveExamAsset(examTitle, rawUrl) ??
        'assets/images/exams/logo_wbpsc.webp';

    Widget fallbackWidget() => Image.asset(
          fallbackAsset,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) =>
              UIIconBadge(Icons.account_balance_rounded, size: size),
          excludeFromSemantics: true,
        );

    // 1. HTTP / HTTPS Network URL (e.g. custom logo uploaded to Supabase storage)
    if (rawUrl != null &&
        (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
      return SizedBox(
        width: size,
        height: size,
        child: Image.network(
          rawUrl,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => fallbackWidget(),
          excludeFromSemantics: true,
        ),
      );
    }

    // 2. Base64 Data URI (e.g. data:image/png;base64,...)
    if (rawUrl != null && rawUrl.startsWith('data:image/')) {
      try {
        final commaIdx = rawUrl.indexOf(',');
        if (commaIdx != -1) {
          final base64Str = rawUrl.substring(commaIdx + 1);
          final bytes = base64Decode(base64Str);
          return SizedBox(
            width: size,
            height: size,
            child: Image.memory(
              bytes,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => fallbackWidget(),
              excludeFromSemantics: true,
            ),
          );
        }
      } catch (_) {}
    }

    // 3. Preset image path or board identifier (e.g. /images/exams/logo_wbp.png or Award or assets/...)
    final asset = ExamAssets.resolveExamAsset(examTitle, rawUrl);
    if (asset != null) {
      return SizedBox(
        width: size,
        height: size,
        child: Image.asset(
          asset,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => fallbackWidget(),
          excludeFromSemantics: true,
        ),
      );
    }

    return SizedBox(
      width: size,
      height: size,
      child: fallbackWidget(),
    );
  }
}
