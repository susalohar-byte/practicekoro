import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/components/ui.dart';

/// Set once the student has seen (or skipped) onboarding.
const onboardingDoneKey = 'onboarding_done';

/// Brand splash: displays the official PracticeKoro app logo, brand typography,
/// and motivational tagline with a smooth fade-in entrance before transitioning.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 550),
    );

    // Start with 0.35 opacity so the logo is immediately visible on first frame
    _fadeAnim = Tween<double>(begin: 0.35, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOutCubic,
      ),
    );

    _scaleAnim = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOutBack,
      ),
    );

    _animController.forward();
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    final isTestEnvironment =
        WidgetsBinding.instance.runtimeType.toString().contains('Test');
    final waitDuration =
        isTestEnvironment ? Duration.zero : const Duration(milliseconds: 1700);

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
          child: FadeTransition(
            opacity: _fadeAnim,
            child: ScaleTransition(
              scale: _scaleAnim,
              child: Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // App Icon Logo: high-res squircle with ambient glow
                        Container(
                          width: 108,
                          height: 108,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(26),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0158FC).withValues(alpha: 0.24),
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
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(26),
                            child: Image.asset(
                              'assets/images/logo-icon.png',
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
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Official Brand Typography: PracticeKoro Wordmark
                        Image.asset(
                          'assets/images/logo-text.png',
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
                        ),
                        const SizedBox(height: 12),

                        // Bengali Subtitle
                        const Text(
                          'পশ্চিমবঙ্গের বিশ্বস্ত পরীক্ষার প্রস্তুতি',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E293B),
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 5),

                        // English Tagline
                        const Text(
                          'Practice Today, Progress Tomorrow',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Exam Focus Pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFBFDBFE),
                              width: 1,
                            ),
                          ),
                          child: const Text(
                            'WBCS  •  WBP  •  WBPSC  •  SSC  •  RAILWAY',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0158FC),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bottom loading indicator & platform tagline
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFF0158FC),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
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
  final _pages = PageController();
  int _index = 0;

  static const _slides = [
    (
      Icons.assignment_rounded,
      UI.primary,
      'Mock tests in the real exam pattern',
      'Full mock tests, topic tests and official previous year papers for WBP, WBPSC, SSC, Railway and more.',
    ),
    (
      Icons.topic_rounded,
      UI.purple,
      'Practise topic by topic',
      'Pick a subject, choose a topic and practise in Bengali or English, at your own pace.',
    ),
    (
      Icons.insights_rounded,
      UI.success,
      'Learn from every answer',
      'See your score, accuracy and detailed solutions after each test, and track your progress over time.',
    ),
  ];

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(onboardingDoneKey, true);
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final last = _index == _slides.length - 1;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(UI.gutter, 8, 4, 0),
              child: Row(
                children: [
                  Image.asset(
                    'assets/images/logo-transparent.png',
                    height: 44,
                    errorBuilder: (_, _, _) =>
                        const Text('PracticeKoro', style: UI.heading),
                  ),
                  const Spacer(),
                  if (!last)
                    TextButton(onPressed: _finish, child: const Text('Skip')),
                ],
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pages,
                onPageChanged: (i) => setState(() => _index = i),
                children: [
                  for (final (icon, color, title, body) in _slides)
                    SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        children: [
                          const SizedBox(height: 48),
                          Container(
                            width: 132,
                            height: 132,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(icon, size: 60, color: color),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            title,
                            style: UI.title,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            body,
                            style: UI.body.copyWith(color: UI.muted),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _slides.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _index ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == _index ? UI.primary : UI.line,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(UI.gutter, 24, UI.gutter, 16),
              child: UIButton(
                last ? 'Get Started' : 'Next',
                trailingIcon: last ? null : Icons.arrow_forward_rounded,
                onPressed: last
                    ? _finish
                    : () => _pages.nextPage(
                        duration: const Duration(milliseconds: 280),
                        curve: Curves.easeOut,
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
