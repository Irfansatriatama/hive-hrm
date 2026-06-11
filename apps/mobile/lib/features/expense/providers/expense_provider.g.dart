// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'expense_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$expenseSubmittingHash() => r'bb760eb5ddeb7b46be46770732b6eaa258b190c1';

/// See also [ExpenseSubmitting].
@ProviderFor(ExpenseSubmitting)
final expenseSubmittingProvider =
    AutoDisposeNotifierProvider<ExpenseSubmitting, bool>.internal(
  ExpenseSubmitting.new,
  name: r'expenseSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$expenseSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ExpenseSubmitting = AutoDisposeNotifier<bool>;
String _$expenseHash() => r'c31de659470957c150b580be90ac57c8c3ec578f';

/// See also [Expense].
@ProviderFor(Expense)
final expenseProvider =
    AutoDisposeAsyncNotifierProvider<Expense, ExpenseData>.internal(
  Expense.new,
  name: r'expenseProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$expenseHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Expense = AutoDisposeAsyncNotifier<ExpenseData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
