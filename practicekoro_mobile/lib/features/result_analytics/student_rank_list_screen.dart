import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../core/components/user_avatar.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/ranking_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/models/student_profile_model.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/ranking_repository.dart';

enum RankScopeTab { globalRank, westBengal, districtRank }

class StudentRankListScreen extends ConsumerStatefulWidget {
  final String? initialTestId;
  final String? initialTestTitle;

  const StudentRankListScreen({
    super.key,
    this.initialTestId,
    this.initialTestTitle,
  });

  @override
  ConsumerState<StudentRankListScreen> createState() =>
      _StudentRankListScreenState();
}

class _StudentRankListScreenState extends ConsumerState<StudentRankListScreen> {
  /// Null until the student picks a test; then the latest attempted test.
  String? _selectedTestId;
  RankScopeTab _selectedTab = RankScopeTab.globalRank;
  String _selectedDistrict = 'Purulia';
  String _selectedBlock = 'All Blocks';
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _selectedTestId = widget.initialTestId;
    final profile = ref.read(studentProfileProvider);
    if (profile.district != null && profile.district!.trim().isNotEmpty) {
      _selectedDistrict = profile.district!.trim();
      if (profile.block != null && profile.block!.trim().isNotEmpty) {
        _selectedBlock = profile.block!.trim();
      }
    }
  }

  /// One entry per test the student actually finished, newest attempt first.
  static List<_AttemptedTest> _attemptedTests(List<TestAttemptModel> attempts) {
    final seen = <String>{};
    return [
      for (final a in attempts)
        if (a.testId.isNotEmpty && seen.add(a.testId)) _AttemptedTest(a),
    ];
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showTestPicker(List<_AttemptedTest> tests, String? selectedId) {
    if (tests.isEmpty) return;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    'Select Test',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                const Divider(),
                for (final test in tests)
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.assignment_turned_in_rounded,
                        color: Color(0xFFDC2626),
                        size: 20,
                      ),
                    ),
                    title: Text(
                      test.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14.5,
                      ),
                    ),
                    subtitle: Text(
                      test.subtitle,
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: selectedId == test.id
                        ? const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF0158FC),
                          )
                        : null,
                    onTap: () {
                      setState(() => _selectedTestId = test.id);
                      Navigator.pop(context);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(attemptHistoryProvider);
    final tests = _attemptedTests(historyAsync.value ?? const []);
    final selectedId = _selectedTestId ?? tests.firstOrNull?.id;
    final selected = tests.where((t) => t.id == selectedId).firstOrNull;
    final selectedTitle =
        selected?.title ?? widget.initialTestTitle ?? 'Select a test';

    final scopeStr = switch (_selectedTab) {
      RankScopeTab.globalRank => 'global',
      RankScopeTab.westBengal => 'west_bengal',
      RankScopeTab.districtRank => 'district',
    };

    final params = RankingParams(
      testId: selectedId ?? '',
      scope: scopeStr,
      district: _selectedTab == RankScopeTab.districtRank
          ? _selectedDistrict
          : null,
      block:
          _selectedTab == RankScopeTab.districtRank &&
              _selectedBlock != 'All Blocks'
          ? _selectedBlock
          : null,
    );

    // No test chosen yet: nothing to rank against.
    final AsyncValue<List<StudentRankItem>> ranksAsync = selectedId == null
        ? (historyAsync.hasError
              ? AsyncValue.error(historyAsync.error!, StackTrace.empty)
              : historyAsync.isLoading
              ? const AsyncValue.loading()
              : const AsyncValue.data([]))
        : ref.watch(studentRankListProvider(params));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(
            Icons.chevron_left_rounded,
            size: 28,
            color: Color(0xFF0F172A),
          ),
          onPressed: () {
            if (GoRouter.of(context).canPop()) {
              context.pop();
            } else {
              context.go('/results');
            }
          },
        ),
        title: const Text(
          'Student Rank List',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.filter_list_rounded,
              color: Color(0xFF0F172A),
            ),
            tooltip: 'Filter',
            onPressed: () => _showTestPicker(tests, selectedId),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                children: [
                  // Test Selector Card
                  _buildTestSelectorCard(
                    tests,
                    selectedId,
                    selectedTitle,
                    selected,
                  ),
                  const SizedBox(height: 14),

                  // Tabs: Global Rank, West Bengal, District Rank
                  _buildScopeTabs(),
                  const SizedBox(height: 14),

                  // District & Block dropdowns (Visible only on District Rank tab)
                  if (_selectedTab == RankScopeTab.districtRank) ...[
                    _buildDistrictAndBlockPickers(),
                    const SizedBox(height: 14),
                  ],

                  // Search Bar
                  _buildSearchBar(),
                  const SizedBox(height: 16),

                  // Table Header
                  _buildTableHeader(),
                  const SizedBox(height: 6),

                  // Ranked Students List
                  ranksAsync.when(
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(40),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                    error: (_, _) => Padding(
                      padding: const EdgeInsets.all(16),
                      child: UIMessage.error(
                        message: 'Could not load ranking data.',
                        onAction: () {
                          ref.invalidate(attemptHistoryProvider);
                          ref.invalidate(studentRankListProvider(params));
                        },
                      ),
                    ),
                    data: (ranks) {
                      if (ranks.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(32),
                          alignment: Alignment.center,
                          child: Text(
                            selectedId == null
                                ? 'Finish a test to see the student rank list.'
                                : 'No ranked students for this test yet.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }

                      final filtered = ranks.where((r) {
                        if (_searchQuery.isEmpty) return true;
                        final q = _searchQuery.toLowerCase();
                        return r.name.toLowerCase().contains(q) ||
                            r.rank.toString() == q ||
                            '#${r.rank}' == q;
                      }).toList();

                      if (filtered.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(32),
                          alignment: Alignment.center,
                          child: const Text(
                            'No students found matching your search',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }

                      return Column(
                        children: [
                          for (final item in filtered)
                            _RankStudentRow(item: item),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),

            // Pinned Current User Row at bottom
            ranksAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (ranks) {
                // Only the student's real row; absent until the server ranks them.
                final userItem = ranks
                    .where((r) => r.isCurrentUser)
                    .firstOrNull;
                if (userItem == null) return const SizedBox.shrink();
                return _PinnedCurrentUserRow(item: userItem);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTestSelectorCard(
    List<_AttemptedTest> tests,
    String? selectedId,
    String selectedTitle,
    _AttemptedTest? selected,
  ) {
    return InkWell(
      onTap: () => _showTestPicker(tests, selectedId),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x04000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.assignment_turned_in_rounded,
                color: Color(0xFFDC2626),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selectedTitle,
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  if (selected != null)
                    Text(
                      selected.subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_drop_down_rounded,
              size: 28,
              color: Color(0xFF64748B),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScopeTabs() {
    return Row(
      children: [
        Expanded(
          child: _TabButton(
            label: 'Global Rank',
            isSelected: _selectedTab == RankScopeTab.globalRank,
            onTap: () => setState(() => _selectedTab = RankScopeTab.globalRank),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _TabButton(
            label: 'West Bengal',
            isSelected: _selectedTab == RankScopeTab.westBengal,
            onTap: () => setState(() => _selectedTab = RankScopeTab.westBengal),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _TabButton(
            label: 'District Rank',
            isSelected: _selectedTab == RankScopeTab.districtRank,
            onTap: () =>
                setState(() => _selectedTab = RankScopeTab.districtRank),
          ),
        ),
      ],
    );
  }

  Widget _buildDistrictAndBlockPickers() {
    return Row(
      children: [
        // District Dropdown
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select District',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 44,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedDistrict,
                    isExpanded: true,
                    icon: const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: Color(0xFF64748B),
                    ),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                    items: StudentProfileModel.westBengalDistricts.map((d) {
                      return DropdownMenuItem<String>(
                        value: d,
                        child: Text(d, overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (newDistrict) {
                      if (newDistrict != null) {
                        setState(() {
                          _selectedDistrict = newDistrict;
                          _selectedBlock = 'All Blocks';
                        });
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),

        // Block Dropdown
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select Block',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 44,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: Builder(
                    builder: (context) {
                      final availableBlocks = [
                        'All Blocks',
                        ...StudentProfileModel.getBlocksForDistrict(
                          _selectedDistrict,
                        ),
                      ];
                      final effectiveBlock =
                          availableBlocks.contains(_selectedBlock)
                          ? _selectedBlock
                          : 'All Blocks';
                      return DropdownButton<String>(
                        value: effectiveBlock,
                        isExpanded: true,
                        icon: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: Color(0xFF64748B),
                        ),
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                        items: availableBlocks.map((b) {
                          return DropdownMenuItem<String>(
                            value: b,
                            child: Text(b, overflow: TextOverflow.ellipsis),
                          );
                        }).toList(),
                        onChanged: (newBlock) {
                          if (newBlock != null) {
                            setState(() => _selectedBlock = newBlock);
                          }
                        },
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val.trim()),
        style: const TextStyle(fontSize: 13.5, color: Color(0xFF0F172A)),
        decoration: InputDecoration(
          hintText: 'Search student name or rank...',
          hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          prefixIcon: const Icon(
            Icons.search_rounded,
            size: 20,
            color: Color(0xFF94A3B8),
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  tooltip: 'Close',
                  icon: const Icon(
                    Icons.close_rounded,
                    size: 18,
                    color: Color(0xFF94A3B8),
                  ),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildTableHeader() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 44,
            child: Text(
              'Rank',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          SizedBox(width: 44),
          Expanded(
            child: Text(
              'Student',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Text(
            'Score',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0158FC)
                : const Color(0xFFE2E8F0),
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF0158FC).withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
          maxLines: 1,
        ),
      ),
    );
  }
}

class _RankStudentRow extends StatelessWidget {
  final StudentRankItem item;

  const _RankStudentRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final isMe = item.isCurrentUser;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isMe ? const Color(0xFFBFDBFE) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Row(
        children: [
          // Rank Badge
          _buildRankBadge(item.rank),
          const SizedBox(width: 14),

          // Avatar
          _buildAvatar(item),
          const SizedBox(width: 12),

          // Student Name
          Expanded(
            child: Text(
              item.displayName,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isMe ? FontWeight.w800 : FontWeight.w700,
                color: isMe ? const Color(0xFF0158FC) : const Color(0xFF0F172A),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Actual Score in Marks (e.g. 192 / 200)
          Text(
            item.scoreDisplay,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    if (rank == 1) {
      return Container(
        width: 30,
        height: 30,
        decoration: const BoxDecoration(
          color: Color(0xFFFEF3C7),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥇', style: TextStyle(fontSize: 14)),
      );
    }
    if (rank == 2) {
      return Container(
        width: 30,
        height: 30,
        decoration: const BoxDecoration(
          color: Color(0xFFF1F5F9),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥈', style: TextStyle(fontSize: 14)),
      );
    }
    if (rank == 3) {
      return Container(
        width: 30,
        height: 30,
        decoration: const BoxDecoration(
          color: Color(0xFFFFEDD5),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥉', style: TextStyle(fontSize: 14)),
      );
    }
    return SizedBox(
      width: 30,
      height: 30,
      child: Center(
        child: Text(
          '$rank',
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w700,
            color: Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(StudentRankItem item) {
    if (item.isCurrentUser) {
      return const UserAvatar(size: 32);
    }
    return CircleAvatar(
      radius: 16,
      backgroundColor: const Color(0xFFE2E8F0),
      child: Text(
        item.name.isNotEmpty ? item.name[0].toUpperCase() : 'S',
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Color(0xFF334155),
        ),
      ),
    );
  }
}

class _PinnedCurrentUserRow extends StatelessWidget {
  final StudentRankItem item;

  const _PinnedCurrentUserRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        border: const Border(
          top: BorderSide(color: Color(0xFFBFDBFE), width: 1.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0158FC),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '#${item.rank}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 14),
          const UserAvatar(size: 34),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              item.displayName,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0158FC),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            item.scoreDisplay,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0158FC),
            ),
          ),
        ],
      ),
    );
  }
}

/// A test from the student's own history, offered in the test picker.
class _AttemptedTest {
  final TestAttemptModel attempt;

  const _AttemptedTest(this.attempt);

  String get id => attempt.testId;
  String get title =>
      attempt.testTitle.trim().isEmpty ? 'Test' : attempt.testTitle;

  String get subtitle {
    final marks = attempt.totalMarks == attempt.totalMarks.roundToDouble()
        ? attempt.totalMarks.toInt().toString()
        : attempt.totalMarks.toStringAsFixed(1);
    final parts = [
      DateFormat('d MMM yyyy').format(attempt.completedAt),
      if (attempt.totalMarks > 0) '$marks Marks',
      if (attempt.totalParticipants > 0)
        '${NumberFormat.decimalPattern('en_IN').format(attempt.totalParticipants)} Students',
    ];
    return parts.join(' • ');
  }
}
