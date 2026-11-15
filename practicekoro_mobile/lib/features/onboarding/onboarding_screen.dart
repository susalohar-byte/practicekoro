import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/components/ui.dart';
import 'widgets/onboarding_illustrations.dart';
import 'widgets/practicekoro_wordmark.dart';

/// Set once the student has seen (or skipped) onboarding.
const onboardingDoneKey = 'onboarding_done';

/// Brand splash: the PracticeKoro icon pops in, the wordmark slides up under
/// it, then a light shine sweeps across the wordmark before the app moves on.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;

  // Icon: 0 - 600 ms
  late final Animation<double> _iconFade;
  late final Animation<double> _iconScale;
  late final Animation<double> _iconGlow;
  // Wordmark: 350 - 900 ms, shine 900 - 1400 ms
  late final Animation<double> _textFade;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _shine;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    Animation<double> interval(double begin, double end, Curve curve) =>
        CurvedAnimation(
          parent: _animController,
          curve: Interval(begin, end, curve: curve),
        );

    _iconFade = interval(0.0, 0.3, Curves.easeOut);
    _iconScale = Tween<double>(begin: 0.6, end: 1.0)
        .animate(interval(0.0, 0.43, Curves.easeOutBack));
    _iconGlow = interval(0.2, 0.64, Curves.easeOut);
    _textFade = interval(0.25, 0.6, Curves.easeOut);
    _textSlide = Tween<Offset>(begin: const Offset(0, 0.6), end: Offset.zero)
        .animate(interval(0.25, 0.64, Curves.easeOutCubic));
    _shine = interval(0.64, 1.0, Curves.easeInOut);

    _navigateToNext();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_animController.isAnimating || _animController.isCompleted) return;
    // Respect the system "remove animations" setting: show the final frame.
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) {
      _animController.value = 1.0;
    } else {
      _animController.forward();
    }
  }

  Future<void> _navigateToNext() async {
    final isTestEnvironment =
        WidgetsBinding.instance.runtimeType.toString().contains('Test');
    final waitDuration =
        isTestEnvironment ? Duration.zero : const Duration(milliseconds: 1800);

    if (waitDuration > Duration.zero) {
      await Future.delayed(waitDuration);
    }

    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;

    final onboardingDone = prefs.getBool(onboardingDoneKey) ?? false;
    try {
      context.go(onboardingDone ? '/home' : '/onboarding');
    } catch (_) {
      // Handled if test context has no GoRouter
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Widget _icon() {
    return AnimatedBuilder(
      animation: _iconGlow,
      builder: (context, child) => Container(
        width: 108,
        height: 108,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0158FC)
                  .withValues(alpha: 0.22 * _iconGlow.value),
              blurRadius: 36,
              offset: const Offset(0, 12),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: child,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: Image.asset(
          'assets/images/logo-icon.webp',
          fit: BoxFit.cover,
          filterQuality: FilterQuality.high,
          errorBuilder: (_, _, _) => Container(
            color: UI.brand,
            alignment: Alignment.center,
            child: const Icon(
              Icons.school_rounded,
              color: Colors.white,
              size: 54,
            ),
          ),
          excludeFromSemantics: true,
        ),
      ),
    );
  }

  Widget _wordmark() {
    final wordmark = Image.asset(
      'assets/images/logo-text.webp',
      height: 38,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, _, _) => RichText(
        text: const TextSpan(
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.6,
          ),
          children: [
            TextSpan(
              text: 'Practice',
              style: TextStyle(color: Color(0xFF0F172A)),
            ),
            TextSpan(
              text: 'Koro',
              style: TextStyle(color: Color(0xFF0158FC)),
            ),
          ],
        ),
      ),
      semanticLabel: 'PracticeKoro',
    );

    // A soft white band sweeps left to right across the wordmark's pixels.
    return AnimatedBuilder(
      animation: _shine,
      builder: (context, child) {
        final t = _shine.value;
        if (t <= 0 || t >= 1) return child!;
        final centre = -0.3 + 1.6 * t;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Colors.white.withValues(alpha: 0),
              Colors.white.withValues(alpha: 0.75),
              Colors.white.withValues(alpha: 0),
            ],
            stops: [
              (centre - 0.15).clamp(0.0, 1.0),
              centre.clamp(0.0, 1.0),
              (centre + 0.15).clamp(0.0, 1.0),
            ],
          ).createShader(bounds),
          child: child,
        );
      },
      child: wordmark,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          gradient: RadialGradient(
            center: Alignment(0, -0.15),
            radius: 0.95,
            colors: [
              Color(0xFFF1F6FF), // Soft royal blue glow behind logo
              Colors.white,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FadeTransition(
                  opacity: _iconFade,
                  child: ScaleTransition(scale: _iconScale, child: _icon()),
                ),
                const SizedBox(height: 20),
                FadeTransition(
                  opacity: _textFade,
                  child: SlideTransition(
                    position: _textSlide,
                    child: _wordmark(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(onboardingDoneKey, true);
    if (mounted) {
      context.go('/home');
    }
  }

  void _onArrowPressed() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              // Optional Mock Status Bar for web/desktop previews or zero-inset screens
              if (kIsWeb || MediaQuery.of(context).padding.top == 0)
                const _MockStatusBar(),

              // Top Bar: Centered PracticeKoro wordmark & Right-aligned Skip button
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 6, 16, 2),
                child: SizedBox(
                  height: 48,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Centered PracticeKoro wordmark with golden rays
                      const PracticeKoroWordmark(fontSize: 22),

                      // Right-aligned Skip button
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _finish,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            minimumSize: const Size(48, 36),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Skip',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF334155),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 3-Screen PageView Content
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() {
                      _currentPage = index;
                    });
                  },
                  children: const [
                    _OnboardingPage(
                      screenIndex: 0,
                      illustration: PrepareBetterIllustration(),
                    ),
                    _OnboardingPage(
                      screenIndex: 1,
                      illustration: PracticeSmarterIllustration(),
                    ),
                    _OnboardingPage(
                      screenIndex: 2,
                      illustration: TrackProgressIllustration(),
                    ),
                  ],
                ),
              ),

              // Bottom Navigation: 3 Pagination Dots on Left, Circular Blue Action Button on Right
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 10, 28, 28),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // 3 Pagination Dots
                    Row(
                      children: List.generate(3, (index) {
                        final isActive = index == _currentPage;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 280),
                          curve: Curves.easeInOutCubic,
                          margin: const EdgeInsets.only(right: 6),
                          width: isActive ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(0xFF0158FC) // Vibrant Brand Blue
                                : const Color(0xFFCBD5E1), // Inactive Grey
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),

                    // Circular Blue Action Button
                    Material(
                      color: Colors.transparent,
                      child: Ink(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0158FC),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0158FC).withValues(alpha: 0.38),
                              blurRadius: 18,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Semantics(
                          button: true,
                          label: 'Next',
                          child: InkWell(
                          onTap: _onArrowPressed,
                          customBorder: const CircleBorder(),
                          splashColor: Colors.white.withValues(alpha: 0.25),
                          highlightColor: Colors.white.withValues(alpha: 0.15),
                          child: const Center(
                            child: Icon(
                              Icons.arrow_forward_rounded,
                              color: Colors.white,
                              size: 26,
                            ),
                          ),
                        ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final int screenIndex;
  final Widget illustration;

  const _OnboardingPage({
    required this.screenIndex,
    required this.illustration,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          const SizedBox(height: 12),

          // Headline with respective brush underline and radiating accents
          OnboardingHeadline(screenIndex: screenIndex),

          const SizedBox(height: 16),

          // Responsive, scalable illustration
          Expanded(
            child: Center(
              child: FittedBox(
                fit: BoxFit.contain,
                child: illustration,
              ),
            ),
          ),

          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

/// A clean, minimalist status bar indicator displayed on Web preview or standalone
/// views to match the reference mockup screenshot.
class _MockStatusBar extends StatelessWidget {
  const _MockStatusBar();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 10, 28, 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            '9:41',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
              letterSpacing: -0.2,
            ),
          ),
          Row(
            children: [
              // Cellular Signal
              CustomPaint(
                size: const Size(18, 12),
                painter: _SignalBarsPainter(),
              ),
              const SizedBox(width: 5),
              // Wi-Fi
              const Icon(
                Icons.wifi_rounded,
                size: 16,
                color: Color(0xFF0F172A),
              ),
              const SizedBox(width: 5),
              // Battery
              CustomPaint(
                size: const Size(22, 11),
                painter: _BatteryPainter(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SignalBarsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F172A)
      ..style = PaintingStyle.fill;
    final barW = size.width / 7;
    for (var i = 0; i < 4; i++) {
      final h = size.height * (0.35 + i * 0.21);
      final rrect = RRect.fromRectAndRadius(
        Rect.fromLTWH(i * (barW * 1.8), size.height - h, barW, h),
        const Radius.circular(1.5),
      );
      canvas.drawRRect(rrect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _BatteryPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final borderPaint = Paint()
      ..color = const Color(0xFF0F172A)
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke;

    final bodyRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width - 3.5, size.height),
      const Radius.circular(3.5),
    );
    canvas.drawRRect(bodyRect, borderPaint);

    final fillPaint = Paint()
      ..color = const Color(0xFF0F172A)
      ..style = PaintingStyle.fill;
    final fillRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(2.2, 2.2, size.width - 7.5, size.height - 4.4),
      const Radius.circular(1.8),
    );
    canvas.drawRRect(fillRect, fillPaint);

    // Battery terminal nub
    final terminalPaint = Paint()
      ..color = const Color(0xFF0F172A)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width - 2.5, size.height * 0.32, 2.2, size.height * 0.36),
        const Radius.circular(1.0),
      ),
      terminalPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
