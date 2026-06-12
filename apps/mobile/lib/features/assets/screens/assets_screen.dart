import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_fab.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/assets_provider.dart';
import 'asset_request_sheet.dart';

class AssetsScreen extends ConsumerStatefulWidget {
  const AssetsScreen({super.key});

  @override
  ConsumerState<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends ConsumerState<AssetsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(assetsProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.assetsTitle, style: AppTextStyle.h1),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.amberAccent,
          labelColor: AppColors.amberAccent,
          unselectedLabelColor: AppColors.textSubtle,
          tabs: [
            Tab(text: context.l10n.assetsTabMine),
            Tab(text: context.l10n.assetsTabRequests),
          ],
        ),
      ),
      floatingActionButton: HiveFab.wrap(
        context,
        HiveFab(
          tooltip: context.l10n.assetsRequestCreate,
          onPressed: () => showAssetRequestSheet(context),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(assetsProvider.future),
        child: switch (state) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 280),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(assetsProvider),
                ),
              ),
            ),
          AsyncData(:final value) => TabBarView(
              controller: _tabController,
              children: [
                _AssetsList(assets: value.assets),
                _RequestsList(requests: value.requests),
              ],
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _AssetsList extends StatelessWidget {
  final List<AssetModel> assets;

  const _AssetsList({required this.assets});

  @override
  Widget build(BuildContext context) {
    if (assets.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.laptop_mac_rounded,
            title: context.l10n.emptyAssets,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: assets.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final asset = assets[index];
        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(asset.name, style: AppTextStyle.h3),
              Text(asset.assetCode, style: AppTextStyle.caption),
              const SizedBox(height: AppTheme.xs),
              Text('${asset.category} · ${asset.condition}', style: AppTextStyle.body2),
              if (asset.location != null)
                Text(asset.location!, style: AppTextStyle.caption),
              if (asset.assignedDate != null)
                Text(
                  DateTimeFormatter.formatDate(asset.assignedDate!),
                  style: AppTextStyle.caption,
                ),
            ],
          ),
        );
      },
    );
  }
}

class _RequestsList extends StatelessWidget {
  final List<AssetRequestModel> requests;

  const _RequestsList({required this.requests});

  StatusType _status(String status) => switch (status) {
        'approved' => StatusType.approved,
        'rejected' => StatusType.rejected,
        _ => StatusType.pending,
      };

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.inventory_2_outlined,
            title: context.l10n.emptyAssetRequests,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: requests.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final request = requests[index];
        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(request.assetName, style: AppTextStyle.h3),
                  ),
                  StatusBadge(status: _status(request.status)),
                ],
              ),
              Text(request.requestCode, style: AppTextStyle.caption),
              const SizedBox(height: AppTheme.xs),
              Text(request.reason, style: AppTextStyle.body2),
              Text(
                context.l10n.assetsDurationDays(request.duration),
                style: AppTextStyle.caption,
              ),
            ],
          ),
        );
      },
    );
  }
}
