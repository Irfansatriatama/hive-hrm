import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/reward_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../providers/reward_provider.dart';
import '../widgets/reward_catalog_card.dart';
import '../widgets/reward_transaction_tile.dart';

class RewardScreen extends ConsumerStatefulWidget {
  const RewardScreen({super.key});

  @override
  ConsumerState<RewardScreen> createState() => _RewardScreenState();
}

class _RewardScreenState extends ConsumerState<RewardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  String? _recipientId;
  String? _hashtag;
  int _points = 10;
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _confirmRedeem(RewardCatalogModel item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceBlue,
        title: Text(context.l10n.rewardRedeem, style: AppTextStyle.h2),
        content: Text(
          context.l10n.rewardRedeemConfirm(item.name, item.points),
          style: AppTextStyle.body2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(context.l10n.rewardRedeem),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final error = await ref.read(rewardProvider.notifier).redeem(item.id);
    if (!mounted) return;

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error, style: AppTextStyle.body2),
          backgroundColor: AppColors.errorRed,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.rewardRedeemSuccess,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  Future<void> _sendAppreciation() async {
    final message = _messageController.text.trim();
    if (_recipientId == null ||
        _hashtag == null ||
        _points < 10 ||
        _points > 100 ||
        message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.rewardAppreciationIncomplete,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    final error = await ref.read(rewardProvider.notifier).sendAppreciation(
          recipientId: _recipientId!,
          hashtag: _hashtag!,
          points: _points,
          message: message,
        );
    if (!mounted) return;

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error, style: AppTextStyle.body2),
          backgroundColor: AppColors.errorRed,
        ),
      );
    } else {
      setState(() {
        _recipientId = null;
        _hashtag = null;
        _points = 10;
        _messageController.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.rewardAppreciationSuccess,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final rewardState = ref.watch(rewardProvider);
    final isSubmitting = ref.watch(rewardSubmittingProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.rewardTitle, style: AppTextStyle.h1),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: context.l10n.rewardTabCatalog),
            Tab(text: context.l10n.rewardTabAppreciation),
            Tab(text: context.l10n.rewardTabActivity),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(rewardProvider.future),
        child: switch (rewardState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: RewardSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(rewardProvider),
                ),
              ),
            ),
          AsyncData(:final value) => TabBarView(
              controller: _tabController,
              children: [
                _CatalogTab(
                  data: value,
                  onRedeem: _confirmRedeem,
                ),
                _AppreciationTab(
                  data: value,
                  recipientId: _recipientId,
                  hashtag: _hashtag,
                  points: _points,
                  messageController: _messageController,
                  isSubmitting: isSubmitting,
                  onRecipientChanged: (v) => setState(() => _recipientId = v),
                  onHashtagChanged: (v) => setState(() => _hashtag = v),
                  onPointsChanged: (v) => setState(() => _points = v),
                  onSubmit: _sendAppreciation,
                ),
                _ActivityTab(data: value),
              ],
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _BalanceHeader extends StatelessWidget {
  final int balance;

  const _BalanceHeader({required this.balance});

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      child: Row(
        children: [
          const Icon(Icons.stars_rounded, color: AppColors.amberAccent, size: 28),
          const SizedBox(width: AppTheme.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n.rewardMyPoints, style: AppTextStyle.caption),
                Text(
                  context.l10n.rewardPointsCount(balance),
                  style: AppTextStyle.h1.copyWith(color: AppColors.amberAccent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CatalogTab extends StatelessWidget {
  final RewardData data;
  final void Function(RewardCatalogModel item) onRedeem;

  const _CatalogTab({required this.data, required this.onRedeem});

  @override
  Widget build(BuildContext context) {
    if (data.catalog.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppTheme.md),
        children: [
          _BalanceHeader(balance: data.balance),
          SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.5,
            child: EmptyView(
              icon: Icons.card_giftcard_rounded,
              title: context.l10n.emptyRewardCatalog,
            ),
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        _BalanceHeader(balance: data.balance),
        const SizedBox(height: AppTheme.md),
        ...data.catalog.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: AppTheme.sm),
            child: RewardCatalogCard(
              item: item,
              balance: data.balance,
              onRedeem: () => onRedeem(item),
            ),
          ),
        ),
      ],
    );
  }
}

class _AppreciationTab extends StatelessWidget {
  final RewardData data;
  final String? recipientId;
  final String? hashtag;
  final int points;
  final TextEditingController messageController;
  final bool isSubmitting;
  final ValueChanged<String?> onRecipientChanged;
  final ValueChanged<String?> onHashtagChanged;
  final ValueChanged<int> onPointsChanged;
  final VoidCallback onSubmit;

  const _AppreciationTab({
    required this.data,
    required this.recipientId,
    required this.hashtag,
    required this.points,
    required this.messageController,
    required this.isSubmitting,
    required this.onRecipientChanged,
    required this.onHashtagChanged,
    required this.onPointsChanged,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        _BalanceHeader(balance: data.balance),
        const SizedBox(height: AppTheme.md),
        HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(context.l10n.rewardSendAppreciation, style: AppTextStyle.h3),
              const SizedBox(height: AppTheme.md),
              DropdownButtonFormField<String>(
                value: recipientId,
                decoration: InputDecoration(
                  labelText: context.l10n.rewardRecipientLabel,
                ),
                items: data.colleagues
                    .map(
                      (c) => DropdownMenuItem(
                        value: c.id,
                        child: Text(c.name),
                      ),
                    )
                    .toList(),
                onChanged: onRecipientChanged,
              ),
              const SizedBox(height: AppTheme.sm),
              DropdownButtonFormField<String>(
                value: hashtag,
                decoration: InputDecoration(
                  labelText: context.l10n.rewardHashtagLabel,
                ),
                items: data.hashtags
                    .map(
                      (h) => DropdownMenuItem(
                        value: h.tag,
                        child: Text(h.tag),
                      ),
                    )
                    .toList(),
                onChanged: onHashtagChanged,
              ),
              const SizedBox(height: AppTheme.sm),
              DropdownButtonFormField<int>(
                value: points,
                decoration: InputDecoration(
                  labelText: context.l10n.rewardPointsLabel,
                ),
                items: List.generate(
                  10,
                  (i) => DropdownMenuItem(
                    value: (i + 1) * 10,
                    child: Text('${(i + 1) * 10}'),
                  ),
                ),
                onChanged: (v) => onPointsChanged(v ?? 10),
              ),
              const SizedBox(height: AppTheme.sm),
              TextField(
                controller: messageController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: context.l10n.reasonLabel,
                ),
              ),
              const SizedBox(height: AppTheme.md),
              ElevatedButton(
                onPressed: isSubmitting ? null : onSubmit,
                child: isSubmitting
                    ? const SizedBox(
                        width: AppTheme.md,
                        height: AppTheme.md,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.submit),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActivityTab extends StatelessWidget {
  final RewardData data;

  const _ActivityTab({required this.data});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        SectionLabel(context.l10n.rewardCompanyFeed),
        if (data.feed.isEmpty)
          EmptyView(
            icon: Icons.dynamic_feed_rounded,
            title: context.l10n.emptyRewardFeed,
          )
        else
          ...data.feed.map(
            (tx) => RewardTransactionTile(transaction: tx),
          ),
        const SizedBox(height: AppTheme.md),
        SectionLabel(context.l10n.rewardMyHistory),
        if (data.transactions.isEmpty)
          EmptyView(
            icon: Icons.history_rounded,
            title: context.l10n.emptyRewardHistory,
          )
        else
          ...data.transactions.map(
            (tx) => RewardTransactionTile(transaction: tx),
          ),
      ],
    );
  }
}

class RewardSkeleton extends StatelessWidget {
  const RewardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: List.generate(
          4,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppTheme.sm),
            child: SkeletonBox(height: 140),
          ),
        ),
      ),
    );
  }
}
