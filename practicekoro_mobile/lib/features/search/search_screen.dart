import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/topic_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../exams/exam_logo.dart';
import '../practice/practice_common.dart';

/// One search across exams, subjects and topics.
class SearchScreen extends ConsumerStatefulWidget {
  final String? initialQuery;

  const SearchScreen({super.key, this.initialQuery});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.initialQuery ?? '',
  );
  late String _query = widget.initialQuery?.trim() ?? '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  static bool _match(String q, List<String?> fields) =>
      fields.any((f) => f != null && f.toLowerCase().contains(q));

  @override
  Widget build(BuildContext context) {
    final exams = ref.watch(examsProvider);
    final subjects = ref.watch(subjectsProvider);
    final topics = ref.watch(topicsProvider(null));
    final loading = exams.isLoading || subjects.isLoading || topics.isLoading;
    final failed = exams.hasError && subjects.hasError && topics.hasError;

    final q = _query.toLowerCase();
    final subjectList = subjects.value ?? const <SubjectModel>[];
    final examHits = q.isEmpty
        ? const <ExamModel>[]
        : (exams.value ?? const <ExamModel>[])
              .where((e) => _match(q, [e.title, e.category, e.description]))
              .toList();
    final subjectHits = q.isEmpty
        ? const <SubjectModel>[]
        : subjectList
              .where((s) => _match(q, [s.nameEnglish, s.nameBengali, s.slug]))
              .toList();
    final topicHits = q.isEmpty
        ? const <TopicModel>[]
        : (topics.value ?? const <TopicModel>[])
              .where((t) => _match(q, [t.title, t.titleBengali, t.slug]))
              .toList();
    String? subjectName(String id) =>
        subjectList.where((s) => s.id == id).firstOrNull?.nameEnglish;
    final total = examHits.length + subjectHits.length + topicHits.length;

    return UIPage(
      appBar: const UITitleBar('Search', fallbackRoute: '/home'),
      children: [
        UISearchField(
          hint: 'Search exams, subjects, topics',
          controller: _controller,
          autofocus: widget.initialQuery == null,
          onChanged: (v) => setState(() => _query = v.trim()),
        ),
        const SizedBox(height: 16),
        if (loading && q.isNotEmpty)
          const UILoading()
        else if (failed)
          UIMessage.error(
            message: 'Search data could not be loaded.',
            onAction: () {
              ref.invalidate(examsProvider);
              ref.invalidate(subjectsProvider);
              ref.invalidate(topicsProvider(null));
            },
          )
        else if (q.isEmpty)
          const UIMessage(
            icon: Icons.search_rounded,
            title: 'What do you want to practise?',
            message:
                'Try an exam like "WBP", a subject like "History", or a topic.',
          )
        else if (total == 0)
          UIMessage(
            icon: Icons.search_off_rounded,
            title: 'No results for "$_query"',
            message: 'Check the spelling or try a shorter word.',
          )
        else ...[
          if (examHits.isNotEmpty) ...[
            UISection(
              'Exams (${examHits.length})',
              padding: const EdgeInsets.only(bottom: 8),
            ),
            UIGroup(
              children: [
                for (final e in examHits)
                  UIRow(
                    leading: ExamLogo(e.title, iconUrl: e.iconName, size: 40),
                    title: e.title,
                    subtitle: e.category,
                    onTap: () => context.push('/exams/${e.id}'),
                  ),
              ],
            ),
          ],
          if (subjectHits.isNotEmpty) ...[
            UISection('Subjects (${subjectHits.length})'),
            UIGroup(
              children: [
                for (final (i, s) in subjectHits.indexed)
                  UIRow(
                    icon: subjectIcon(s.nameEnglish),
                    iconColor: UI.paletteAt(i),
                    title: s.nameEnglish,
                    subtitle: s.nameBengali,
                    onTap: () => context.push(
                      '/topic-tests?subjectId=${s.id}&subject=${Uri.encodeQueryComponent(s.nameEnglish)}',
                    ),
                  ),
              ],
            ),
          ],
          if (topicHits.isNotEmpty) ...[
            UISection('Topics (${topicHits.length})'),
            UIGroup(
              children: [
                for (final t in topicHits)
                  UIRow(
                    icon: Icons.topic_outlined,
                    iconColor: UI.purple,
                    title: t.title,
                    subtitle: subjectName(t.subjectId),
                    onTap: () => startTopicSession(context, t),
                  ),
              ],
            ),
          ],
        ],
      ],
    );
  }
}
