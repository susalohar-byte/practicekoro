import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Image of an MCQ answer option (diagram, figure or pattern). Options can be text only,
/// image only, or text plus image; this shows the image part, scaled to fit the option.
class OptionImage extends StatelessWidget {
  final String url;
  final String label;

  const OptionImage({super.key, required this.url, required this.label});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: 'Option $label image',
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 180),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.contain,
            alignment: Alignment.centerLeft,
            placeholder: (_, _) => const SizedBox(
              height: 64,
              width: 64,
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
            errorWidget: (_, _, _) => const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Icon(
                Icons.broken_image_outlined,
                color: Color(0xFF94A3B8),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Image of a question (figure, table or diagram, or the whole question as an image).
class QuestionImage extends StatelessWidget {
  final String url;

  const QuestionImage({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: 'Question figure',
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 280),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.contain,
            alignment: Alignment.centerLeft,
            placeholder: (_, _) => const SizedBox(
              height: 120,
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
            errorWidget: (_, _, _) => const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Icon(Icons.broken_image_outlined, color: Color(0xFF94A3B8)),
            ),
          ),
        ),
      ),
    );
  }
}
