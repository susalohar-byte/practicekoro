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
          ? AppBar(backgroundColor: Colors.white, toolbarHeight: 48)
          : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Image.asset(
                      'assets/images/logo-transparent.png',
                      height: 52,
                      errorBuilder: (_, _, _) =>
                          const Text('PracticeKoro', style: UI.title),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(title, style: UI.title),
                  const SizedBox(height: 4),
                  Text(subtitle, style: UI.body.copyWith(color: UI.muted)),
                  const SizedBox(height: 24),
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
    );
  }
}

class _Banner extends StatelessWidget {
  final String text;
  final bool success;

  const _Banner(this.text, {this.success = false});

  @override
  Widget build(BuildContext context) {
    final color = success ? UI.success : UI.danger;
    return Semantics(
      liveRegion: true,
      child: UICard(
        color: success ? UI.successSoft : UI.dangerSoft,
        border: success ? UI.successSoft : UI.dangerSoft,
        raised: false,
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              success
                  ? Icons.check_circle_rounded
                  : Icons.error_outline_rounded,
              color: color,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(text, style: UI.body.copyWith(color: color)),
            ),
          ],
        ),
      ),
    );
  }
}

InputDecoration _field(String label, IconData icon, {Widget? suffix}) =>
    InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: UI.muted),
      suffixIcon: suffix,
      filled: true,
      fillColor: UI.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(UI.radius),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(UI.radius),
        borderSide: const BorderSide(color: UI.primary, width: 1.4),
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
      decoration: _field(
        widget.label,
        Icons.lock_outline_rounded,
        suffix: IconButton(
          tooltip: _hidden ? 'Show password' : 'Hide password',
          icon: Icon(
            _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: UI.muted,
          ),
          onPressed: () => setState(() => _hidden = !_hidden),
        ),
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
      subtitle: 'Log in to take tests and save your results.',
      children: [
        if (_error != null) ...[_Banner(_error!), const SizedBox(height: 16)],
        GoogleSignInButton(
          loading: _googleBusy,
          onPressed: (_busy || _googleBusy) ? null : _handleGoogleLogin,
        ),
        const SizedBox(height: 18),
        const AuthOrDivider(),
        const SizedBox(height: 18),
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
                  decoration: _field('Email', Icons.mail_outline_rounded),
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
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/forgot-password'),
            child: const Text('Forgot password?'),
          ),
        ),
        const SizedBox(height: 8),
        UIButton(
          'Log In',
          loading: _busy,
          onPressed: (_busy || _googleBusy) ? null : _submit,
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('New to PracticeKoro?', style: UI.body),
            TextButton(
              onPressed: () => context.push('/signup'),
              child: const Text('Create account'),
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
          const SizedBox(height: 20),
          UIButton('Go to Log In', onPressed: () => context.go('/login')),
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
        const SizedBox(height: 18),
        const AuthOrDivider(),
        const SizedBox(height: 18),
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
                  decoration: _field('Full name', Icons.person_outline_rounded),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: _validateEmail,
                  decoration: _field('Email', Icons.mail_outline_rounded),
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
        const SizedBox(height: 20),
        UIButton(
          'Create Account',
          loading: _busy,
          onPressed: (_busy || _googleBusy) ? null : _submit,
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Already have an account?', style: UI.body),
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Log in'),
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
          const SizedBox(height: 20),
          UIButton('Back to Log In', onPressed: () => context.go('/login')),
        ] else ...[
          Form(
            key: _form,
            child: TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              validator: _validateEmail,
              onFieldSubmitted: (_) => _submit(),
              decoration: _field('Email', Icons.mail_outline_rounded),
            ),
          ),
          const SizedBox(height: 20),
          UIButton('Send Reset Link', loading: _busy, onPressed: _submit),
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
        const SizedBox(height: 20),
        UIButton('Update Password', loading: _busy, onPressed: _submit),
      ],
    );
  }
}
