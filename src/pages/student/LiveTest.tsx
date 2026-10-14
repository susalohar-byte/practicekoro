import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Trophy,
  ArrowRight,
  Radio,
  Lock,
  XCircle,
  Award,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { api, type LiveTest as LiveTestData } from '@/services/api';
import type { LiveTestParticipant } from '@/types';
import { StudentLoading } from '@/components/student/StudentLoadState';
import { PageHeader, SectionTitle, studentCard } from '@/components/student/StudentUI';

const formatCountdown = (target: string) => {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { days, hours, mins, secs, totalSeconds: total };
};

export const LiveTest: React.FC = () => {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIdParam = searchParams.get('id');

  const [allTests, setAllTests] = useState<LiveTestData[]>([]);
  const [test, setTest] = useState<LiveTestData | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [leaderboard, setLeaderboard] = useState<LiveTestParticipant[]>([]);
  const [userResult, setUserResult] = useState<LiveTestParticipant | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, active] = await Promise.all([api.getLiveTests(), api.getActiveLiveTest()]);

      const visibleList = list.filter((lt) => lt.status !== 'cancelled');
      setAllTests(visibleList);

      const chosen =
        (selectedIdParam ? list.find((lt) => lt.id === selectedIdParam) : null) ||
        active ||
        visibleList[0] ||
        null;

      setTest(chosen);

      if (chosen) {
        if (user?.id) {
          const isReg = await api.isLiveTestRegistered(chosen.id, user.id);
          setRegistered(isReg);
        } else {
          setRegistered(false);
        }

        if (chosen.rankingEnabled) {
          const ranks = await api.getLiveTestLeaderboard(chosen.id);
          setLeaderboard(ranks);
          const mine = user?.id ? ranks.find((r) => r.userId === user.id) || null : null;
          setUserResult(mine);
        } else {
          setLeaderboard([]);
          setUserResult(null);
        }
      } else {
        setLeaderboard([]);
        setUserResult(null);
      }
    } catch (err) {
      console.error('Failed to load active live test:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedIdParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription when admin creates/updates a live test
  useEffect(() => {
    if (typeof api.subscribeToLiveTestUpdates !== 'function') return;
    const unsubscribe = api.subscribeToLiveTestUpdates(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  type LiveTestState = 'empty' | 'upcoming' | 'live' | 'ended' | 'cancelled';

  const state: LiveTestState = useMemo(() => {
    if (!test) return 'empty';
    if (test.status === 'cancelled') return 'cancelled';
    if (test.status === 'ended' || test.status === 'completed') return 'ended';
    const start = new Date(test.startAt || test.scheduledStartAt || '').getTime();
    const duration = test.durationMinutes || 90;
    const end = start + duration * 60 * 1000;

    // Active/scheduled live tests show LIVE tag as requested
    if (test.status === 'live' || (now >= start && now <= end) || test.isPublished) {
      return 'live';
    }
    if (now < start) return 'live';
    return 'ended';
  }, [test, now]);

  const startAtTime = test?.startAt || test?.scheduledStartAt || new Date().toISOString();
  const countdown = test && (state as LiveTestState) === 'upcoming' ? formatCountdown(startAtTime) : null;

  // 1. Register for upcoming live test
  const handleRegister = async () => {
    if (!test || !user?.id) {
      navigate('/login');
      return;
    }

    if (test.subscriptionRequired && !isPro) {
      navigate('/subscription');
      return;
    }

    try {
      setActionLoading(true);
      await api.registerForLiveTest(test.id, user.id);
      setRegistered(true);
      await loadData();
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Join when test is Live Now
  const handleJoin = async () => {
    if (!test || !user?.id) {
      navigate('/login');
      return;
    }

    if (test.subscriptionRequired && !isPro) {
      navigate('/subscription');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.joinLiveTestEvent(test.id, user.id);
      if (!res.success) {
        alert(res.error || 'Cannot enter Live Test at this time.');
        return;
      }

      navigate(`/exams/${test.testId}/runner?liveTestId=${encodeURIComponent(test.id)}`);
    } catch (err) {
      console.error('Join failed:', err);
      alert('Error entering Live Test. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectEvent = (lt: LiveTestData) => {
    setSearchParams({ id: lt.id });
  };

  if (loading) {
    return <StudentLoading label="Loading Live Test event..." />;
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans flex items-center justify-center p-4">
        <div className={`max-w-md w-full text-center space-y-4 p-8 ${studentCard}`}>
          <CalendarClock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-black text-[#0B1B3F] dark:text-white">No Live Test Scheduled</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            There is currently no active or upcoming live examination scheduled. Check back soon
            or practice with our Mock Test series.
          </p>
          <div className="pt-2">
            <Link
              to="/test-series"
              className="px-5 py-2.5 bg-[#026BFC] hover:bg-[#0056D2] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <span>Explore Mock Tests</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <PageHeader
          eyebrow="Live Examination"
          title="Live Mock Tests"
          subtitle="Real-time test events with state-level percentile and rank calculation"
          icon={Radio}
          onBack={() => navigate('/test-series')}
          actions={
            state === 'live' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/25">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE NOW
              </span>
            ) : (state as string) === 'upcoming' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[#026BFC] dark:text-blue-300 font-extrabold text-xs">
                <Clock3 className="w-3.5 h-3.5 text-[#026BFC]" />
                UPCOMING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                EVENT ENDED
              </span>
            )
          }
        />

        {/* Cancelled Banner */}
        {state === 'cancelled' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <span className="font-bold">Event Cancelled:</span> This scheduled Live Test event has
              been cancelled by administration.
            </div>
          </div>
        )}

        {/* Main Event Card */}
        <div className={`overflow-hidden ${studentCard}`}>
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#0B1B3F] via-[#102356] to-[#1C3B8B] p-6 sm:p-8 text-white relative">
            <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
              {state === 'live' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-md shadow-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-slate-200 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  EVENT ENDED
                </span>
              )}

              {test.examTitle && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white border border-white/15">
                  {test.examTitle}
                </span>
              )}

              {test.rankingEnabled && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-sky-200 border border-white/10 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  Statewide Ranking
                </span>
              )}

              {test.subscriptionRequired && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Pro Pass Required
                </span>
              )}
            </div>

            <div className="flex items-start gap-4">
              {(test.logo || test.examLogo) && (
                <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 border border-white/20 shrink-0 flex items-center justify-center">
                  <img
                    src={test.logo || test.examLogo}
                    alt={test.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{test.title}</h2>
                {test.instructions && (
                  <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                    {test.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Test Metadata Grid */}
          <div className="grid gap-3.5 p-5 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <Info
              icon={<CalendarClock />}
              label="Start Schedule"
              value={new Date(startAtTime).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
            <Info
              icon={<Clock3 />}
              label="Duration"
              value={`${test.durationMinutes || 90} Minutes`}
            />
            <Info
              icon={<FileText />}
              label="Format"
              value={`${test.totalQuestions || 100} Qs • ${test.totalMarks || 100} Marks`}
            />
            <Info
              icon={<Trophy />}
              label="Ranking"
              value={test.rankingEnabled ? 'Statewide Rank' : 'Self-assessment'}
            />
          </div>

          {/* Countdown Clock (Only shown when upcoming) */}
          {countdown && (state as string) === 'upcoming' && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="text-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Starts in
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto">
                {[
                  ['Days', countdown.days],
                  ['Hours', countdown.hours],
                  ['Minutes', countdown.mins],
                  ['Seconds', countdown.secs],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl bg-white dark:bg-slate-800 p-3 text-center border border-slate-200/80 dark:border-slate-700 shadow-xs"
                  >
                    <div className="text-2xl sm:text-3xl font-black text-[#0B1B3F] dark:text-sky-400 font-mono">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900">
            <div>
              {userResult ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    You completed this Live Test! Score: {userResult.score}/{test.totalMarks}
                    {userResult.rank ? ` • Rank #${userResult.rank}` : ''}
                  </span>
                </div>
              ) : registered ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>You are registered for this Live Test.</span>
                </div>
              ) : state === 'live' ? (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span>
                    Live examination window is open right now! Click Join to start immediately.
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Register now to secure your candidate slot and statewide ranking.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(state as string) === 'upcoming' && (
                <>
                  {!registered ? (
                    <Button
                      onClick={handleRegister}
                      disabled={actionLoading}
                      variant="primary"
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 px-6 shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{actionLoading ? 'Registering...' : 'REGISTER FOR LIVE TEST'}</span>
                    </Button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-2">
                      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Opens at Start Time</span>
                    </div>
                  )}
                </>
              )}

              {state === 'live' && (
                <>
                  {userResult?.attemptId && (
                    <Link
                      to={`/exams/${test.testId}/results/${userResult.attemptId}?liveTestId=${encodeURIComponent(test.id)}`}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>View My Result</span>
                    </Link>
                  )}
                  <Button
                    onClick={handleJoin}
                    disabled={actionLoading}
                    variant="primary"
                    size="sm"
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black flex items-center gap-2 px-6 shadow-lg shadow-rose-600/30 text-sm active:scale-95 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>
                      {actionLoading
                        ? 'Entering...'
                        : userResult
                          ? 'RE-ATTEMPT LIVE TEST'
                          : 'JOIN LIVE TEST NOW'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {state === 'ended' && userResult?.attemptId && (
                <Link
                  to={`/exams/${test.testId}/results/${userResult.attemptId}?liveTestId=${encodeURIComponent(test.id)}`}
                  className="px-5 py-2.5 rounded-xl bg-[#026BFC] hover:bg-[#0056D2] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>View My Result & Analysis</span>
                </Link>
              )}

              {state === 'ended' && !userResult && (
                <Link
                  to={`/exams/${test.testId}/runner`}
                  className="px-5 py-2.5 rounded-xl bg-[#026BFC] hover:bg-[#0056D2] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Attempt as Practice Mock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Student's Own Result Banner (If student participated) */}
        {userResult && (
          <div className="bg-gradient-to-r from-[#0B1B3F] to-[#1C3B8B] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg">
                #{userResult.rank || '-'}
              </div>
              <div>
                <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider">
                  Your Statewide Live Test Rank
                </div>
                <div className="text-lg sm:text-xl font-black mt-0.5">
                  Score: {userResult.score} / {test.totalMarks} • Accuracy: {userResult.accuracy}%
                </div>
              </div>
            </div>

            {userResult.attemptId && (
              <Link
                to={`/exams/${test.testId}/results/${userResult.attemptId}?liveTestId=${encodeURIComponent(test.id)}`}
                className="px-5 py-2.5 rounded-xl bg-white text-[#0B1B3F] font-black text-xs hover:bg-blue-50 transition-colors shrink-0 text-center shadow-sm"
              >
                Detailed Solutions & Insights
              </Link>
            )}
          </div>
        )}

        {/* All Scheduled & Past Live Tests Switcher (Shown when multiple events exist) */}
        {allTests.length > 1 && (
          <div className={`${studentCard} p-6 space-y-4`}>
            <SectionTitle
              title={`All Live Test Events (${allTests.length})`}
              subtitle="Select an event to view schedule or attempt"
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allTests.map((item) => {
                const isSelected = item.id === test.id;
                const itemEnd = new Date(item.startAt).getTime() + (item.durationMinutes || 90) * 60000;
                const itemState: LiveTestState =
                  item.status === 'ended' || item.status === 'completed' || (itemEnd > 0 && now > itemEnd && item.status !== 'live')
                    ? 'ended'
                    : item.status === 'cancelled'
                      ? 'cancelled'
                      : 'live';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectEvent(item)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#026BFC] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-[#026BFC]/20'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {itemState === 'live' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          ENDED
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(item.startAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {(item.logo || item.examLogo) && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <img
                            src={item.logo || item.examLogo}
                            alt={item.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-[#0B1B3F] dark:text-white line-clamp-1">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {item.durationMinutes}m • {item.totalQuestions} Qs • {item.totalMarks}{' '}
                          Marks
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Statewide Leaderboard (When ranking is enabled) */}
        {test.rankingEnabled && (
          <div className={`${studentCard} p-6 space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1B3F] dark:text-white">
                    Live Test Statewide Ranking
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Deterministic tie-breaking: Higher Score → Higher Accuracy → Lower Time Taken
                  </p>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
                <Users className="w-4 h-4 text-[#026BFC]" />
                <span>{leaderboard.length} Ranked Participants</span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 font-medium">
                {state === 'ended'
                  ? 'No ranked submissions recorded for this event.'
                  : 'Leaderboard updates live as candidates submit the test.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboard.map((row) => {
                      const isMe = user?.id && row.userId === user.id;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-blue-50/80 dark:bg-blue-950/50 font-bold border-l-4 border-[#026BFC]'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-black">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                                row.rank === 1
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : row.rank === 2
                                    ? 'bg-slate-300 text-slate-950 font-black'
                                    : row.rank === 3
                                      ? 'bg-amber-600 text-white font-black'
                                      : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              #{row.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0B1B3F] dark:text-white">
                                {row.fullName || 'Student'}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#026BFC] text-white">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {row.district || 'West Bengal'}
                          </td>
                          <td className="py-3.5 px-4 font-black text-[#026BFC]">
                            {row.score} / {test.totalMarks}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-600">
                            {row.accuracy != null ? `${row.accuracy}%` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {row.timeTaken
                              ? `${Math.floor(row.timeTaken / 60)}m ${row.timeTaken % 60}s`
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
    <div className="text-[#026BFC] dark:text-sky-400">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
    </div>
    <div>
      <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
      <div className="text-xs sm:text-sm font-bold text-[#0B1B3F] dark:text-white truncate">
        {value}
      </div>
    </div>
  </div>
);
