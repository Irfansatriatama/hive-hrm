import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/login_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;

  static final _emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(loginNotifierProvider.notifier).signIn(
          _emailController.text.trim(),
          _passwordController.text,
        );

    if (!success && mounted) {
      final error = ref.read(loginNotifierProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text(
            _resolveErrorMessage(error),
            style: AppTextStyle.body2.copyWith(color: AppColors.textPrimary),
          ),
        ),
      );
    }
  }

  String _resolveErrorMessage(Object? error) {
    final l10n = context.l10n;
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        final message = data['message'];
        if (message is String) return message;
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
    }
    return l10n.loginFailed;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final loginState = ref.watch(loginNotifierProvider);
    final isLoading = loginState.isLoading;

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(AppTheme.md),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: AppTheme.xl + AppTheme.lg + AppTheme.xs),
                _LogoArea(
                  title: l10n.loginTitle,
                  subtitle: l10n.loginSubtitle,
                ),
                SizedBox(height: AppTheme.lg + AppTheme.md),
                Text(
                  l10n.emailLabel.toUpperCase(),
                  style: AppTextStyle.overline,
                ),
                SizedBox(height: AppTheme.xs),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  style: AppTextStyle.body2,
                  decoration: InputDecoration(
                    hintText: l10n.emailHint,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return l10n.emailRequired;
                    }
                    if (!_emailRegex.hasMatch(value.trim())) {
                      return l10n.emailInvalid;
                    }
                    return null;
                  },
                ),
                SizedBox(height: AppTheme.md),
                Text(
                  l10n.passwordLabel.toUpperCase(),
                  style: AppTextStyle.overline,
                ),
                SizedBox(height: AppTheme.xs),
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_showPassword,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  style: AppTextStyle.body2,
                  onFieldSubmitted: (_) => _handleLogin(),
                  decoration: InputDecoration(
                    hintText: l10n.passwordHint,
                    suffixIcon: IconButton(
                      onPressed: () =>
                          setState(() => _showPassword = !_showPassword),
                      icon: Icon(
                        _showPassword
                            ? Icons.visibility_off_rounded
                            : Icons.visibility_rounded,
                        color: AppColors.textSubtle,
                      ),
                      constraints: const BoxConstraints(
                        minHeight: AppTheme.tapMin,
                        minWidth: AppTheme.tapMin,
                      ),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return l10n.passwordRequired;
                    }
                    if (value.length < 6) {
                      return l10n.passwordMinLength;
                    }
                    return null;
                  },
                ),
                SizedBox(height: AppTheme.sm),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      minimumSize: const Size(0, AppTheme.tapMin),
                      foregroundColor: AppColors.tealSecondary,
                    ),
                    child: Text(
                      l10n.forgotPassword,
                      style: AppTextStyle.body2.copyWith(
                        color: AppColors.tealSecondary,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: AppTheme.lg),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _handleLogin,
                    child: isLoading
                        ? SizedBox(
                            width: AppTheme.md + AppTheme.xs,
                            height: AppTheme.md + AppTheme.xs,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primaryNavy,
                            ),
                          )
                        : Text(l10n.loginButton),
                  ),
                ),
                SizedBox(height: AppTheme.xl),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LogoArea extends StatelessWidget {
  const _LogoArea({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: AppTheme.tapMin,
          height: AppTheme.tapMin,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.amberAccent),
            borderRadius: BorderRadius.circular(AppTheme.radiusCard),
          ),
          alignment: Alignment.center,
          child: Text(
            'H',
            style: AppTextStyle.display.copyWith(color: AppColors.amberAccent),
          ),
        ),
        SizedBox(height: AppTheme.sm),
        Text(
          title,
          style: AppTextStyle.h1.copyWith(letterSpacing: 2),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: AppTheme.xs),
        Text(
          subtitle,
          style: AppTextStyle.caption,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
