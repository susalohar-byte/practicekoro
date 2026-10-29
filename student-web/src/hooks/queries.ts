import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthProvider';
import * as catalog from '@/services/catalog';
import * as attempts from '@/services/attempts';
import * as account from '@/services/account';
import type { LeaderboardScope } from '@/types/models';

export const qk = {
  exams: ['exams'] as const,
  exam: (id: string) => ['exam', id] as const,
  subjects: ['subjects'] as const,
  topics: (subjectId: string | null) => ['topics', subjectId ?? 'all'] as const,
  examTests: (examId: string) => ['exam-tests', examId] as const,
  allTests: ['all-tests'] as const,
  topicTests: (topicId: string) => ['topic-tests', topicId] as const,
  test: (id: string) => ['test', id] as const,
  liveTests: ['live-tests'] as const,
  banners: ['banners'] as const,
  history: (uid: string) => ['attempt-history', uid] as const,
  inProgress: (uid: string) => ['attempts-in-progress', uid] as const,
  attempt: (id: string) => ['attempt', id] as const,
  rankings: (id: string) => ['attempt-rankings', id] as const,
  solutions: (id: string) => ['solutions', id] as const,
  leaderboard: (p: unknown) => ['leaderboard', p] as const,
  profile: (uid: string) => ['profile', uid] as const,
  plans: ['plans'] as const,
  subscription: (uid: string) => ['subscription', uid] as const,
  supportContact: ['support-contact'] as const,
  tickets: (uid: string) => ['tickets', uid] as const,
  ticketMessages: (ticketId: string) => ['ticket-messages', ticketId] as const,
  notifications: (uid: string) => ['notifications', uid] as const,
  bookmarks: (uid: string) => ['bookmarks', uid] as const,
};

const useUid = () => useAuth().user?.id ?? '';

export const useExams = () => useQuery({ queryKey: qk.exams, queryFn: catalog.fetchExams });
export const useExam = (id: string) =>
  useQuery({ queryKey: qk.exam(id), queryFn: () => catalog.fetchExam(id), enabled: !!id });
export const useSubjects = () => useQuery({ queryKey: qk.subjects, queryFn: catalog.fetchSubjects });
export const useTopics = (subjectId: string | null) =>
  useQuery({ queryKey: qk.topics(subjectId), queryFn: () => catalog.fetchTopics(subjectId) });
export const useExamTests = (examId: string) =>
  useQuery({ queryKey: qk.examTests(examId), queryFn: () => catalog.fetchExamTests(examId), enabled: !!examId });
export const useAllTests = () => useQuery({ queryKey: qk.allTests, queryFn: catalog.fetchAllTests });
export const useTopicTests = (topicId: string) =>
  useQuery({ queryKey: qk.topicTests(topicId), queryFn: () => catalog.fetchTopicTests(topicId), enabled: !!topicId });
export const useTest = (id: string) =>
  useQuery({ queryKey: qk.test(id), queryFn: () => catalog.fetchTest(id), enabled: !!id });
export const useLiveTests = () =>
  useQuery({ queryKey: qk.liveTests, queryFn: () => catalog.fetchLiveTests(), refetchInterval: 5 * 60_000 });
export const useBanners = () => useQuery({ queryKey: qk.banners, queryFn: catalog.fetchHomeBanners });

export function useAttemptHistory() {
  const id = useUid();
  return useQuery({ queryKey: qk.history(id), queryFn: () => attempts.fetchAttemptHistory(id), enabled: !!id });
}
export function useInProgressAttempts() {
  const id = useUid();
  return useQuery({ queryKey: qk.inProgress(id), queryFn: () => attempts.fetchInProgressAttempts(id), enabled: !!id });
}
export const useAttempt = (id: string) =>
  useQuery({ queryKey: qk.attempt(id), queryFn: () => attempts.fetchAttempt(id), enabled: !!id });
export const useAttemptRankings = (id: string, enabled = true) =>
  useQuery({
    queryKey: qk.rankings(id),
    queryFn: () => attempts.fetchAttemptRankings(id),
    enabled: !!id && enabled,
    retry: false,
  });
export const useSolutions = (id: string) =>
  useQuery({ queryKey: qk.solutions(id), queryFn: () => attempts.fetchSolutions(id), enabled: !!id });

export function useLeaderboard(p: {
  testId: string | null;
  scope: LeaderboardScope;
  district?: string | null;
  block?: string | null;
}) {
  return useQuery({ queryKey: qk.leaderboard(p), queryFn: () => account.fetchLeaderboard(p) });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.profile(user?.id ?? ''),
    queryFn: () => account.fetchProfile(user!),
    enabled: !!user,
  });
}
export const usePlans = () => useQuery({ queryKey: qk.plans, queryFn: account.fetchPlans });
export function useSubscription() {
  const id = useUid();
  return useQuery({ queryKey: qk.subscription(id), queryFn: account.fetchSubscription, enabled: !!id });
}
/** Pro access: the server's pass (get_student_subscription_details) is the source of truth. */
export function useIsPro(): boolean {
  const { data } = useSubscription();
  return account.isPassActive(data);
}
export const useSupportContact = () =>
  useQuery({ queryKey: qk.supportContact, queryFn: account.fetchSupportContact });
export function useTickets() {
  const id = useUid();
  return useQuery({ queryKey: qk.tickets(id), queryFn: () => account.fetchTickets(id), enabled: !!id });
}
export const useTicketMessages = (ticketId: string) =>
  useQuery({ queryKey: qk.ticketMessages(ticketId), queryFn: () => account.fetchTicketMessages(ticketId), enabled: !!ticketId });
export function useNotifications() {
  const id = useUid();
  return useQuery({ queryKey: qk.notifications(id), queryFn: account.fetchNotifications, enabled: !!id });
}
export function useBookmarks() {
  const id = useUid();
  return useQuery({ queryKey: qk.bookmarks(id), queryFn: () => account.fetchBookmarks(id), enabled: !!id });
}
