import 'package:flutter/material.dart';

/// Scope widget to inform descendant widgets whether a floating bottom navigation bar
/// is present in the current view hierarchy and its dimensions.
class PKBottomNavScope extends InheritedWidget {
  /// Whether the floating bottom navigation bar is active.
  final bool hasFloatingNavBar;

  /// Height of the floating pill navigation bar itself (default: 70.0).
  final double navBarHeight;

  /// Gap between the pill and the device safe area (default: 8.0).
  final double navBarBottomMargin;

  /// The device's bottom safe-area inset, captured *outside* the Scaffold.
  /// Inside a Scaffold body with a bottomNavigationBar, Flutter rewrites
  /// `padding.bottom` to the whole bar area and zeroes `viewPadding.bottom`,
  /// so descendants cannot read the real inset themselves.
  final double deviceBottomInset;

  const PKBottomNavScope({
    super.key,
    this.hasFloatingNavBar = true,
    this.navBarHeight = 70.0,
    this.navBarBottomMargin = 8.0,
    this.deviceBottomInset = 0.0,
    required super.child,
  });

  static PKBottomNavScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<PKBottomNavScope>();
  }

  static bool hasNavBar(BuildContext context) {
    return maybeOf(context)?.hasFloatingNavBar ?? false;
  }

  @override
  bool updateShouldNotify(PKBottomNavScope oldWidget) =>
      hasFloatingNavBar != oldWidget.hasFloatingNavBar ||
      navBarHeight != oldWidget.navBarHeight ||
      navBarBottomMargin != oldWidget.navBarBottomMargin ||
      deviceBottomInset != oldWidget.deviceBottomInset;
}

/// Centralized layout spacing utility for bottom navigation clearance across PracticeKoro.
///
/// Gives scrollable pages exactly enough bottom padding for their last item to sit
/// [defaultBreathingGap] above the floating navbar (or the device safe area on
/// screens without one) — and no more.
///
/// Note: [MainScaffold] uses `extendBody: true`, so inside the tabs Flutter already
/// reports the whole bottom-bar area (including the mascot headroom above the pill)
/// as `MediaQuery.padding.bottom`. Adding the bar height on top of that double-counts
/// it, which is what used to leave a large blank area under every tab. The navbar case
/// therefore uses the pill footprint plus [PKBottomNavScope.deviceBottomInset].
class PKBottomSpacing {
  PKBottomSpacing._();

  /// The standard height of the floating navbar pill.
  static const double floatingBarHeight = 70.0;

  /// The gap between the navbar pill and the device safe area.
  static const double floatingBarBottomMargin = 8.0;

  /// Total vertical footprint of the floating navbar above the safe area.
  static const double totalFloatingBarFootprint =
      floatingBarHeight + floatingBarBottomMargin;

  /// Visual breathing gap between the last content item and the navbar pill.
  static const double defaultBreathingGap = 12.0;

  /// Gap below the last item on screens without a floating bar (above the safe area).
  static const double defaultDetailGap = 20.0;

  /// Keeps the standard gutters useful on compact phones without changing spacing
  /// on normal-width devices or tablets.
  static double responsiveHorizontal(BuildContext context, double preferred) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < 340) return preferred.clamp(8.0, 10.0);
    if (width < 380) return preferred.clamp(10.0, 12.0);
    return preferred;
  }

  /// Bottom padding for the current context.
  ///
  /// Inside a [PKBottomNavScope] with an active floating navbar (the 5 main tabs):
  /// `navBarHeight + navBarBottomMargin + deviceBottomInset + gap`.
  ///
  /// Everywhere else (pushed detail/settings screens):
  /// `MediaQuery.padding.bottom + gap`.
  static double of(BuildContext context, {double? additionalGap}) {
    final scope = PKBottomNavScope.maybeOf(context);
    if (scope != null && scope.hasFloatingNavBar) {
      return scope.navBarHeight +
          scope.navBarBottomMargin +
          scope.deviceBottomInset +
          (additionalGap ?? defaultBreathingGap);
    }
    return MediaQuery.paddingOf(context).bottom + (additionalGap ?? defaultDetailGap);
  }

  /// Bottom padding for a page that is known to sit above the floating navbar.
  static double floatingBarOf(
    BuildContext context, {
    double additionalGap = defaultBreathingGap,
  }) {
    final scope = PKBottomNavScope.maybeOf(context);
    return (scope?.navBarHeight ?? floatingBarHeight) +
        (scope?.navBarBottomMargin ?? floatingBarBottomMargin) +
        (scope?.deviceBottomInset ?? MediaQuery.paddingOf(context).bottom) +
        additionalGap;
  }

  /// Bottom padding for detail screens without a floating bar.
  static double safeAreaOf(
    BuildContext context, {
    double additionalGap = defaultDetailGap,
  }) {
    return MediaQuery.paddingOf(context).bottom + additionalGap;
  }

  /// Returns [EdgeInsets] with dynamically calculated bottom clearance.
  static EdgeInsets edgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double? additionalGap,
  }) {
    return EdgeInsets.fromLTRB(
      responsiveHorizontal(context, horizontal),
      top,
      responsiveHorizontal(context, horizontal),
      of(context, additionalGap: additionalGap),
    );
  }

  /// Returns [EdgeInsets] specifically with floating bar clearance.
  static EdgeInsets floatingBarEdgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double additionalGap = defaultBreathingGap,
  }) {
    return EdgeInsets.fromLTRB(
      responsiveHorizontal(context, horizontal),
      top,
      horizontal,
      floatingBarOf(context, additionalGap: additionalGap),
    );
  }

  /// Returns [EdgeInsets] for detail screens without floating bar.
  static EdgeInsets safeAreaEdgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double additionalGap = defaultDetailGap,
  }) {
    return EdgeInsets.fromLTRB(
      horizontal,
      top,
      horizontal,
      safeAreaOf(context, additionalGap: additionalGap),
    );
  }
}

/// A spacer widget that automatically expands to the exact bottom clearance height.
/// Useful as the trailing item in a [Column], [ListView], or modal.
class PKBottomNavSpacer extends StatelessWidget {
  final double? additionalGap;

  const PKBottomNavSpacer({super.key, this.additionalGap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PKBottomSpacing.of(context, additionalGap: additionalGap),
    );
  }
}

/// A sliver spacer widget for [CustomScrollView].
class PKBottomNavSliverSpacer extends StatelessWidget {
  final double? additionalGap;

  const PKBottomNavSliverSpacer({super.key, this.additionalGap});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: PKBottomSpacing.of(context, additionalGap: additionalGap),
      ),
    );
  }
}

/// Extension on [BuildContext] for quick access to bottom navigation clearance.
extension PKBottomSpacingExtension on BuildContext {
  /// Bottom spacing clearance for floating navbar and safe area.
  double get bottomNavPadding => PKBottomSpacing.of(this);

  /// Standard EdgeInsets with bottom navbar clearance.
  EdgeInsets bottomNavEdgeInsets({
    double horizontal = 16.0,
    double top = 12.0,
    double? additionalGap,
  }) => PKBottomSpacing.edgeInsets(
    this,
    horizontal: horizontal,
    top: top,
    additionalGap: additionalGap,
  );

  /// Whether a floating bottom navbar is active in current context.
  bool get hasBottomNav => PKBottomNavScope.hasNavBar(this);
}
