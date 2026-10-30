import type { LiveTest, LiveTestParticipant } from '@/types';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface RankingStudent {
  rank: number;
  studentId: string;
  name: string;
  district: string;
  location: string;
  avatar?: string;
  initials?: string;
  initialsBg?: string;
  testsAttempted: number;
  questionsAnswered: number;
  accuracy: number;
  avgScore: number;
  lastActive: string;
  subjectPerformance: {
    subject: string;
    scorePercent: number;
    barColor: string;
  }[];
  recentAttempts: {
    title: string;
    scorePercent: number;
    timeAgo: string;
    iconBg: string;
  }[];
}

export function rankingInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatRankingTimeAgo(val?: string | number | Date | null): string {
  if (!val) return 'Recently';
  const ms = typeof val === 'number' ? val : Date.parse(String(val));
  if (!ms || isNaN(ms)) return 'Recently';
  const diffMinutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.round(diffDays / 30)}mo ago`;
}

export const LIVE_SUBJECT_COLORS = ['#E11D48', '#2563EB', '#059669', '#D97706', '#7C3AED'];
export const LIVE_ICON_BG = [
  'bg-rose-50 text-rose-600',
  'bg-blue-50 text-blue-600',
  'bg-amber-50 text-amber-600',
];

export function mapLiveParticipantToRankingStudent(
  participant: LiveTestParticipant,
  liveTest?: LiveTest,
  rankOverride?: number
): RankingStudent {
  const name = (participant.fullName || 'Student').trim();
  const districtName = (participant.district || '').trim();
  const rawScore = Number(participant.score || 0);
  const rawAcc = Number(participant.accuracy || 0);
  const testTitle = liveTest?.title || 'Live Test';
  const examName = liveTest?.examTitle || liveTest?.test?.examTitle || 'Live Exam';
  const totalQ = liveTest?.totalQuestions || (rawScore > 0 ? 100 : 0);

  return {
    rank: rankOverride ?? (participant.rank || 1),
    studentId: `PK${String(participant.userId || participant.id)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase()}`,
    name,
    district: districtName || 'West Bengal',
    location: districtName ? `${districtName}, West Bengal` : 'West Bengal',
    avatar: participant.avatarUrl || undefined,
    initials: rankingInitials(name),
    initialsBg: 'bg-rose-100 text-rose-600 border border-rose-200',
    testsAttempted: 1,
    questionsAnswered: totalQ,
    accuracy: Math.round(rawAcc),
    avgScore: Math.round(rawScore),
    lastActive: formatRankingTimeAgo(participant.completedAt || participant.registeredAt),
    subjectPerformance: [
      {
        subject: examName,
        scorePercent: Math.round(rawAcc || rawScore),
        barColor: '#E11D48',
      },
    ],
    recentAttempts: [
      {
        title: testTitle,
        scorePercent: Math.round(rawScore),
        timeAgo: formatRankingTimeAgo(participant.completedAt || participant.registeredAt),
        iconBg: 'bg-rose-50 text-rose-600',
      },
    ],
  };
}

export function aggregateLiveParticipants(
  items: { participant: LiveTestParticipant; liveTest?: LiveTest }[]
): RankingStudent[] {
  const byUser = new Map<
    string,
    {
      userId: string;
      fullName: string;
      district: string;
      avatarUrl?: string;
      tests: { liveTest?: LiveTest; score: number; accuracy: number; completedAt?: string }[];
    }
  >();

  for (const item of items) {
    const p = item.participant;
    const uid = String(p.userId || p.id);
    const existing = byUser.get(uid);
    const testEntry = {
      liveTest: item.liveTest,
      score: Number(p.score || 0),
      accuracy: Number(p.accuracy || 0),
      completedAt: p.completedAt || p.registeredAt,
    };
    if (!existing) {
      byUser.set(uid, {
        userId: uid,
        fullName: p.fullName || 'Student',
        district: p.district || 'West Bengal',
        avatarUrl: p.avatarUrl,
        tests: [testEntry],
      });
    } else {
      if (!existing.avatarUrl && p.avatarUrl) existing.avatarUrl = p.avatarUrl;
      if (p.fullName && existing.fullName === 'Student') existing.fullName = p.fullName;
      if (p.district && existing.district === 'West Bengal') existing.district = p.district;
      existing.tests.push(testEntry);
    }
  }

  const students: RankingStudent[] = Array.from(byUser.values()).map((user) => {
    const testsCount = user.tests.length;
    const totalScore = user.tests.reduce((acc, t) => acc + t.score, 0);
    const totalAcc = user.tests.reduce((acc, t) => acc + t.accuracy, 0);
    const avgScore = Math.round(totalScore / Math.max(1, testsCount));
    const avgAcc = Math.round(totalAcc / Math.max(1, testsCount));
    const totalQuestions = user.tests.reduce(
      (acc, t) => acc + (t.liveTest?.totalQuestions || 100),
      0
    );

    const sortedTests = [...user.tests].sort((a, b) => {
      const at = a.completedAt ? Date.parse(a.completedAt) : 0;
      const bt = b.completedAt ? Date.parse(b.completedAt) : 0;
      return bt - at;
    });

    const latestCompleted = sortedTests[0]?.completedAt;

    return {
      rank: 1,
      studentId: `PK${user.userId
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase()}`,
      name: user.fullName,
      district: user.district,
      location: `${user.district}, West Bengal`,
      avatar: user.avatarUrl,
      initials: rankingInitials(user.fullName),
      initialsBg: 'bg-rose-100 text-rose-600 border border-rose-200',
      testsAttempted: testsCount,
      questionsAnswered: totalQuestions,
      accuracy: avgAcc,
      avgScore,
      lastActive: formatRankingTimeAgo(latestCompleted),
      subjectPerformance: sortedTests.slice(0, 3).map((t, idx) => ({
        subject: t.liveTest?.examTitle || t.liveTest?.title || 'Live Test',
        scorePercent: Math.round(t.score),
        barColor: LIVE_SUBJECT_COLORS[idx % LIVE_SUBJECT_COLORS.length],
      })),
      recentAttempts: sortedTests.slice(0, 3).map((t, idx) => ({
        title: t.liveTest?.title || 'Live Test',
        scorePercent: Math.round(t.score),
        timeAgo: formatRankingTimeAgo(t.completedAt),
        iconBg: LIVE_ICON_BG[idx % LIVE_ICON_BG.length],
      })),
    };
  });

  // Sort: avgScore DESC, accuracy DESC, testsAttempted DESC
  students.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.testsAttempted - a.testsAttempted;
  });

  students.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return students;
}
