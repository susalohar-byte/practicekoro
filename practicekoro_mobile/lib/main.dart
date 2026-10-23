import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/components/ui.dart';
import 'core/routing/app_router.dart';
import 'data/datasources/local_storage.dart';
import 'data/repositories/auth_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local persistent storage
  await LocalStorageService.init();

  // Supabase (URL + public anon key from --dart-define-from-file=config/supabase.json).
  if (backendConfigured) {
    try {
      await Supabase.initialize(
        url: const String.fromEnvironment(
          'SUPABASE_URL',
          defaultValue: 'https://prycanbnxuihxhskallw.supabase.co',
        ),
        publishableKey: const String.fromEnvironment(
          'SUPABASE_ANON_KEY',
          defaultValue:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw',
        ),
      );
      // Refresh the on-device profile for a student who is already signed in.
      unawaited(const AuthRepository().syncProfileFromServer());
    } catch (e) {
      debugPrint('Supabase initialization failed: $e');
    }
  }

  runApp(const ProviderScope(child: PracticeKoroApp()));
}

class PracticeKoroApp extends StatelessWidget {
  const PracticeKoroApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Hind Siliguri supports English & Bengali Unicode with high typographic quality
    final textTheme = GoogleFonts.hindSiliguriTextTheme(
      Theme.of(context).textTheme,
    );

    return MaterialApp.router(
      title: 'PracticeKoro',
      debugShowCheckedModeBanner: false,
      routerConfig: appRouter,
      builder: (context, child) {
        if (!kIsWeb || child == null) {
          return child ?? const SizedBox.shrink();
        }
        final mq = MediaQuery.of(context);
        if (mq.size.width <= 500) {
          return child;
        }
        const double mobileWidth = 430.0;
        return ColoredBox(
          color: const Color(0xFFE2E8F0),
          child: Center(
            child: Container(
              width: mobileWidth,
              height: mq.size.height,
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.14),
                    blurRadius: 32,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: MediaQuery(
                data: mq.copyWith(
                  size: Size(mobileWidth, mq.size.height),
                ),
                child: child,
              ),
            ),
          ),
        );
      },
      theme: UI.theme(textTheme),
    );
  }
}
