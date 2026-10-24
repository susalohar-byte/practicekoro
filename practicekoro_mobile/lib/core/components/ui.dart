import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// PracticeKoro design system.
///
/// White pages, soft tinted cards, indigo primary with brand blue, green for
/// correct/progress, red for wrong/errors, warm yellow for achievements and Pro.
class UI {
  UI._();

  // Brand and accents
  static const Color primary = Color(0xFF1F48E8); // royal blue: buttons, active states
  static const Color primaryDark = Color(0xFF1736C4);
  static const Color primarySoft = Color(0xFFEAF0FF);

  /// Hero banners: royal blue into violet.
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1F48E8), Color(0xFF4F46E5), Color(0xFF8B3CF0)],
    stops: [0, 0.55, 1],
  );

  /// Page background: a cool off-white so white cards stand out.
  static const Color page = Color(0xFFF7F8FC);
  static const Color brand = Color(0xFF0158FC); // logo blue
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleSoft = Color(0xFFF3EEFF);
  static const Color success = Color(0xFF16A34A);
  static const Color successBright = Color(0xFF22C55E);
  static const Color successSoft = Color(0xFFECFDF3);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerSoft = Color(0xFFFEF2F2);
  static const Color gold = Color(0xFFF59E0B);
  static const Color goldBright = Color(0xFFFACC15);
  static const Color goldSoft = Color(0xFFFFF8E6);
  static const Color orange = Color(0xFFF97316);
  static const Color teal = Color(0xFF0EA5E9);

  // Neutrals
  static const Color text = Color(0xFF111827);
  static const Color textSoft = Color(0xFF374151);
  static const Color muted = Color(0xFF6B7280);
  static const Color faint = Color(0xFF9CA3AF);
  static const Color line = Color(0xFFE9ECF3);
  static const Color surface = Color(0xFFF6F7FB);

  // Backwards-compatible aliases used by earlier screens
  static const Color accent = primary;
  static const Color accentSoft = primarySoft;
  static const Color warning = gold;
  static const Color warningSoft = goldSoft;

  /// Rotating icon colours for subjects, topics and shortcuts.
  static const List<Color> palette = [
    primary,
    danger,
    success,
    orange,
    purple,
    teal,
    gold,
  ];
  static Color paletteAt(int i) => palette[i % palette.length];

  // Spacing and shape
  static const double gutter = 16;
  static const double radius = 14;
  static const EdgeInsets pagePadding = EdgeInsets.fromLTRB(
    gutter,
    4,
    gutter,
    28,
  );

  // Type (Hind Siliguri is applied app-wide through the text theme)
  static const TextStyle display = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w800,
    color: text,
    height: 1.2,
  );
  static const TextStyle title = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: text,
    height: 1.25,
  );
  static const TextStyle heading = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w700,
    color: text,
    height: 1.3,
  );
  static const TextStyle body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: text,
    height: 1.45,
  );
  static const TextStyle bodyStrong = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: text,
    height: 1.35,
  );
  static const TextStyle caption = TextStyle(
    fontSize: 12.5,
    fontWeight: FontWeight.w400,
    color: muted,
    height: 1.35,
  );
  static const TextStyle label = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: muted,
    letterSpacing: 0.2,
  );

  static const List<BoxShadow> shadow = [
    BoxShadow(color: Color(0x0D1F3A8A), blurRadius: 16, offset: Offset(0, 4)),
  ];

  static BoxDecoration box({
    Color color = Colors.white,
    Color border = line,
    bool raised = true,
  }) => BoxDecoration(
    color: color,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: border),
    boxShadow: raised && color == Colors.white ? shadow : null,
  );

  static ThemeData theme(TextTheme base) {
    final textTheme = base.apply(bodyColor: text, displayColor: text);
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: page,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        surface: Colors.white,
        surfaceTint: Colors.transparent,
      ),
      textTheme: textTheme,
      dividerColor: line,
      dividerTheme: const DividerThemeData(color: line, thickness: 1, space: 1),
      appBarTheme: const AppBarTheme(
        backgroundColor: page,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        iconTheme: IconThemeData(color: text),
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: text,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: Colors.transparent,
        height: 64,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11.5,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? primary : muted,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? primary : muted,
            size: 24,
          ),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Headers and pages
// ---------------------------------------------------------------------------

/// Brand header used on tab roots: PracticeKoro logo + actions.
class UIBrandBar extends StatelessWidget implements PreferredSizeWidget {
  final List<Widget> actions;

  const UIBrandBar({super.key, this.actions = const []});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      centerTitle: false,
      automaticallyImplyLeading: false,
      titleSpacing: UI.gutter,
      title: Semantics(label: 'PracticeKoro', child: const _BrandLogo()),
      actions: [...actions, const SizedBox(width: 8)],
    );
  }
}

/// Official PracticeKoro Brand Logo
class UIBrandLogo extends StatelessWidget {
  final double height;
  const UIBrandLogo({super.key, this.height = 36});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'PracticeKoro',
      child: Image.asset(
        'assets/images/logo-transparent.png',
        height: height,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}

class _BrandLogo extends StatelessWidget {
  const _BrandLogo();

  @override
  Widget build(BuildContext context) {
    return const UIBrandLogo(height: 34);
  }
}

/// Plain header: back button (when the route can pop), centred title, actions.
class UITitleBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget> actions;
  final Widget? leading;

  /// Where Back goes when there is nothing to pop (e.g. opened from a link).
  final String? fallbackRoute;

  const UITitleBar(
    this.title, {
    super.key,
    this.actions = const [],
    this.leading,
    this.fallbackRoute,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final router = GoRouter.maybeOf(context);
    final canPop = router?.canPop() ?? false;
    return AppBar(
      leading:
          leading ??
          (canPop || (fallbackRoute != null && router != null)
              ? IconButton(
                  tooltip: 'Back',
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                  onPressed: () =>
                      canPop ? context.pop() : context.go(fallbackRoute!),
                )
              : null),
      automaticallyImplyLeading: false,
      title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
      actions: [...actions, const SizedBox(width: 4)],
    );
  }
}

/// Round icon action for headers (search, bookmark, share, settings).
class UIHeaderAction extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;
  final Color color;

  const UIHeaderAction(
    this.icon, {
    super.key,
    required this.tooltip,
    this.onPressed,
    this.color = UI.text,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, color: color, size: 24),
    );
  }
}

/// Scrollable page body with optional bottom action area.
class UIPage extends StatelessWidget {
  final PreferredSizeWidget? appBar;
  final String? title;
  final String? subtitle;
  final List<Widget> children;
  final List<Widget>? actions;
  final Widget? bottom;
  final Future<void> Function()? onRefresh;

  const UIPage({
    super.key,
    this.appBar,
    this.title,
    this.subtitle,
    required this.children,
    this.actions,
    this.bottom,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final list = ListView(
      padding: UI.pagePadding,
      children: [
        if (title != null) ...[
          Text(title!, style: UI.display),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!, style: UI.caption),
          ],
          const SizedBox(height: 16),
        ],
        ...children,
      ],
    );
    return Scaffold(
      appBar: appBar ?? AppBar(toolbarHeight: 48, actions: actions),
      body: SafeArea(
        top: false,
        bottom: bottom == null,
        child: onRefresh == null
            ? list
            : RefreshIndicator(onRefresh: onRefresh!, child: list),
      ),
      bottomNavigationBar: bottom == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(UI.gutter, 8, UI.gutter, 12),
                child: bottom,
              ),
            ),
    );
  }
}

/// Section heading with optional "See All →" link.
class UISection extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final EdgeInsets padding;

  const UISection(
    this.title, {
    super.key,
    this.actionLabel,
    this.onAction,
    this.padding = const EdgeInsets.only(top: 22, bottom: 10),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(child: Text(title, style: UI.heading)),
          if (actionLabel != null)
            InkWell(
              onTap: onAction,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      actionLabel!,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: UI.primary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: UI.primary,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Cards and rows
// ---------------------------------------------------------------------------

class UICard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color border;
  final VoidCallback? onTap;
  final bool raised;

  const UICard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color = Colors.white,
    this.border = UI.line,
    this.onTap,
    this.raised = true,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      decoration: UI.box(color: color, border: border, raised: raised),
      padding: padding,
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UI.radius),
        child: content,
      ),
    );
  }
}

/// Rounded tinted square holding an icon or an image.
class UIIconBadge extends StatelessWidget {
  final IconData? icon;
  final String? asset;
  final Color color;
  final double size;

  const UIIconBadge(
    IconData this.icon, {
    super.key,
    this.color = UI.primary,
    this.size = 44,
  }) : asset = null;

  const UIIconBadge.asset(
    String this.asset, {
    super.key,
    this.color = UI.primary,
    this.size = 44,
  }) : icon = null;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      padding: asset != null ? EdgeInsets.all(size * 0.12) : null,
      child: asset != null
          ? Image.asset(
              asset!,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) =>
                  Icon(Icons.school_rounded, color: color),
            )
          : Icon(icon, color: color, size: size * 0.52),
    );
  }
}

/// Row used for lists of exams, topics, history and menus.
class UIRow extends StatelessWidget {
  final IconData? icon;
  final Color iconColor;
  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showChevron;
  final Color? titleColor;

  const UIRow({
    super.key,
    this.icon,
    this.iconColor = UI.primary,
    this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.showChevron = true,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: onTap != null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UI.radius),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
            child: Row(
              children: [
                if (leading != null) ...[leading!, const SizedBox(width: 14)],
                if (leading == null && icon != null) ...[
                  UIIconBadge(icon!, color: iconColor),
                  const SizedBox(width: 14),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: titleColor == null
                            ? UI.bodyStrong
                            : UI.bodyStrong.copyWith(color: titleColor),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: UI.caption,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) ...[const SizedBox(width: 8), trailing!],
                if (onTap != null && showChevron) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right_rounded, color: UI.faint),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A card containing rows separated by hairlines.
class UIGroup extends StatelessWidget {
  final List<Widget> children;

  const UIGroup({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: UI.box(),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// Compact square shortcut: tinted icon above a label.
class UIShortcut extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const UIShortcut({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return UICard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      child: SizedBox(
        height: 78,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            UIIconBadge(icon, color: color, size: 42),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: UI.textSoft,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Inputs, chips, buttons
// ---------------------------------------------------------------------------

class UISearchField extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onChanged;
  final TextEditingController? controller;
  final bool autofocus;

  const UISearchField({
    super.key,
    required this.hint,
    required this.onChanged,
    this.controller,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      autofocus: autofocus,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      style: UI.body,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: UI.body.copyWith(color: UI.faint),
        prefixIcon: const Icon(Icons.search_rounded, color: UI.muted),
        filled: true,
        fillColor: UI.surface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(UI.radius),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}

/// Single-select pill chips in one horizontally scrolling row.
class UIChips<T> extends StatelessWidget {
  final List<(T, String)> options;
  final T value;
  final ValueChanged<T> onChanged;
  final Map<T, int>? counts;
  final Map<T, Color>? countColors;

  const UIChips({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.counts,
    this.countColors,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final (key, text) in options)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _Chip(
                text: text,
                selected: key == value,
                count: counts?[key],
                countColor: countColors?[key],
                onTap: () => onChanged(key),
              ),
            ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String text;
  final bool selected;
  final int? count;
  final Color? countColor;
  final VoidCallback onTap;

  const _Chip({
    required this.text,
    required this.selected,
    required this.onTap,
    this.count,
    this.countColor,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          constraints: const BoxConstraints(minHeight: 36),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? UI.primary : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? UI.primary : UI.line),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                text,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? Colors.white : UI.textSoft,
                ),
              ),
              if (count != null) ...[
                const SizedBox(width: 5),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: selected
                        ? Colors.white.withValues(alpha: 0.22)
                        : (countColor ?? UI.muted).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$count',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : (countColor ?? UI.muted),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class UIButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool secondary;
  final bool loading;
  final Color? color;
  final Color? foreground;
  final double height;
  final bool expand;

  const UIButton(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.trailingIcon,
    this.secondary = false,
    this.loading = false,
    this.color,
    this.foreground,
    this.height = 52,
    this.expand = true,
  });

  const UIButton.secondary(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.trailingIcon,
    this.loading = false,
    this.height = 52,
    this.expand = true,
  }) : secondary = true,
       color = null,
       foreground = null;

  @override
  Widget build(BuildContext context) {
    final fg = foreground ?? (secondary ? UI.primary : Colors.white);
    final child = loading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: 6),
              ],
              Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
              if (trailingIcon != null) ...[
                const SizedBox(width: 6),
                Icon(trailingIcon, size: 18),
              ],
            ],
          );
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(UI.radius),
    );
    const textStyle = TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700);
    final onTap = loading ? null : onPressed;
    final button = secondary
        ? OutlinedButton(
            onPressed: onTap,
            style: OutlinedButton.styleFrom(
              foregroundColor: fg,
              side: const BorderSide(color: UI.line, width: 1.2),
              shape: shape,
              textStyle: textStyle,
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: child,
          )
        : FilledButton(
            onPressed: onTap,
            style: FilledButton.styleFrom(
              backgroundColor: color ?? UI.primary,
              foregroundColor: fg,
              shape: shape,
              textStyle: textStyle,
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: child,
          );
    return SizedBox(
      height: height,
      width: expand ? double.infinity : null,
      child: button,
    );
  }
}

/// Small status tag such as "Free", "Pro", "Done".
class UITag extends StatelessWidget {
  final String text;
  final Color color;
  final IconData? icon;

  const UITag(this.text, {super.key, this.color = UI.primary, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 3),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

/// A row of 2-4 numbers with labels.
class UIStats extends StatelessWidget {
  final List<UIStat> stats;

  const UIStats(this.stats, {super.key});

  @override
  Widget build(BuildContext context) {
    return UICard(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          for (var i = 0; i < stats.length; i++) ...[
            if (i > 0) Container(width: 1, height: 32, color: UI.line),
            Expanded(
              child: Column(
                children: [
                  Text(
                    stats[i].value,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: stats[i].color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stats[i].label,
                    style: UI.caption,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class UIStat {
  final String value;
  final String label;
  final Color color;

  const UIStat(this.value, this.label, {this.color = UI.text});
}

/// Thin rounded progress bar.
class UIProgress extends StatelessWidget {
  final double value;
  final Color color;
  final double height;

  const UIProgress(
    this.value, {
    super.key,
    this.color = UI.success,
    this.height = 6,
  });

  /// Colour that reads as weak (<40%), medium or strong (>=70%).
  static Color colorFor(double value) =>
      value >= 0.7 ? UI.successBright : (value >= 0.4 ? UI.gold : UI.danger);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: LinearProgressIndicator(
        value: value.clamp(0, 1).toDouble(),
        minHeight: height,
        backgroundColor: UI.line,
        color: color,
      ),
    );
  }
}

/// Info tile: tinted icon, big value, small label (test start screen, result).
class UIInfoTile extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const UIInfoTile({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.color = UI.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        UIIconBadge(icon, color: color, size: 40),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: UI.text,
          ),
        ),
        Text(label, style: UI.caption, textAlign: TextAlign.center),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

enum UIOptionState { normal, selected, correct, wrong }

/// Answer option row: letter circle, text (Bengali first), state icon + label.
/// State is never shown by colour alone.
class UIOptionTile extends StatelessWidget {
  final String letter;
  final String text;
  final String? secondaryText;
  final UIOptionState state;
  final String? stateLabel;
  final VoidCallback? onTap;

  const UIOptionTile({
    super.key,
    required this.letter,
    required this.text,
    this.secondaryText,
    this.state = UIOptionState.normal,
    this.stateLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final (
      Color border,
      Color bg,
      Color accent,
      IconData? icon,
    ) = switch (state) {
      UIOptionState.normal => (UI.line, Colors.white, UI.muted, null),
      UIOptionState.selected => (
        UI.primary,
        UI.primarySoft,
        UI.primary,
        Icons.check_circle_rounded,
      ),
      UIOptionState.correct => (
        UI.successBright,
        UI.successSoft,
        UI.success,
        Icons.check_circle_rounded,
      ),
      UIOptionState.wrong => (
        UI.danger,
        UI.dangerSoft,
        UI.danger,
        Icons.cancel_rounded,
      ),
    };
    final active = state != UIOptionState.normal;
    return Semantics(
      button: onTap != null,
      selected: state == UIOptionState.selected,
      label: stateLabel,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(UI.radius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(UI.radius),
          child: Container(
            constraints: const BoxConstraints(minHeight: 58),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(UI.radius),
              border: Border.all(color: border, width: active ? 1.6 : 1.2),
            ),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: active ? accent : Colors.white,
                    border: Border.all(
                      color: active ? accent : UI.line,
                      width: 1.4,
                    ),
                  ),
                  child: Text(
                    letter,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: active ? Colors.white : UI.textSoft,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        text,
                        style: UI.body.copyWith(fontWeight: FontWeight.w500),
                      ),
                      if (secondaryText != null &&
                          secondaryText!.isNotEmpty &&
                          secondaryText != text)
                        Text(secondaryText!, style: UI.caption),
                    ],
                  ),
                ),
                if (stateLabel != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    stateLabel!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: accent,
                    ),
                  ),
                ],
                if (icon != null) ...[
                  const SizedBox(width: 6),
                  Icon(icon, color: accent, size: 22),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// States and sheets
// ---------------------------------------------------------------------------

class UIMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const UIMessage({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  const UIMessage.error({super.key, this.message, this.onAction})
    : icon = Icons.wifi_off_rounded,
      title = 'Something went wrong',
      actionLabel = 'Try again';

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: const Color(0xFF475569),
                size: 34,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
                letterSpacing: -0.4,
              ),
              textAlign: TextAlign.center,
            ),
            if (message != null && message!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: Text(
                  message!,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              SizedBox(
                width: 200,
                height: 48,
                child: OutlinedButton(
                  onPressed: onAction,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: UI.primary,
                    side: const BorderSide(
                      color: Color(0xFF0158FC),
                      width: 1.5,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    backgroundColor: const Color(0xFFEFF6FF),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (actionLabel!.toLowerCase().contains('try') ||
                          actionLabel!.toLowerCase().contains('again') ||
                          actionLabel!.toLowerCase().contains('retry')) ...[
                        const Icon(Icons.refresh_rounded, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        actionLabel!,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class UILoading extends StatelessWidget {
  const UILoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Center(child: CircularProgressIndicator(strokeWidth: 2.5)),
    );
  }
}

/// Shows a confirmation bottom sheet; resolves true when confirmed.
Future<bool> showUIConfirmSheet(
  BuildContext context, {
  required String title,
  String? message,
  Widget? body,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  Color? confirmColor,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(UI.gutter, 0, UI.gutter, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: UI.title),
            if (message != null) ...[
              const SizedBox(height: 6),
              Text(message, style: UI.body.copyWith(color: UI.muted)),
            ],
            if (body != null) ...[const SizedBox(height: 16), body],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: UIButton.secondary(
                    cancelLabel,
                    onPressed: () => Navigator.pop(context, false),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: UIButton(
                    confirmLabel,
                    color: confirmColor,
                    onPressed: () => Navigator.pop(context, true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  return result ?? false;
}

/// Honest notice for features the backend does not support yet.
Future<void> showUIComingSoon(
  BuildContext context, {
  required String title,
  required String message,
}) {
  return showModalBottomSheet<void>(
    context: context,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(UI.gutter, 0, UI.gutter, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const UIIconBadge(Icons.schedule_rounded, color: UI.gold, size: 52),
            const SizedBox(height: 12),
            Text(title, style: UI.heading, textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(message, style: UI.caption, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            UIButton('OK', onPressed: () => Navigator.pop(context)),
          ],
        ),
      ),
    ),
  );
}

/// Displays a branded, modern custom dialog box with centered icon badge,
/// title, optional description, custom content, and styled action buttons.
Future<T?> showUICustomDialog<T>(
  BuildContext context, {
  Widget? icon,
  Color? iconBgColor,
  Color? iconBorderColor,
  required String title,
  String? message,
  Widget? content,
  String primaryLabel = 'OK',
  VoidCallback? onPrimary,
  Color? primaryColor,
  String? secondaryLabel,
  VoidCallback? onSecondary,
  bool barrierDismissible = true,
}) {
  return showDialog<T>(
    context: context,
    barrierDismissible: barrierDismissible,
    builder: (ctx) {
      return Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1F0F172A),
                blurRadius: 32,
                offset: Offset(0, 12),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: iconBgColor ?? const Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: iconBorderColor ?? const Color(0xFFBFDBFE),
                      width: 2,
                    ),
                  ),
                  child: Center(child: icon),
                ),
                const SizedBox(height: 18),
              ],
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.3,
                ),
              ),
              if (message != null && message.trim().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                    height: 1.45,
                  ),
                ),
              ],
              if (content != null) ...[
                const SizedBox(height: 18),
                content,
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    if (onPrimary != null) {
                      onPrimary();
                    } else {
                      Navigator.pop(ctx);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor ?? const Color(0xFF0158FC),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    primaryLabel,
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              if (secondaryLabel != null) ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () {
                      if (onSecondary != null) {
                        onSecondary();
                      } else {
                        Navigator.pop(ctx);
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF475569),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      secondaryLabel,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    },
  );
}

/// Helper for showing a customized confirmation dialog.
Future<bool> showUIConfirmDialog(
  BuildContext context, {
  required String title,
  String? message,
  Widget? content,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  Color? confirmColor,
  Widget? icon,
}) async {
  final res = await showUICustomDialog<bool>(
    context,
    title: title,
    message: message,
    content: content,
    icon: icon ??
        const Icon(
          Icons.help_outline_rounded,
          color: Color(0xFF2563EB),
          size: 32,
        ),
    iconBgColor: const Color(0xFFEFF6FF),
    iconBorderColor: const Color(0xFFBFDBFE),
    primaryLabel: confirmLabel,
    primaryColor: confirmColor ?? const Color(0xFF0158FC),
    onPrimary: () => Navigator.pop(context, true),
    secondaryLabel: cancelLabel,
    onSecondary: () => Navigator.pop(context, false),
  );
  return res ?? false;
}

/// Helper for showing a customized error dialog with optional retry.
Future<void> showUIErrorDialog(
  BuildContext context, {
  String title = 'Error',
  required String message,
  String? retryLabel,
  VoidCallback? onRetry,
  String dismissLabel = 'Dismiss',
}) {
  return showUICustomDialog<void>(
    context,
    title: title,
    message: message,
    icon: const Icon(
      Icons.error_outline_rounded,
      color: Color(0xFFDC2626),
      size: 32,
    ),
    iconBgColor: const Color(0xFFFEF2F2),
    iconBorderColor: const Color(0xFFFECACA),
    primaryLabel: retryLabel ?? dismissLabel,
    primaryColor: retryLabel != null ? const Color(0xFF0158FC) : const Color(0xFFDC2626),
    onPrimary: () {
      Navigator.pop(context);
      if (onRetry != null) onRetry();
    },
    secondaryLabel: retryLabel != null ? dismissLabel : null,
    onSecondary: () => Navigator.pop(context),
  );
}

/// Helper for showing a customized success dialog.
Future<void> showUISuccessDialog(
  BuildContext context, {
  required String title,
  String? message,
  Widget? content,
  String buttonLabel = 'Continue',
  VoidCallback? onContinue,
}) {
  return showUICustomDialog<void>(
    context,
    title: title,
    message: message,
    content: content,
    icon: const Icon(
      Icons.check_circle_rounded,
      color: Color(0xFF059669),
      size: 32,
    ),
    iconBgColor: const Color(0xFFECFDF5),
    iconBorderColor: const Color(0xFFA7F3D0),
    primaryLabel: buttonLabel,
    primaryColor: const Color(0xFF059669),
    onPrimary: () {
      Navigator.pop(context);
      if (onContinue != null) onContinue();
    },
  );
}
