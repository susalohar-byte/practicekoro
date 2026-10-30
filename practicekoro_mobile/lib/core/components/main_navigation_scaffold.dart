import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'ui.dart';

/// Bottom navigation: Home, Practice, Exams, Results, Profile.
///
/// A floating rounded bar; the active tab becomes a filled blue pill.
class MainNavigationScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainNavigationScaffold({super.key, required this.navigationShell});

  static const _tabs = [
    (Icons.home_outlined, Icons.home_rounded, 'Home'),
    (Icons.play_circle_outline_rounded, Icons.play_circle_rounded, 'Practice'),
    (Icons.description_outlined, Icons.description_rounded, 'Exams'),
    (Icons.bar_chart_outlined, Icons.bar_chart_rounded, 'Results'),
    (Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final current = navigationShell.currentIndex;
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.only(bottom: 10),
        child: Container(
          height: 66,
          margin: const EdgeInsets.fromLTRB(12, 0, 12, 0),
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(33),
            border: Border.all(color: UI.line),
            boxShadow: const [BoxShadow(color: Color(0x1A1F3A8A), blurRadius: 24, offset: Offset(0, 8))],
          ),
          child: Row(
            children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  // The active pill takes a little more room so its label fits beside the icon.
                  flex: i == current ? 13 : 10,
                  child: _NavItem(
                    icon: i == current ? _tabs[i].$2 : _tabs[i].$1,
                    label: _tabs[i].$3,
                    selected: i == current,
                    onTap: () => navigationShell.goBranch(i, initialLocation: i == current),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      label: label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: selected ? UI.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 23, color: selected ? Colors.white : UI.muted),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.fade,
                softWrap: false,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? Colors.white : UI.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
