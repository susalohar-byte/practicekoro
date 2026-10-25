import 'dart:math' as math;
import 'package:flutter/material.dart';

// ============================================================================
// 1. HEADLINE WITH DECORATIVE BRUSH UNDERLINES & ACCENTS
// ============================================================================

/// Renders the 2-line impactful headline with the exact brush underline and
/// playful radiating accents seen in the reference design.
class OnboardingHeadline extends StatelessWidget {
  final int screenIndex; // 0: Prepare Better, 1: Practice Smarter, 2: Track Your Progress

  const OnboardingHeadline({
    super.key,
    required this.screenIndex,
  });

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (screenIndex == 0) {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Prepare',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              height: 1.15,
              letterSpacing: -0.6,
            ),
          ),
          Stack(
            alignment: Alignment.bottomCenter,
            clipBehavior: Clip.none,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 8.0),
                child: Text(
                  'Better',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0158FC), // PracticeKoro Brand Blue
                    height: 1.15,
                    letterSpacing: -0.6,
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                child: CustomPaint(
                  size: const Size(96, 8),
                  painter: _CurvedStrokePainter(color: const Color(0xFFFFB800)),
                ),
              ),
            ],
          ),
        ],
      );
    } else if (screenIndex == 1) {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Practice',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              height: 1.15,
              letterSpacing: -0.6,
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Stack(
                alignment: Alignment.bottomCenter,
                clipBehavior: Clip.none,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(bottom: 8.0),
                    child: Text(
                      'Smarter',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0158FC),
                        height: 1.15,
                        letterSpacing: -0.6,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    child: CustomPaint(
                      size: const Size(108, 8),
                      painter: _CurvedStrokePainter(color: const Color(0xFF00D084)),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 6),
              // Three mint-green radiating tick marks
              CustomPaint(
                size: const Size(18, 22),
                painter: _RadiatingTicksPainter(color: const Color(0xFF00D084)),
              ),
            ],
          ),
        ],
      );
    } else {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Track',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              height: 1.15,
              letterSpacing: -0.6,
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Stack(
                alignment: Alignment.bottomCenter,
                clipBehavior: Clip.none,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(bottom: 8.0),
                    child: Text(
                      'Your Progress',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 29,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0158FC),
                        height: 1.15,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -2,
                    child: CustomPaint(
                      size: const Size(185, 12),
                      painter: _ArrowScribblePainter(color: const Color(0xFFFFB800)),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              // Three golden radiating tick marks
              CustomPaint(
                size: const Size(16, 20),
                painter: _RadiatingTicksPainter(color: const Color(0xFFFFB800)),
              ),
            ],
          ),
        ],
      );
    }

    return FittedBox(
      fit: BoxFit.scaleDown,
      child: content,
    );
  }
}

class _CurvedStrokePainter extends CustomPainter {
  final Color color;

  _CurvedStrokePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(2, size.height * 0.7)
      ..quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.1,
        size.width - 2,
        size.height * 0.6,
      );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CurvedStrokePainter oldDelegate) =>
      oldDelegate.color != color;
}

class _RadiatingTicksPainter extends CustomPainter {
  final Color color;

  _RadiatingTicksPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Top tick
    canvas.drawLine(
      Offset(2, size.height * 0.25),
      Offset(size.width * 0.85, 2),
      paint,
    );
    // Middle tick
    canvas.drawLine(
      Offset(2, size.height * 0.55),
      Offset(size.width * 0.95, size.height * 0.50),
      paint,
    );
    // Bottom tick
    canvas.drawLine(
      Offset(2, size.height * 0.85),
      Offset(size.width * 0.85, size.height * 0.98),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _RadiatingTicksPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _ArrowScribblePainter extends CustomPainter {
  final Color color;

  _ArrowScribblePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    // Hand-drawn double wavy stroke
    final path = Path()
      ..moveTo(4, h * 0.65)
      ..cubicTo(w * 0.35, h * 0.25, w * 0.65, h * 0.75, w - 12, h * 0.40)
      ..moveTo(8, h * 0.85)
      ..cubicTo(w * 0.38, h * 0.55, w * 0.70, h * 0.85, w - 8, h * 0.45);

    canvas.drawPath(path, paint);

    // Arrowhead at right
    final arrowHead = Path()
      ..moveTo(w - 14, h * 0.15)
      ..lineTo(w - 2, h * 0.45)
      ..lineTo(w - 14, h * 0.75);

    canvas.drawPath(arrowHead, paint);
  }

  @override
  bool shouldRepaint(covariant _ArrowScribblePainter oldDelegate) =>
      oldDelegate.color != color;
}

// ============================================================================
// 2. SCREEN 1: PREPARE BETTER ILLUSTRATION
// ============================================================================

/// Mock test card resting on stacked 3D books (Blue & Yellow) with a 3D pencil.
class PrepareBetterIllustration extends StatelessWidget {
  const PrepareBetterIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 290,
      height: 290,
      child: CustomPaint(
        painter: _PrepareBetterPainter(),
      ),
    );
  }
}

class _PrepareBetterPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // --- 1. Soft Cloud Background Blob ---
    _drawCloudBlob(canvas, Rect.fromLTWH(w * 0.05, h * 0.06, w * 0.90, h * 0.86));

    // Confetti sparks
    _drawSparkles(
      canvas,
      [
        // Top-left yellow sparks
        _Spark(Offset(w * 0.10, h * 0.22), Offset(w * 0.14, h * 0.16), const Color(0xFFFFB800), 2.5),
        _Spark(Offset(w * 0.08, h * 0.32), Offset(w * 0.13, h * 0.30), const Color(0xFFFFB800), 2.5),
        // Top-right blue sparks
        _Spark(Offset(w * 0.88, h * 0.56), Offset(w * 0.93, h * 0.52), const Color(0xFF0158FC), 2.5),
        _Spark(Offset(w * 0.86, h * 0.65), Offset(w * 0.91, h * 0.67), const Color(0xFF0158FC), 2.5),
      ],
    );

    // --- 2. Bottom Yellow Book (Isometric Tilt) ---
    final yellowBookRect = Rect.fromCenter(
      center: Offset(w * 0.51, h * 0.75),
      width: w * 0.60,
      height: h * 0.18,
    );
    _draw3DBook(
      canvas,
      rect: yellowBookRect,
      coverColor: const Color(0xFFFFB800),
      coverDark: const Color(0xFFE5A100),
      spineOnLeft: true,
      tiltDegrees: -4,
    );

    // --- 3. Top Blue Book (Stacked on Yellow Book) ---
    final blueBookRect = Rect.fromCenter(
      center: Offset(w * 0.49, h * 0.65),
      width: w * 0.58,
      height: h * 0.18,
    );
    _draw3DBook(
      canvas,
      rect: blueBookRect,
      coverColor: const Color(0xFF0158FC),
      coverDark: const Color(0xFF0043C7),
      spineOnLeft: true,
      tiltDegrees: -10,
    );

    // --- 4. 3D Educational Pencil (Resting behind sheet on right) ---
    canvas.save();
    canvas.translate(w * 0.74, h * 0.48);
    canvas.rotate(-32 * math.pi / 180);
    _draw3DPencil(canvas, length: h * 0.42, thickness: w * 0.082);
    canvas.restore();

    // --- 5. Mock Test White Card (Tilted forward over books) ---
    canvas.save();
    canvas.translate(w * 0.42, h * 0.52);
    canvas.rotate(6 * math.pi / 180);
    _drawMockTestSheet(canvas, width: w * 0.46, height: h * 0.50);
    canvas.restore();
  }

  void _draw3DBook(
    Canvas canvas, {
    required Rect rect,
    required Color coverColor,
    required Color coverDark,
    required bool spineOnLeft,
    required double tiltDegrees,
  }) {
    canvas.save();
    canvas.translate(rect.center.dx, rect.center.dy);
    canvas.rotate(tiltDegrees * math.pi / 180);

    final bw = rect.width;
    final bh = rect.height;

    // Ambient drop shadow
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.12)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(-bw * 0.5, -bh * 0.45 + 8, bw, bh * 0.9),
        const Radius.circular(14),
      ),
      shadowPaint,
    );

    // Book Cover base
    final coverPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [coverColor, coverDark],
      ).createShader(Rect.fromLTWH(-bw * 0.5, -bh * 0.5, bw, bh));

    final bookRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-bw * 0.5, -bh * 0.5, bw, bh),
      const Radius.circular(14),
    );
    canvas.drawRRect(bookRRect, coverPaint);

    // White Pages Block (Right side indentation)
    final pagesPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFFFFFFF), Color(0xFFF1F5F9)],
      ).createShader(Rect.fromLTWH(-bw * 0.42, -bh * 0.35, bw * 0.88, bh * 0.70));

    final pagesRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-bw * 0.40, -bh * 0.32, bw * 0.88, bh * 0.64),
      const Radius.circular(6),
    );
    canvas.drawRRect(pagesRRect, pagesPaint);

    // Page edge grooves (subtle horizontal lines)
    final linePaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1.0;
    canvas.drawLine(
      Offset(-bw * 0.38, -bh * 0.08),
      Offset(bw * 0.46, -bh * 0.08),
      linePaint,
    );
    canvas.drawLine(
      Offset(-bw * 0.38, bh * 0.12),
      Offset(bw * 0.46, bh * 0.12),
      linePaint,
    );

    // Spine Highlight (3D cylinder effect on left)
    final spineHighlight = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.white.withValues(alpha: 0.35),
          Colors.white.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(-bw * 0.5, -bh * 0.5, bw * 0.12, bh));
    canvas.drawRRect(
      RRect.fromRectAndCorners(
        Rect.fromLTWH(-bw * 0.5, -bh * 0.5, bw * 0.10, bh),
        topLeft: const Radius.circular(14),
        bottomLeft: const Radius.circular(14),
      ),
      spineHighlight,
    );

    canvas.restore();
  }

  void _drawMockTestSheet(Canvas canvas, {required double width, required double height}) {
    // Drop shadow
    final shadowPaint = Paint()
      ..color = const Color(0xFF0F172A).withValues(alpha: 0.14)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(-width * 0.5, -height * 0.5 + 6, width, height),
        const Radius.circular(18),
      ),
      shadowPaint,
    );

    // White Sheet Card
    final cardPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    final borderPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final cardRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-width * 0.5, -height * 0.5, width, height),
      const Radius.circular(18),
    );
    canvas.drawRRect(cardRRect, cardPaint);
    canvas.drawRRect(cardRRect, borderPaint);

    // "Mock Test" Title
    final textPainter = TextPainter(
      text: const TextSpan(
        text: 'Mock Test',
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: Color(0xFF0F172A),
          letterSpacing: -0.3,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    textPainter.paint(
      canvas,
      Offset(-width * 0.5 + 16, -height * 0.5 + 16),
    );

    // Option 1: Radio button (unselected) + grey bar
    _drawRadioOption(
      canvas,
      center: Offset(-width * 0.5 + 24, -height * 0.5 + 46),
      barStart: Offset(-width * 0.5 + 38, -height * 0.5 + 46),
      barWidth: width * 0.52,
      isSelected: false,
    );

    // Option 2: Checked Radio button (Emerald Green with Checkmark) + grey bar
    _drawRadioOption(
      canvas,
      center: Offset(-width * 0.5 + 24, -height * 0.5 + 68),
      barStart: Offset(-width * 0.5 + 38, -height * 0.5 + 68),
      barWidth: width * 0.60,
      isSelected: true,
    );

    // Option 3: Radio button (unselected) + grey bar
    _drawRadioOption(
      canvas,
      center: Offset(-width * 0.5 + 24, -height * 0.5 + 90),
      barStart: Offset(-width * 0.5 + 38, -height * 0.5 + 90),
      barWidth: width * 0.44,
      isSelected: false,
    );

    // Option 4: Radio button (unselected) + shorter grey bar
    _drawRadioOption(
      canvas,
      center: Offset(-width * 0.5 + 24, -height * 0.5 + 112),
      barStart: Offset(-width * 0.5 + 38, -height * 0.5 + 112),
      barWidth: width * 0.36,
      isSelected: false,
    );
  }

  void _drawRadioOption(
    Canvas canvas, {
    required Offset center,
    required Offset barStart,
    required double barWidth,
    required bool isSelected,
  }) {
    if (isSelected) {
      // Emerald green filled circle
      final fillPaint = Paint()
        ..color = const Color(0xFF10B981)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, 7.5, fillPaint);

      // White checkmark
      final checkPaint = Paint()
        ..color = Colors.white
        ..strokeWidth = 2.0
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;
      final checkPath = Path()
        ..moveTo(center.dx - 3.5, center.dy)
        ..lineTo(center.dx - 1.0, center.dy + 2.5)
        ..lineTo(center.dx + 3.5, center.dy - 2.5);
      canvas.drawPath(checkPath, checkPaint);
    } else {
      // Grey circular outline
      final ringPaint = Paint()
        ..color = const Color(0xFFCBD5E1)
        ..strokeWidth = 2.2
        ..style = PaintingStyle.stroke;
      canvas.drawCircle(center, 7.0, ringPaint);
    }

    // Horizontal grey line bar
    final barPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 5.0
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(barStart, barStart + Offset(barWidth, 0), barPaint);
  }

  void _draw3DPencil(Canvas canvas, {required double length, required double thickness}) {
    final halfT = thickness * 0.5;

    // Eraser (Pink dome at top)
    final eraserPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFFF537E), Color(0xFFE11D48)],
      ).createShader(Rect.fromLTWH(-halfT, -length * 0.5, thickness, length * 0.16));
    canvas.drawRRect(
      RRect.fromRectAndCorners(
        Rect.fromLTWH(-halfT, -length * 0.5, thickness, length * 0.16),
        topLeft: Radius.circular(halfT),
        topRight: Radius.circular(halfT),
      ),
      eraserPaint,
    );

    // Silver Ferrule Band
    final ferrulePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFF1F5F9), Color(0xFFCBD5E1), Color(0xFF94A3B8)],
      ).createShader(Rect.fromLTWH(-halfT, -length * 0.34, thickness, length * 0.08));
    canvas.drawRect(
      Rect.fromLTWH(-halfT, -length * 0.34, thickness, length * 0.08),
      ferrulePaint,
    );

    // Yellow Hexagonal Body
    final bodyPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFFFFC000), Color(0xFFF59E0B), Color(0xFFD97706)],
      ).createShader(Rect.fromLTWH(-halfT, -length * 0.26, thickness, length * 0.50));
    canvas.drawRect(
      Rect.fromLTWH(-halfT, -length * 0.26, thickness, length * 0.50),
      bodyPaint,
    );

    // Sharpened Wooden Cone
    final woodPaint = Paint()..color = const Color(0xFFFEE685);
    final conePath = Path()
      ..moveTo(-halfT, length * 0.24)
      ..lineTo(halfT, length * 0.24)
      ..lineTo(0, length * 0.44)
      ..close();
    canvas.drawPath(conePath, woodPaint);

    // Graphite Lead Tip
    final leadPaint = Paint()..color = const Color(0xFF1E293B);
    final leadPath = Path()
      ..moveTo(-halfT * 0.35, length * 0.37)
      ..lineTo(halfT * 0.35, length * 0.37)
      ..lineTo(0, length * 0.44)
      ..close();
    canvas.drawPath(leadPath, leadPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ============================================================================
// 3. SCREEN 2: PRACTICE SMARTER ILLUSTRATION
// ============================================================================

/// Interactive Quiz card with floating Analytics and Lightbulb squircles.
class PracticeSmarterIllustration extends StatelessWidget {
  const PracticeSmarterIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 290,
      height: 290,
      child: CustomPaint(
        painter: _PracticeSmarterPainter(),
      ),
    );
  }
}

class _PracticeSmarterPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // --- 1. Soft Cloud Background Blob ---
    _drawCloudBlob(canvas, Rect.fromLTWH(w * 0.05, h * 0.06, w * 0.90, h * 0.86));

    // Accent sparks around
    _drawSparkles(
      canvas,
      [
        _Spark(Offset(w * 0.10, h * 0.38), Offset(w * 0.14, h * 0.33), const Color(0xFF0158FC), 2.5),
        _Spark(Offset(w * 0.08, h * 0.46), Offset(w * 0.13, h * 0.44), const Color(0xFF0158FC), 2.5),
      ],
    );

    // --- 2. Main White Quiz Card ---
    canvas.save();
    canvas.translate(w * 0.52, h * 0.52);
    canvas.rotate(3 * math.pi / 180);
    _drawMainQuizCard(canvas, width: w * 0.58, height: h * 0.60);
    canvas.restore();

    // --- 3. Floating 3D Amber Squircle (Bar Chart - Top Right) ---
    canvas.save();
    canvas.translate(w * 0.77, h * 0.31);
    canvas.rotate(14 * math.pi / 180);
    _drawSquircleCard(
      canvas,
      size: 56,
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFD97706)],
      ),
      shadowColor: const Color(0xFFF59E0B).withValues(alpha: 0.40),
      childPainter: (c) {
        // 3 Ascending white bars
        final barPaint = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.fill;
        c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-15, 2, 7, 12), const Radius.circular(3.5)), barPaint);
        c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-4, -5, 7, 19), const Radius.circular(3.5)), barPaint);
        c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(7, -12, 7, 26), const Radius.circular(3.5)), barPaint);
      },
    );
    canvas.restore();

    // --- 4. Floating 3D Lavender Squircle (Lightbulb - Bottom Left) ---
    canvas.save();
    canvas.translate(w * 0.24, h * 0.66);
    canvas.rotate(-8 * math.pi / 180);
    _drawSquircleCard(
      canvas,
      size: 58,
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFAF5FF), Color(0xFFEDE9FE)],
      ),
      shadowColor: const Color(0xFF8B5CF6).withValues(alpha: 0.22),
      childPainter: (c) {
        // Deep purple stylized lightbulb
        final bulbPaint = Paint()
          ..color = const Color(0xFF7C3AED)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.6
          ..strokeCap = StrokeCap.round;

        final fillBulb = Paint()
          ..color = const Color(0xFFC4B5FD).withValues(alpha: 0.35)
          ..style = PaintingStyle.fill;

        // Bulb globe
        c.drawCircle(const Offset(0, -5), 10, fillBulb);
        c.drawCircle(const Offset(0, -5), 10, bulbPaint);

        // Bulb base threads
        c.drawLine(const Offset(-4, 7), const Offset(4, 7), bulbPaint..strokeWidth = 2.2);
        c.drawLine(const Offset(-3, 11), const Offset(3, 11), bulbPaint);
      },
    );
    canvas.restore();
  }

  void _drawMainQuizCard(Canvas canvas, {required double width, required double height}) {
    // Drop shadow
    final shadowPaint = Paint()
      ..color = const Color(0xFF0F172A).withValues(alpha: 0.12)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(-width * 0.5, -height * 0.5 + 8, width, height),
        const Radius.circular(24),
      ),
      shadowPaint,
    );

    // White Card
    final cardPaint = Paint()..color = Colors.white;
    final cardRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-width * 0.5, -height * 0.5, width, height),
      const Radius.circular(24),
    );
    canvas.drawRRect(cardRRect, cardPaint);

    // Blue "Q" Badge at top left
    final qBadgePaint = Paint()
      ..color = const Color(0xFF0158FC)
      ..style = PaintingStyle.fill;
    final qBadgeRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-width * 0.5 + 16, -height * 0.5 + 18, 28, 28),
      const Radius.circular(8),
    );
    canvas.drawRRect(qBadgeRRect, qBadgePaint);

    final qPainter = TextPainter(
      text: const TextSpan(
        text: 'Q',
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: FontWeight.w900,
          color: Colors.white,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    qPainter.paint(canvas, Offset(-width * 0.5 + 23, -height * 0.5 + 21));

    // Question placeholder lines
    final barPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 5.0
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(-width * 0.5 + 54, -height * 0.5 + 24),
      Offset(width * 0.5 - 20, -height * 0.5 + 24),
      barPaint,
    );
    canvas.drawLine(
      Offset(-width * 0.5 + 54, -height * 0.5 + 36),
      Offset(width * 0.5 - 44, -height * 0.5 + 36),
      barPaint,
    );

    // Option 1: Highlighted Green Correct Answer Row
    final greenRowRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(-width * 0.5 + 16, -height * 0.5 + 58, width - 32, 34),
      const Radius.circular(10),
    );
    final greenFill = Paint()..color = const Color(0xFFDCFCE7);
    final greenBorder = Paint()
      ..color = const Color(0xFFA7F3D0)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(greenRowRect, greenFill);
    canvas.drawRRect(greenRowRect, greenBorder);

    // Green text placeholder bar inside option
    final insideBar = Paint()
      ..color = const Color(0xFF86EFAC).withValues(alpha: 0.6)
      ..strokeWidth = 5.0
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(-width * 0.5 + 28, -height * 0.5 + 75),
      Offset(-width * 0.5 + 92, -height * 0.5 + 75),
      insideBar,
    );

    // Green circular checkmark badge on right
    final checkCenter = Offset(width * 0.5 - 32, -height * 0.5 + 75);
    canvas.drawCircle(checkCenter, 7.5, Paint()..color = const Color(0xFF10B981));
    final checkPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    final checkPath = Path()
      ..moveTo(checkCenter.dx - 3.5, checkCenter.dy)
      ..lineTo(checkCenter.dx - 1.0, checkCenter.dy + 2.5)
      ..lineTo(checkCenter.dx + 3.5, checkCenter.dy - 2.5);
    canvas.drawPath(checkPath, checkPaint);

    // Option 2: Radio button + grey bar
    _drawRadioRow(canvas, -height * 0.5 + 108, width);

    // Option 3: Radio button + grey bar
    _drawRadioRow(canvas, -height * 0.5 + 138, width);
  }

  void _drawRadioRow(Canvas canvas, double y, double width) {
    final ringPaint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 2.2
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(Offset(-width * 0.5 + 26, y), 7.0, ringPaint);

    final barPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 5.0
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(-width * 0.5 + 42, y),
      Offset(width * 0.5 - 28, y),
      barPaint,
    );
  }

  void _drawSquircleCard(
    Canvas canvas, {
    required double size,
    required Gradient gradient,
    required Color shadowColor,
    required void Function(Canvas) childPainter,
  }) {
    final rect = Rect.fromCenter(center: Offset.zero, width: size, height: size);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(size * 0.32));

    // Shadow
    final shadowPaint = Paint()
      ..color = shadowColor
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14);
    canvas.drawRRect(rrect.shift(const Offset(0, 6)), shadowPaint);

    // Gradient Background
    final fillPaint = Paint()..shader = gradient.createShader(rect);
    canvas.drawRRect(rrect, fillPaint);

    // Render contents
    childPainter(canvas);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ============================================================================
// 4. SCREEN 3: TRACK YOUR PROGRESS ILLUSTRATION
// ============================================================================

/// 3D Growth Podium with 4 Ascending Columns, Swooping Arrow, Star & Checkmark.
class TrackProgressIllustration extends StatelessWidget {
  const TrackProgressIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 290,
      height: 290,
      child: CustomPaint(
        painter: _TrackProgressPainter(),
      ),
    );
  }
}

class _TrackProgressPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // --- 1. Soft Cloud Background Blob ---
    _drawCloudBlob(canvas, Rect.fromLTWH(w * 0.05, h * 0.06, w * 0.90, h * 0.86));

    // Decorative floating sparks & brackets
    _drawSparkles(
      canvas,
      [
        // Yellow bracket on left
        _Spark(Offset(w * 0.12, h * 0.52), Offset(w * 0.15, h * 0.49), const Color(0xFFFFB800), 2.5),
        _Spark(Offset(w * 0.12, h * 0.58), Offset(w * 0.15, h * 0.61), const Color(0xFFFFB800), 2.5),
        // Radiating sparks on right
        _Spark(Offset(w * 0.88, h * 0.50), Offset(w * 0.93, h * 0.47), const Color(0xFFFFB800), 2.5),
        _Spark(Offset(w * 0.87, h * 0.58), Offset(w * 0.92, h * 0.60), const Color(0xFFFFB800), 2.5),
      ],
    );

    // --- 2. Floating Podium Base (White Oval Platform) ---
    final baseRect = Rect.fromCenter(
      center: Offset(w * 0.50, h * 0.74),
      width: w * 0.72,
      height: h * 0.10,
    );
    final baseShadow = Paint()
      ..color = const Color(0xFF0F172A).withValues(alpha: 0.10)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    canvas.drawOval(baseRect.shift(const Offset(0, 8)), baseShadow);

    final basePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Colors.white, Color(0xFFF1F5F9)],
      ).createShader(baseRect);
    canvas.drawOval(baseRect, basePaint);

    // --- 3. 4 Ascending 3D Bar Columns ---
    // Bar 1: Lightest pale blue
    _draw3DColumn(
      canvas,
      x: w * 0.30,
      baseY: h * 0.74,
      width: 22,
      height: 32,
      colors: const [Color(0xFFE2E8F0), Color(0xFFCBD5E1)],
      topColor: const Color(0xFFF1F5F9),
    );

    // Bar 2: Soft Sky Blue
    _draw3DColumn(
      canvas,
      x: w * 0.44,
      baseY: h * 0.74,
      width: 24,
      height: 60,
      colors: const [Color(0xFFBFDBFE), Color(0xFF93C5FD)],
      topColor: const Color(0xFFDBEAFE),
    );

    // Bar 3: Royal Blue
    _draw3DColumn(
      canvas,
      x: w * 0.58,
      baseY: h * 0.74,
      width: 26,
      height: 90,
      colors: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
      topColor: const Color(0xFF60A5FA),
    );

    // Bar 4: Vibrant Brand Blue (Tallest)
    _draw3DColumn(
      canvas,
      x: w * 0.73,
      baseY: h * 0.74,
      width: 28,
      height: 122,
      colors: const [Color(0xFF0158FC), Color(0xFF0047C7)],
      topColor: const Color(0xFF2B7BFF),
    );

    // --- 4. Upward Swooping Growth Curve with 3D Arrowhead ---
    _drawGrowthArrow(canvas, w: w, h: h);

    // --- 5. Floating Green 3D Squircle (Checkmark - Top Left) ---
    canvas.save();
    canvas.translate(w * 0.28, h * 0.36);
    canvas.rotate(-10 * math.pi / 180);
    _drawCheckmarkSquircle(canvas, size: 58);
    canvas.restore();

    // Celebratory rays around checkmark
    _drawSparkles(
      canvas,
      [
        _Spark(Offset(w * 0.38, h * 0.28), Offset(w * 0.40, h * 0.24), const Color(0xFF10B981), 2.2),
        _Spark(Offset(w * 0.41, h * 0.32), Offset(w * 0.45, h * 0.30), const Color(0xFF00D084), 2.2),
      ],
    );

    // --- 6. Floating 3D Golden Star (Top Right) ---
    canvas.save();
    canvas.translate(w * 0.79, h * 0.30);
    canvas.rotate(16 * math.pi / 180);
    _drawGoldenStar(canvas, radius: 20);
    canvas.restore();
  }

  void _draw3DColumn(
    Canvas canvas, {
    required double x,
    required double baseY,
    required double width,
    required double height,
    required List<Color> colors,
    required Color topColor,
  }) {
    final halfW = width * 0.5;
    final topY = baseY - height;

    // Body shadow
    final shadowPaint = Paint()
      ..color = const Color(0xFF0F172A).withValues(alpha: 0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(x - halfW, topY + 4, width, height),
        const Radius.circular(6),
      ),
      shadowPaint,
    );

    // Front Column Body
    final bodyPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: colors,
      ).createShader(Rect.fromLTWH(x - halfW, topY, width, height));

    final columnRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(x - halfW, topY, width, height),
      const Radius.circular(6),
    );
    canvas.drawRRect(columnRRect, bodyPaint);

    // 3D Top Cap
    final capPaint = Paint()..color = topColor;
    final capRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(x - halfW + 1, topY + 1, width - 2, 7),
      const Radius.circular(3),
    );
    canvas.drawRRect(capRRect, capPaint);
  }

  void _drawGrowthArrow(Canvas canvas, {required double w, required double h}) {
    // Swooping Curved Blue Arc
    final curvePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
        colors: [Color(0xFF38BDF8), Color(0xFF0158FC)],
      ).createShader(Rect.fromLTWH(w * 0.35, h * 0.30, w * 0.45, h * 0.40))
      ..strokeWidth = 7.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final curvePath = Path()
      ..moveTo(w * 0.34, h * 0.67)
      ..cubicTo(w * 0.50, h * 0.62, w * 0.62, h * 0.48, w * 0.70, h * 0.36);

    canvas.drawPath(curvePath, curvePaint);

    // Bold 3D Arrowhead at end of curve
    final arrowPaint = Paint()
      ..color = const Color(0xFF0158FC)
      ..style = PaintingStyle.fill;

    final tip = Offset(w * 0.72, h * 0.33);
    final arrowHead = Path()
      ..moveTo(tip.dx, tip.dy)
      ..lineTo(tip.dx - 18, tip.dy + 3)
      ..lineTo(tip.dx - 12, tip.dy + 12)
      ..close();

    // Arrow shadow
    canvas.drawShadow(arrowHead, const Color(0xFF0158FC), 8, false);
    canvas.drawPath(arrowHead, arrowPaint);
  }

  void _drawCheckmarkSquircle(Canvas canvas, {required double size}) {
    final rect = Rect.fromCenter(center: Offset.zero, width: size, height: size);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(size * 0.32));

    // Shadow
    final shadowPaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.45)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16);
    canvas.drawRRect(rrect.shift(const Offset(0, 6)), shadowPaint);

    // Green Gradient
    final fillPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF34D399), Color(0xFF10B981), Color(0xFF059669)],
      ).createShader(rect);
    canvas.drawRRect(rrect, fillPaint);

    // Bold Crisp White Checkmark
    final checkPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 4.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final checkPath = Path()
      ..moveTo(-10, 0)
      ..lineTo(-3, 7)
      ..lineTo(10, -7);
    canvas.drawPath(checkPath, checkPaint);
  }

  void _drawGoldenStar(Canvas canvas, {required double radius}) {
    // Star Glow Shadow
    final shadowPaint = Paint()
      ..color = const Color(0xFFFFB800).withValues(alpha: 0.50)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14);

    final starPath = _createStarPath(radius);
    canvas.drawPath(starPath, shadowPaint);

    // 3D Golden Star Gradient
    final fillPaint = Paint()
      ..shader = const RadialGradient(
        center: Alignment(-0.2, -0.3),
        colors: [Color(0xFFFFF085), Color(0xFFFFB800), Color(0xFFF59E0B)],
      ).createShader(Rect.fromCircle(center: Offset.zero, radius: radius));

    canvas.drawPath(starPath, fillPaint);
  }

  Path _createStarPath(double outerRadius) {
    final innerRadius = outerRadius * 0.48;
    const numPoints = 5;
    final path = Path();
    const angleStep = math.pi / numPoints;

    for (var i = 0; i < numPoints * 2; i++) {
      final r = (i % 2 == 0) ? outerRadius : innerRadius;
      final angle = i * angleStep - math.pi / 2;
      final x = r * math.cos(angle);
      final y = r * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ============================================================================
// COMMON ILLUSTRATION HELPERS (CLOUD BACKGROUND & CONFETTI SPARKS)
// ============================================================================

void _drawCloudBlob(Canvas canvas, Rect bounds) {
  final paint = Paint()
    ..shader = const RadialGradient(
      center: Alignment(0, -0.1),
      radius: 0.85,
      colors: [Color(0xFFF0F6FF), Color(0xFFE8F2FE)],
    ).createShader(bounds);

  final w = bounds.width;
  final h = bounds.height;
  final l = bounds.left;
  final t = bounds.top;

  final path = Path()
    ..moveTo(l + w * 0.30, t + h * 0.15)
    ..cubicTo(l + w * 0.50, t + h * 0.05, l + w * 0.80, t + h * 0.12, l + w * 0.85, t + h * 0.35)
    ..cubicTo(l + w * 0.98, t + h * 0.50, l + w * 0.92, t + h * 0.75, l + w * 0.75, t + h * 0.88)
    ..cubicTo(l + w * 0.55, t + h * 0.98, l + w * 0.35, t + h * 0.95, l + w * 0.18, t + h * 0.82)
    ..cubicTo(l + w * 0.02, t + h * 0.70, l + w * 0.04, t + h * 0.40, l + w * 0.15, t + h * 0.28)
    ..close();

  // Diffuse soft glow
  final glowPaint = Paint()
    ..color = const Color(0xFF0158FC).withValues(alpha: 0.05)
    ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20);
  canvas.drawPath(path, glowPaint);
  canvas.drawPath(path, paint);
}

class _Spark {
  final Offset p1;
  final Offset p2;
  final Color color;
  final double strokeWidth;

  const _Spark(this.p1, this.p2, this.color, this.strokeWidth);
}

void _drawSparkles(Canvas canvas, List<_Spark> sparks) {
  for (final s in sparks) {
    final p = Paint()
      ..color = s.color
      ..strokeWidth = s.strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(s.p1, s.p2, p);
  }
}
