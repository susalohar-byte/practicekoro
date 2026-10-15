import { AppRouteLoadingFallback } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

const Login = lazyWithRetry(() =>
  import('@/pages/auth/Login').then((module) => ({ default: module.Login }))
);
const ForgotPassword = lazyWithRetry(() =>
  import('@/pages/auth/ForgotPassword').then((module) => ({ default: module.ForgotPassword }))
);
const ResetPassword = lazyWithRetry(() =>
  import('@/pages/auth/ResetPassword').then((module) => ({ default: module.ResetPassword }))
);
const AdminDashboard = lazyWithRetry(() =>
  import('@/pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const AdminExams = lazyWithRetry(() =>
  import('@/pages/admin/AdminExams').then((module) => ({ default: module.AdminExams }))
);
const AdminBanners = lazyWithRetry(() =>
  import('@/pages/admin/AdminBanners').then((module) => ({ default: module.AdminBanners }))
);
const AdminTestSeries = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestSeries').then((module) => ({ default: module.AdminTestSeries }))
);
const AdminTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminTests').then((module) => ({ default: module.AdminTests }))
);
const AdminTestQuestions = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestQuestions').then((module) => ({
    default: module.AdminTestQuestions,
  }))
);
const AdminSubscriptions = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubscriptions').then((module) => ({
    default: module.AdminSubscriptions,
  }))
);

const AdminQuestionBank = lazyWithRetry(() =>
  import('@/pages/admin/AdminQuestionBank').then((module) => ({
    default: module.AdminQuestionBank,
  }))
);
const AdminNotifications = lazyWithRetry(() =>
  import('@/pages/admin/AdminNotifications').then((module) => ({
    default: module.AdminNotifications,
  }))
);
const AdminSupport = lazyWithRetry(() =>
  import('@/pages/admin/AdminSupport').then((module) => ({
    default: module.AdminSupport,
  }))
);
const AdminSettings = lazyWithRetry(() =>
  import('@/pages/admin/AdminSettings').then((module) => ({
    default: module.AdminSettings,
  }))
);
const AdminCoupons = lazyWithRetry(() =>
  import('@/pages/admin/AdminCoupons').then((module) => ({
    default: module.AdminCoupons,
  }))
);
const AdminStaff = lazyWithRetry(() =>
  import('@/pages/admin/AdminStaff').then((module) => ({
    default: module.AdminStaff,
  }))
);
const AdminAuditLogs = lazyWithRetry(() =>
  import('@/pages/admin/AdminAuditLogs').then((module) => ({
    default: module.AdminAuditLogs,
  }))
);
const AdminSubjects = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubjects').then((module) => ({
    default: module.AdminSubjects,
  }))
);
const AdminTopics = lazyWithRetry(() =>
  import('@/pages/admin/AdminTopics').then((module) => ({
    default: module.AdminTopics,
  }))
);
const AdminStudents = lazyWithRetry(() =>
  import('@/pages/admin/AdminStudents').then((module) => ({
    default: module.AdminStudents,
  }))
);
const AdminTestAttempts = lazyWithRetry(() =>
  import('@/pages/admin/AdminTestAttempts').then((module) => ({
    default: module.AdminTestAttempts,
  }))
);
const AdminRankings = lazyWithRetry(() =>
  import('@/pages/admin/AdminRankings').then((module) => ({
    default: module.AdminRankings,
  }))
);
const AdminDistrictRankings = lazyWithRetry(() =>
  import('@/pages/admin/AdminDistrictRankings').then((module) => ({
    default: module.AdminDistrictRankings,
  }))
);
const AdminPerformance = lazyWithRetry(() =>
  import('@/pages/admin/AdminPerformance').then((module) => ({
    default: module.AdminPerformance,
  }))
);
const AdminCutoff = lazyWithRetry(() =>
  import('@/pages/admin/AdminCutoff').then((module) => ({
    default: module.AdminCutoff,
  }))
);
const AdminPayments = lazyWithRetry(() =>
  import('@/pages/admin/AdminPayments').then((module) => ({
    default: module.AdminPayments,
  }))
);
const AdminSubscriptionPlans = lazyWithRetry(() =>
  import('@/pages/admin/AdminSubscriptionPlans').then((module) => ({
    default: module.AdminSubscriptionPlans,
  }))
);
const AdminAnalytics = lazyWithRetry(() =>
  import('@/pages/admin/AdminAnalytics').then((module) => ({
    default: module.AdminAnalytics,
  }))
);
const AdminItemAnalysis = lazyWithRetry(() =>
  import('@/pages/admin/AdminItemAnalysis').then((module) => ({
    default: module.AdminItemAnalysis,
  }))
);
const AdminLiveTests = lazyWithRetry(() =>
  import('@/pages/admin/AdminLiveTests').then((module) => ({
    default: module.AdminLiveTests,
  }))
);
const AdminBlog = lazyWithRetry(() =>
  import('@/pages/admin/AdminBlog').then((module) => ({
    default: module.AdminBlog,
  }))
);

export const App: React.FC = () => {
  return (
    <React.Suspense fallback={<AppRouteLoadingFallback />}>
      <Routes>
        {/* The admin console is the only application surface. */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Auth Public-Only Routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* 1. DASHBOARD */}
          <Route index element={<AdminDashboard />} />

          {/* 2. CONTENT */}
          <Route
            path="question-bank"
            element={
              <AdminRoute requiredPermission="canManageQuestions">
                <AdminQuestionBank />
              </AdminRoute>
            }
          />
          <Route
            path="test-series"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestSeries />
              </AdminRoute>
            }
          />
          <Route
            path="mock-tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTests />
              </AdminRoute>
            }
          />
          <Route
            path="tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTests />
              </AdminRoute>
            }
          />
          <Route
            path="tests/:testId/questions"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="test-questions"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="test-questions/:testId"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="exams"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminExams />
              </AdminRoute>
            }
          />
          <Route
            path="subjects"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminSubjects />
              </AdminRoute>
            }
          />
          <Route
            path="topics"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminTopics />
              </AdminRoute>
            }
          />
          <Route
            path="live-tests"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminLiveTests />
              </AdminRoute>
            }
          />
          <Route
            path="banners"
            element={
              <AdminRoute requiredPermission="canManageExams">
                <AdminBanners />
              </AdminRoute>
            }
          />
          <Route
            path="blog"
            element={
              <AdminRoute requiredPermission="canManageSettings">
                <AdminBlog />
              </AdminRoute>
            }
          />

          {/* 3. STUDENTS */}
          <Route
            path="students"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminStudents />
              </AdminRoute>
            }
          />
          <Route
            path="test-attempts"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminTestAttempts />
              </AdminRoute>
            }
          />
          <Route
            path="subscriptions"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminSubscriptions />
              </AdminRoute>
            }
          />

          {/* 4. RANK & PERFORMANCE */}
          <Route
            path="rankings"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminRankings />
              </AdminRoute>
            }
          />
          <Route
            path="district-rankings"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminDistrictRankings />
              </AdminRoute>
            }
          />
          <Route
            path="performance"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminPerformance />
              </AdminRoute>
            }
          />
          <Route
            path="cutoff"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminCutoff />
              </AdminRoute>
            }
          />

          {/* 5. COMMERCE */}
          <Route
            path="payments"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminPayments />
              </AdminRoute>
            }
          />
          <Route
            path="subscription-plans"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminSubscriptionPlans />
              </AdminRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <AdminRoute requiredPermission="canManageCoupons">
                <AdminCoupons />
              </AdminRoute>
            }
          />

          {/* 6. COMMUNICATION */}
          <Route
            path="notifications"
            element={
              <AdminRoute requiredPermission="canManageNotifications">
                <AdminNotifications />
              </AdminRoute>
            }
          />
          <Route
            path="support"
            element={
              <AdminRoute requiredPermission="canManageSupport">
                <AdminSupport />
              </AdminRoute>
            }
          />

          {/* 7. ANALYTICS */}
          <Route
            path="analytics"
            element={
              <AdminRoute requiredPermission="canManageSubscriptions">
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="item-analysis"
            element={
              <AdminRoute requiredPermission="canManageTests">
                <AdminItemAnalysis />
              </AdminRoute>
            }
          />
          <Route path="analytics-insights" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="insights" element={<Navigate to="/admin/analytics" replace />} />

          {/* 8. SYSTEM */}
          <Route
            path="admins"
            element={
              <AdminRoute requiredPermission="canManageStaff">
                <AdminStaff />
              </AdminRoute>
            }
          />
          <Route
            path="staff"
            element={
              <AdminRoute requiredPermission="canManageStaff">
                <AdminStaff />
              </AdminRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <AdminRoute requiredPermission="canViewAuditLogs">
                <AdminAuditLogs />
              </AdminRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRoute requiredPermission="canManageSettings">
                <AdminSettings />
              </AdminRoute>
            }
          />

          {/* Backward compatibility & Consolidation Aliases */}
          <Route path="overview" element={<Navigate to="/admin" replace />} />
          <Route path="questions" element={<Navigate to="/admin/question-bank" replace />} />
          <Route
            path="full-mock-questions"
            element={<Navigate to="/admin/question-bank" replace />}
          />
          <Route path="topic-manage" element={<Navigate to="/admin/topics" replace />} />
          <Route path="chapters" element={<Navigate to="/admin/topics" replace />} />
          <Route path="exam-topics" element={<Navigate to="/admin/topics" replace />} />
          <Route path="revenue" element={<Navigate to="/admin/payments" replace />} />
          <Route path="revenue-analytics" element={<Navigate to="/admin/payments" replace />} />
          <Route path="financials" element={<Navigate to="/admin/payments" replace />} />
          <Route path="discounts" element={<Navigate to="/admin/coupons" replace />} />
          <Route path="pro-users" element={<Navigate to="/admin/subscriptions" replace />} />
        </Route>

        {/* Keep deep links inside the admin surface. */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </React.Suspense>
  );
};
