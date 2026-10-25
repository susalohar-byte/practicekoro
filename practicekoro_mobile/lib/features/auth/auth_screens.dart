import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/components/ui.dart';
import '../../core/components/google_sign_in_button.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/profile_repository.dart';

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String? _validateEmail(String? v) {
  final value = v?.trim() ?? '';
  if (value.isEmpty) return 'Enter your email';
  if (!_emailPattern.hasMatch(value)) return 'Enter a valid email address';
  return null;
}

String? _validatePassword(String? v) {
  if ((v ?? '').isEmpty) return 'Enter your password';
  if (v!.length < 6) return 'Password must be at least 6 characters';
  return null;
}

/// Shared brand layout for the sign-in screens.
class _AuthScaffold extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;
  final bool showBack;

  const _AuthScaffold({
    required this.title,
    required this.subtitle,
    required this.children,
    this.showBack = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: showBack
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              scrolledUnderElevation: 0,
              toolbarHeight: 52,
              leading: Padding(
                padding: const EdgeInsets.only(left: 14),
                child: Center(
                  child: Material(
                    color: const Color(0xFFF1F5F9),
                    shape: const CircleBorder(),
                    clipBehavior: Clip.antiAlias,
                    child: IconButton(
                      icon: const Icon(
                        Icons.arrow_back_rounded,
                        color: Color(0xFF1E293B),
                        size: 18,
                      ),
                      tooltip: 'Back',
                      onPressed: () {
                        if (Navigator.of(context).canPop()) {
                          Navigator.of(context).pop();
                        } else {
                          context.go('/login');
                        }
                      },
                    ),
                  ),
                ),
              ),
            )
          : null,
      body: Stack(
        children: [
          // Subtle atmospheric brand aura at the top
          Positioned(
            top: -90,
            left: 0,
            right: 0,
            height: 260,
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.topCenter,
                    radius: 1.1,
                    colors: [
                      const Color(0xFF1F48E8).withValues(alpha: 0.05),
                      Colors.white.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Minimalist Brand Emblem
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF1F48E8).withValues(alpha: 0.08),
                                blurRadius: 20,
                                offset: const Offset(0, 6),
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                          padding: const EdgeInsets.all(10),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.asset(
                              'assets/images/logo-circle.png',
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => Image.asset(
                                'assets/images/logo-transparent.png',
                                fit: BoxFit.contain,
                                errorBuilder: (_, _, _) => const Icon(
                                  Icons.school_rounded,
                                  color: UI.primary,
                                  size: 32,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.5,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 28),
                      if (!backendConfigured) ...[
                        const _Banner(
                          'This build is not connected to the PracticeKoro server. '
                          'Build with --dart-define-from-file=config/supabase.json.',
                        ),
                        const SizedBox(height: 16),
                      ],
                      ...children,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  final String text;
  final bool success;

  const _Banner(this.text, {this.success = false});

  @override
  Widget build(BuildContext context) {
    final color = success ? const Color(0xFF16A34A) : const Color(0xFFDC2626);
    final bgColor = success ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2);
    final borderColor = success ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2);

    return Semantics(
      liveRegion: true,
      child: Container(
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              success ? Icons.check_circle_rounded : Icons.error_outline_rounded,
              color: color,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: color,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

InputDecoration _field(
  String label,
  IconData icon, {
  Widget? suffix,
  String? hint,
}) =>
    InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(
        color: Color(0xFF64748B),
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      floatingLabelStyle: const TextStyle(
        color: UI.primary,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      hintStyle: const TextStyle(
        color: Color(0xFF94A3B8),
        fontSize: 14,
      ),
      prefixIcon: Padding(
        padding: const EdgeInsets.only(left: 14, right: 12),
        child: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 46, minHeight: 46),
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: UI.primary, width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.8),
      ),
      errorStyle: const TextStyle(
        color: Color(0xFFEF4444),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );

class _PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? Function(String?) validator;
  final TextInputAction action;
  final VoidCallback? onSubmitted;
  final Iterable<String> autofill;

  const _PasswordField({
    required this.controller,
    required this.label,
    required this.validator,
    this.action = TextInputAction.done,
    this.onSubmitted,
    this.autofill = const [AutofillHints.password],
  });

  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _hidden = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _hidden,
      textInputAction: widget.action,
      autofillHints: widget.autofill,
      validator: widget.validator,
      onFieldSubmitted: (_) => widget.onSubmitted?.call(),
      style: const TextStyle(
        fontSize: 15,
        color: Color(0xFF0F172A),
        fontWeight: FontWeight.w500,
      ),
      decoration: _field(
        widget.label,
        Icons.lock_outline_rounded,
        suffix: IconButton(
          tooltip: _hidden ? 'Show password' : 'Hide password',
          splashRadius: 20,
          icon: Icon(
            _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: const Color(0xFF94A3B8),
            size: 20,
          ),
          onPressed: () => setState(() => _hidden = !_hidden),
        ),
      ),
    );
  }
}

/// Minimalist primary CTA button with ambient drop-shadow.
class _PrimaryAuthButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onPressed;

  const _PrimaryAuthButton(
    this.label, {
    required this.loading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: (onPressed != null && !loading)
            ? [
                BoxShadow(
                  color: const Color(0xFF1F48E8).withValues(alpha: 0.22),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1F48E8),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF1F48E8).withValues(alpha: 0.5),
          disabledForegroundColor: Colors.white70,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  color: Colors.white,
                ),
              )
            : Text(label),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _googleBusy = false;
  String? _error;
  StreamSubscription<AuthState>? _authSub;

  @override
  void initState() {
    super.initState();
    _authSub = ref.read(authRepositoryProvider).changes.listen((data) {
      if (!mounted) return;
      if (data.session != null || data.event == AuthChangeEvent.signedIn) {
        ref.invalidate(studentProfileProvider);
        context.go('/home');
      }
    });
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _handleGoogleLogin() async {
    if (_busy || _googleBusy) return;
    setState(() {
      _googleBusy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).signInWithGoogle();
      if (ref.read(authRepositoryProvider).isSignedIn) {
        ref.invalidate(studentProfileProvider);
        if (mounted) context.go('/home');
      }
    } on AuthFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) {
        setState(() => _error =
            'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  Future<void> _submit() async {
    if (_busy || _googleBusy || !(_form.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .signIn(email: _email.text, password: _password.text);
      ref.invalidate(studentProfileProvider);
      if (mounted) context.go('/home');
    } on AuthFailure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthScaffold(
      title: 'Welcome back',
      subtitle: 'Sign in to practise mock tests & track your progress.',
      children: [
        if (_error != null) ...[_Banner(_error!), const SizedBox(height: 16)],
        GoogleSignInButton(
          loading: _googleBusy,
          onPressed: (_busy || _googleBusy) ? null : _handleGoogleLogin,
        ),
        const SizedBox(height: 20),
        const AuthOrDivider(),
        const SizedBox(height: 20),
        Form(
          key: _form,
          child: AutofillGroup(
            child: Column(
              children: [
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: _validateEmail,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: _field('Email address', Icons.mail_outline_rounded, hint: 'name@example.com'),
                ),
                const SizedBox(height: 14),
                _PasswordField(
                  controller: _password,
                  label: 'Password',
                  validator: (v) =>
                      (v ?? '').isEmpty ? 'Enter your password' : null,
                  onSubmitted: _submit,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/forgot-password'),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'Forgot password?',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F48E8),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _PrimaryAuthButton(
          'Log In',
          loading: _busy,
          onPressed: (_busy || _googleBusy) ? null : _submit,
        ),
        const SizedBox(height: 22),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          children: [
            const Text(
              'New to PracticeKoro?',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w400,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/signup'),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Create account',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F48E8),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  bool _googleBusy = false;
  String? _error;
  bool _checkEmail = false;
  StreamSubscription<AuthState>? _authSub;

  @override
  void initState() {
    super.initState();
    _authSub = ref.read(authRepositoryProvider).changes.listen((data) {
      if (!mounted) return;
      if (data.session != null || data.event == AuthChangeEvent.signedIn) {
        ref.invalidate(studentProfileProvider);
        context.go('/home');
      }
    });
  }

  @override
  void dispose() {
    _authSub?.cancel();
    for (final c in [_name, _email, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _handleGoogleLogin() async {
    if (_busy || _googleBusy) return;
    setState(() {
      _googleBusy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).signInWithGoogle();
      if (ref.read(authRepositoryProvider).isSignedIn) {
        ref.invalidate(studentProfileProvider);
        if (mounted) context.go('/home');
      }
    } on AuthFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) {
        setState(() => _error =
            'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  Future<void> _submit() async {
    if (_busy || _googleBusy || !(_form.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final needsConfirmation = await ref
          .read(authRepositoryProvider)
          .signUp(
            fullName: _name.text,
            email: _email.text,
            password: _password.text,
          );
      if (!mounted) return;
      if (needsConfirmation) {
        setState(() => _checkEmail = true);
      } else {
        ref.invalidate(studentProfileProvider);
        context.go('/home');
      }
    } on AuthFailure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkEmail) {
      return _AuthScaffold(
        title: 'Check your email',
        subtitle: 'One more step to finish creating your account.',
        showBack: true,
        children: [
          _Banner(
            'We sent a confirmation link to ${_email.text.trim()}. '
            'Open it on this phone, then log in.',
            success: true,
          ),
          const SizedBox(height: 24),
          _PrimaryAuthButton('Go to Log In', loading: false, onPressed: () => context.go('/login')),
        ],
      );
    }
    return _AuthScaffold(
      title: 'Create your account',
      subtitle: 'Practise mock tests and track your progress.',
      showBack: true,
      children: [
        if (_error != null) ...[_Banner(_error!), const SizedBox(height: 16)],
        GoogleSignInButton(
          label: 'Sign up with Google',
          loading: _googleBusy,
          onPressed: (_busy || _googleBusy) ? null : _handleGoogleLogin,
        ),
        const SizedBox(height: 20),
        const AuthOrDivider(),
        const SizedBox(height: 20),
        Form(
          key: _form,
          child: AutofillGroup(
            child: Column(
              children: [
                TextFormField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.name],
                  validator: (v) => (v?.trim().length ?? 0) < 2
                      ? 'Enter your full name'
                      : null,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: _field('Full name', Icons.person_outline_rounded, hint: 'Student Name'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: _validateEmail,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: _field('Email address', Icons.mail_outline_rounded, hint: 'name@example.com'),
                ),
                const SizedBox(height: 14),
                _PasswordField(
                  controller: _password,
                  label: 'Password (min. 6 characters)',
                  action: TextInputAction.next,
                  autofill: const [AutofillHints.newPassword],
                  validator: _validatePassword,
                ),
                const SizedBox(height: 14),
                _PasswordField(
                  controller: _confirm,
                  label: 'Confirm password',
                  autofill: const [AutofillHints.newPassword],
                  validator: (v) =>
                      v != _password.text ? 'Passwords do not match' : null,
                  onSubmitted: _submit,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 22),
        _PrimaryAuthButton(
          'Create Account',
          loading: _busy,
          onPressed: (_busy || _googleBusy) ? null : _submit,
        ),
        const SizedBox(height: 22),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          children: [
            const Text(
              'Already have an account?',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w400,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/login'),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Log in',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F48E8),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Forgot password (request link) and Reset password (after the link)
// ---------------------------------------------------------------------------

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !(_form.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendPasswordReset(_email.text);
      setState(() => _sent = true);
    } on AuthFailure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthScaffold(
      title: 'Reset your password',
      subtitle: 'We will email you a link to set a new password.',
      showBack: true,
      children: [
        if (_error != null) ...[_Banner(_error!), const SizedBox(height: 16)],
        if (_sent) ...[
          _Banner(
            'If an account exists for ${_email.text.trim()}, a reset link is on '
            'its way. Open it on this phone to choose a new password.',
            success: true,
          ),
          const SizedBox(height: 24),
          _PrimaryAuthButton('Back to Log In', loading: false, onPressed: () => context.go('/login')),
        ] else ...[
          Form(
            key: _form,
            child: TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              validator: _validateEmail,
              onFieldSubmitted: (_) => _submit(),
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.w500,
              ),
              decoration: _field('Email address', Icons.mail_outline_rounded, hint: 'name@example.com'),
            ),
          ),
          const SizedBox(height: 22),
          _PrimaryAuthButton('Send Reset Link', loading: _busy, onPressed: _submit),
        ],
      ],
    );
  }
}

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !(_form.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).updatePassword(_password.text);
      authChanges.passwordRecoveryPending = false;
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Password updated.')));
      context.go('/home');
    } on AuthFailure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthScaffold(
      title: 'Choose a new password',
      subtitle: 'Use at least 6 characters.',
      children: [
        if (_error != null) ...[_Banner(_error!), const SizedBox(height: 16)],
        Form(
          key: _form,
          child: Column(
            children: [
              _PasswordField(
                controller: _password,
                label: 'New password',
                action: TextInputAction.next,
                autofill: const [AutofillHints.newPassword],
                validator: _validatePassword,
              ),
              const SizedBox(height: 14),
              _PasswordField(
                controller: _confirm,
                label: 'Confirm new password',
                autofill: const [AutofillHints.newPassword],
                validator: (v) =>
                    v != _password.text ? 'Passwords do not match' : null,
                onSubmitted: _submit,
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        _PrimaryAuthButton('Update Password', loading: _busy, onPressed: _submit),
      ],
    );
  }
}
