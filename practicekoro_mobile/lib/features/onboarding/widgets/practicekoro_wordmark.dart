import 'package:flutter/material.dart';

/// The official PracticeKoro brand wordmark with signature golden sunburst rays.
/// Matches the reference onboarding design: "Practice" in dark navy,
/// "Koro" in vibrant brand blue, and 3 playful sunrays at the top-right of 'o'.
class PracticeKoroWordmark extends StatelessWidget {
  final double fontSize;
  final String secondWord;

  const PracticeKoroWordmark({
    super.key,
    this.fontSize = 22.0,
    this.secondWord = 'Koro',
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Practice$secondWord',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(
            TextSpan(
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: fontSize,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.6,
                height: 1.1,
              ),
              children: [
                const TextSpan(
                  text: 'Practice',
                  style: TextStyle(
                    color: Color(0xFF0F172A), // Dark navy
                  ),
                ),
                TextSpan(
                  text: secondWord,
                  style: const TextStyle(
                    color: Color(0xFF0158FC), // Vibrant PracticeKoro Brand Blue
                  ),
                ),
              ],
            ),
          ),
          // Playful golden sunburst rays at top-right
          Transform.translate(
            offset: Offset(fontSize * 0.08, -fontSize * 0.14),
            child: CustomPaint(
              size: Size(fontSize * 0.65, fontSize * 0.65),
              painter: _SunburstRaysPainter(),
            ),
          ),
        ],
      ),
    );
  }
}

/// Backwards compatibility alias
typedef PracticeKaroWordmark = PracticeKoroWordmark;

class _SunburstRaysPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFFFB800) // Warm playful yellow
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    // Ray 1: Top ray (slightly angled up)
    canvas.drawLine(
      Offset(w * 0.35, h * 0.40),
      Offset(w * 0.55, h * 0.10),
      paint,
    );

    // Ray 2: Middle ray (pointing diagonal to 2 o'clock)
    canvas.drawLine(
      Offset(w * 0.45, h * 0.55),
      Offset(w * 0.90, h * 0.35),
      paint,
    );

    // Ray 3: Bottom ray (pointing horizontal to 3 o'clock)
    canvas.drawLine(
      Offset(w * 0.40, h * 0.75),
      Offset(w * 0.82, h * 0.78),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
