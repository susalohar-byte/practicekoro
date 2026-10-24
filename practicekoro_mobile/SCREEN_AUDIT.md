# PracticeKoro app — 30-screen audit (16 Oct 2026)

**Key fact:** the app has no sign-in, and it reads only three Supabase tables (`exams`, `subjects`, `tests`).

- **Stored on the phone:** attempts, results, bookmarks and the profile (SharedPreferences).
- **Hardcoded:** every test runs the same 5 questions (`CatalogRepository.getQuestions`), and topics and their progress are also hardcoded (`getTopics`).
- **Batch 1 (this audit):** screens that work with that data. Everything needing accounts, server attempts or payments is Batch 2.

## Audit table

| # | Screen | Location | Status before | Status now | What was missing / done |
|---|---|---|---|---|---|
| 1 | Home | `features/home/home_screen.dart` `/home` | INCOMPLETE | COMPLETE | Removed fake rank #1245, fake Recent Results, fixed exam cards ("120+ Tests", invented tags) and hardcoded subject tiles (which also opened the wrong subject). Now uses real exams and subjects. Time-based greeting. Bell opens Notifications. Search opens the Search screen. Fixed header overflow on 375-px phones. |
| 2 | Practice | `features/practice/practice_screen.dart` `/practice` | INCOMPLETE | INCOMPLETE (unchanged) | Has subjects, topics and "Needs Focus". Missing Quick, Mixed and Previous Practice, which need real topic and question data (Batch 2). |
| 3 | Exams | `features/exams/exam_list_screen.dart` `/exams` | COMPLETE | COMPLETE (unchanged) | — |
| 4 | Mock Test List | `features/exams/exam_tests_screen.dart` `/exams/:id` | COMPLETE | COMPLETE (unchanged) | Pro lock is UI-only; no subscription check exists (Batch 2). |
| 5 | Test Details & Instructions | `features/exams/test_details_screen.dart` | INCOMPLETE | COMPLETE | A generic default instruction list said "There is a negative marking" even for tests without it. Rules are now built from each test's real marks, negative marking and duration. |
| 6 | Live Test / Questions | `features/test_runner/test_runner_screen.dart` | COMPLETE | COMPLETE | Leave dialog falsely said answers are kept; corrected. |
| 7 | Navigator & Submit | same | INCOMPLETE | COMPLETE | Single horizontal number row already existed. Added an unanswered-questions warning to the submit sheet. |
| 8 | Test Result | `features/result_analytics/result_screen.dart` | INCOMPLETE | COMPLETE | Rank, percentile, district rank, cutoffs and leaderboard names were simulated (fixed 3,420 candidates; "Aniket Mukherjee"). They are no longer created, and old saved values are stripped when read. Each attempt now has its own ID, so retakes no longer overwrite earlier results. |
| 9 | Solutions | `features/result_analytics/solutions_screen.dart` | INCOMPLETE | COMPLETE | Explanation moved above the options. Added a color-coded question palette for jumping to any question. |
| 10 | Topic Selection | `features/practice/topic_test_screen.dart` `/topic-tests` | COMPLETE | COMPLETE (unchanged) | Runs on hardcoded topics (Batch 2). |
| 11 | Topic Test | same | COMPLETE | COMPLETE (unchanged) | Same. |
| 12 | PYQ | — | MISSING | COMPLETE | New `features/pyq/pyq_screen.dart` `/pyq?exam=`: exam and year filters, Free/Pro tags, opens the normal test flow. Uses `tests.year`, else the year in the title. |
| 13 | My Progress | — | MISSING | COMPLETE | New `features/progress/progress_screen.dart` `/progress`: tests attempted, questions solved, accuracy, avg score, time, score trend, and topic and test performance (weakest first). Only real attempts. |
| 14 | Bookmarks | `features/bookmarks/saved_questions_screen.dart` `/bookmarks` | INCOMPLETE | COMPLETE | It saved 3 sample questions whenever the list was empty. Removed, and previously seeded samples are purged. The list shows each question with its answer and explanation inline. |
| 15 | Notifications | — | MISSING | INCOMPLETE | New `features/notifications/notifications_screen.dart` `/notifications` with an honest empty state. Notifications are per signed-in student, so they need Batch 2. |
| 16 | My Profile | `features/profile/profile_screen.dart` `/profile` | COMPLETE | COMPLETE | Redesigned earlier today. Now links to Progress, My Tests, PYQ, Help and Settings. Demo identity defaults ("Rohit Das", Kolkata, born 2001) removed. |
| 17 | Edit Profile | `features/profile/edit_profile_screen.dart` | COMPLETE | COMPLETE (unchanged) | Saves on the phone only. |
| 18 | My Tests / History | — | MISSING | COMPLETE | New `features/result_analytics/test_history_screen.dart` `/test-history`: All / Mock & PYQ / Topic filters, date, time taken, score, and Result and Solutions buttons. |
| 19 | My Results | `features/result_analytics/results_history_screen.dart` `/results` | COMPLETE | COMPLETE (unchanged) | — |
| 20 | Subscription / Upgrade | — | MISSING | MISSING | Batch 2: needs sign-in plus `subscription_plans` and `subscriptions`. |
| 21 | Checkout / Payment | — | MISSING | MISSING | Batch 2: needs the Razorpay SDK and the `create-razorpay-order` / `verify-payment` Edge Functions. |
| 22 | Purchase History | — | MISSING | MISSING | Batch 2: needs sign-in plus `payments`. |
| 23 | Help & Support | sheet in profile | INCOMPLETE | COMPLETE | New `features/support/help_support_screen.dart` `/help`: email support plus FAQs. No ticket system exists in the app. |
| 24 | Settings | sheet in profile | INCOMPLETE | COMPLETE | New `features/settings/settings_screen.dart` `/settings`: exam language, daily reminder, privacy, version, logout (no accounts yet). |
| 25 | Search | sheet on Home | INCOMPLETE | COMPLETE | New `features/search/search_screen.dart` `/search?q=`: exams, subjects (English and Bengali names) and topics. Question search needs real questions (Batch 2). Replaces the old Home sheet. |
| 26 | Login | — | MISSING | MISSING | Batch 2 (Supabase Auth). |
| 27 | Sign Up | — | MISSING | MISSING | Batch 2. |
| 28 | Forgot / Reset Password | — | MISSING | MISSING | Batch 2. |
| 29 | Onboarding | — | MISSING | COMPLETE | New `features/onboarding/onboarding_screen.dart` `/onboarding`: 3 pages, Skip / Get Started, shown once. |
| 30 | Splash | — | MISSING | COMPLETE | `SplashScreen` `/splash` (start route): logo for one frame, then Onboarding or Home. No artificial delay. Native launch screens are still the Flutter template defaults. |

## Files created
- `lib/features/result_analytics/test_history_screen.dart`
- `lib/features/pyq/pyq_screen.dart`
- `lib/features/progress/progress_screen.dart`
- `lib/features/search/search_screen.dart`
- `lib/features/notifications/notifications_screen.dart`
- `lib/features/settings/settings_screen.dart`
- `lib/features/support/help_support_screen.dart`
- `lib/features/onboarding/onboarding_screen.dart`

## Files modified
- `lib/core/routing/app_router.dart`: 9 new routes; the start route is now `/splash`.
- `lib/features/test_runner/test_runner_screen.dart`: no simulated ranks or cutoffs, unique attempt IDs, unanswered warning, honest leave text.
- `lib/data/repositories/catalog_repository.dart`: strips old simulated ranking fields when reading attempts.
- `lib/data/models/test_model.dart`: no generic default instructions; adds `year` / `paperYear`.
- `lib/features/result_analytics/solutions_screen.dart`: explanation above options, question palette.
- `lib/features/bookmarks/saved_questions_screen.dart`: no sample seeding.
- `lib/data/datasources/local_storage.dart`: no demo name, email, district, caste, DOB or rank defaults.
- `lib/features/home/home_screen.dart`: real data, links, header fit, old search sheet removed.
- `lib/features/profile/profile_screen.dart`: links to new screens; settings and support sheets moved to screens.
- `lib/core/constants/exam_assets.dart`: WBPSC matched before WBP, so WBPSC exams get their own emblem.
- `test/widget_test.dart`: marks onboarding done for the Home test; adds a first-launch onboarding test.
- **Whitespace only:** `dart format` also touched `exam_tests_screen.dart`, `practice_screen.dart`, `edit_profile_screen.dart` and `result_screen.dart`.

## Validation
- `flutter analyze`: no issues.
- `flutter test`: 12 of 12 pass, including the new onboarding test.
- A temporary headless end-to-end test (since deleted):
  - opened a mock test, answered 4 of 5 questions and saw the unanswered warning;
  - submitted, and checked the Result page shows no percentile, cutoff or leaderboard;
  - opened Solutions;
  - rendered Test History, Progress, PYQ, Search, Settings, Help, Notifications, Home and Onboarding with no exceptions. A Home overflow was found and fixed.
- **Not run on a real phone or emulator.** The headless renderer has no Bengali font, so Bengali text could not be checked visually.

## Remaining limitations (Batch 2 — needs decisions)
1. **Accounts:** no Supabase Auth. Login, Sign Up, Reset, Notifications, Subscription, Checkout and Purchase History all depend on it.
2. **Real questions and attempts:** tests run 5 hardcoded questions. Real ones need the backend's student question functions and server attempts, which also provide genuine ranks.
3. **Topics:** topics and their progress are hardcoded; there is no `chapters` read.
4. **Payments:** need the Razorpay Flutter SDK, live keys, and the deployed Edge Functions. Note that the deployed `create-razorpay-order` and `verify-payment` are older than the repo versions.
5. **Supabase config:** the app reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` from `--dart-define`. Without them it shows its offline catalog.
