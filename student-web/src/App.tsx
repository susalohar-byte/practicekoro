import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { GuestOnly, RequireAuth } from '@/auth/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { FullPageLoader, Loader } from '@/components/ui/Feedback';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SignUpPage = lazy(() => import('@/features/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('@/features/auth/AuthCallbackPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'));

const HomePage = lazy(() => import('@/features/home/HomePage'));
const PracticePage = lazy(() => import('@/features/practice/PracticePage'));
const SubjectChaptersPage = lazy(() => import('@/features/practice/SubjectChaptersPage'));
const TopicTestsPage = lazy(() => import('@/features/practice/TopicTestsPage'));
const ExamsPage = lazy(() => import('@/features/exams/ExamsPage'));
const ExamTestsPage = lazy(() => import('@/features/exams/ExamTestsPage'));
const TestDetailsPage = lazy(() => import('@/features/exams/TestDetailsPage'));
const LiveTestsPage = lazy(() => import('@/features/exams/LiveTestsPage'));
const PyqPage = lazy(() => import('@/features/exams/PyqPage'));
const TestRunnerPage = lazy(() => import('@/features/test-runner/TestRunnerPage'));
const ResultsPage = lazy(() => import('@/features/results/ResultsPage'));
const ResultPage = lazy(() => import('@/features/results/ResultPage'));
const SolutionsPage = lazy(() => import('@/features/results/SolutionsPage'));
const RankListPage = lazy(() => import('@/features/results/RankListPage'));
const TestHistoryPage = lazy(() => import('@/features/results/TestHistoryPage'));
const ProgressPage = lazy(() => import('@/features/results/ProgressPage'));
const BookmarksPage = lazy(() => import('@/features/results/BookmarksPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const EditProfilePage = lazy(() => import('@/features/profile/EditProfilePage'));
const SettingsPage = lazy(() => import('@/features/profile/SettingsPage'));
const HelpPage = lazy(() => import('@/features/support/HelpPage'));
const NotificationsPage = lazy(() => import('@/features/home/NotificationsPage'));
const SearchPage = lazy(() => import('@/features/home/SearchPage'));
const PlansPage = lazy(() => import('@/features/subscription/PlansPage'));
const CheckoutPage = lazy(() => import('@/features/subscription/CheckoutPage'));
const NotFoundPage = lazy(() => import('@/features/home/NotFoundPage'));

/** Old app paths keep working (e.g. /results/detail/:id from shared links). */
function Redirect({ to }: { to: (p: Record<string, string | undefined>) => string }) {
  const params = useParams();
  return <Navigate to={to(params)} replace />;
}

const page = (el: ReactNode) => <Suspense fallback={<Loader />}>{el}</Suspense>;

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login-callback" element={<AuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          {/* Full-screen exam interface, outside the navigation shell. */}
          <Route path="/test/:testId/active" element={<TestRunnerPage />} />

          <Route element={<AppShell />}>
            <Route path="/home" element={page(<HomePage />)} />
            <Route path="/practice" element={page(<PracticePage />)} />
            <Route path="/topic-tests" element={page(<SubjectChaptersPage />)} />
            <Route path="/topic/:topicId/tests" element={page(<TopicTestsPage />)} />
            <Route path="/exams" element={page(<ExamsPage />)} />
            <Route path="/exams/:examId" element={page(<ExamTestsPage />)} />
            <Route path="/test/:testId/details" element={page(<TestDetailsPage />)} />
            <Route path="/live-tests" element={page(<LiveTestsPage />)} />
            <Route path="/pyq" element={page(<PyqPage />)} />
            <Route path="/results" element={page(<ResultsPage />)} />
            <Route path="/results/rankings" element={page(<RankListPage />)} />
            <Route path="/results/detail/:attemptId" element={<Redirect to={(p) => `/result/${p.attemptId}`} />} />
            <Route path="/results/review/:attemptId" element={<Redirect to={(p) => `/solutions/${p.attemptId}`} />} />
            <Route path="/results/solution/:attemptId" element={<Redirect to={(p) => `/solutions/${p.attemptId}`} />} />
            <Route path="/result/:attemptId" element={page(<ResultPage />)} />
            <Route path="/solutions/:attemptId" element={page(<SolutionsPage />)} />
            <Route path="/test-history" element={page(<TestHistoryPage />)} />
            <Route path="/progress" element={page(<ProgressPage />)} />
            <Route path="/bookmarks" element={page(<BookmarksPage />)} />
            <Route path="/profile" element={page(<ProfilePage />)} />
            <Route path="/profile/edit" element={page(<EditProfilePage />)} />
            <Route path="/settings" element={page(<SettingsPage />)} />
            <Route path="/help" element={page(<HelpPage />)} />
            <Route path="/notifications" element={page(<NotificationsPage />)} />
            <Route path="/search" element={page(<SearchPage />)} />
            <Route path="/plans" element={page(<PlansPage />)} />
            <Route path="/checkout/:planId" element={page(<CheckoutPage />)} />
            <Route path="/tests" element={<Navigate to="/exams" replace />} />
            <Route path="*" element={page(<NotFoundPage />)} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
