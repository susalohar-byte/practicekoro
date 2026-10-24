import 'package:flutter/material.dart';
import '../../core/components/ui.dart';
import '../../core/constants/exam_assets.dart';

/// Round exam emblem from the bundled exam assets, with an icon fallback.
class ExamLogo extends StatelessWidget {
  final String? examTitle;
  final String? assetOverride;
  final double size;

  const ExamLogo(
    this.examTitle, {
    super.key,
    this.assetOverride,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    final override = assetOverride;
    final asset = override != null && override.startsWith('assets/')
        ? override
        : ExamAssets.getRoundIconAsset(examTitle);
    final fallback = UIIconBadge(Icons.account_balance_rounded, size: size);
    if (asset == null) return fallback;
    return SizedBox(
      width: size,
      height: size,
      child: Image.asset(
        asset,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => fallback,
      ),
    );
  }
}
