import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../providers/resources_provider.dart';
import '../utils/booking_lifecycle.dart';

const _roomCardHeight = 120.0;

class ResourceAvailabilityTab extends ConsumerStatefulWidget {
  final List<BookableResourceModel> resources;

  const ResourceAvailabilityTab({super.key, required this.resources});

  @override
  ConsumerState<ResourceAvailabilityTab> createState() =>
      _ResourceAvailabilityTabState();
}

class _ResourceAvailabilityTabState
    extends ConsumerState<ResourceAvailabilityTab> {
  late DateTime _selectedDate;
  List<ResourceBookingModel> _bookings = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _loading = true);
    try {
      final bookings = await ref
          .read(resourcesProvider.notifier)
          .fetchCalendarBookings(_selectedDate);
      if (mounted) {
        setState(() {
          _bookings = bookings;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _shiftDate(int days) {
    setState(() => _selectedDate = _selectedDate.add(Duration(days: days)));
    _loadBookings();
  }

  int _freeSlotsForResource(String resourceId) {
    var free = 0;
    for (var hour = 8; hour < 18; hour++) {
      final slotStart = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        hour,
      );
      final slotEnd = slotStart.add(const Duration(hours: 1));
      final occupied = _bookings.any((b) {
        if (b.resourceId != resourceId || !resourceBookingBlocksSlot(b)) {
          return false;
        }
        return b.startTime.isBefore(slotEnd) && b.endTime.isAfter(slotStart);
      });
      if (!occupied) free++;
    }
    return free;
  }

  void _openRoom(BookableResourceModel resource) {
    final dateStr =
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
    context.push('/resources/room/${resource.id}?date=$dateStr');
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(resourcesProvider, (_, next) {
      if (next.hasValue) _loadBookings();
    });

    if (widget.resources.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.meeting_room_rounded,
            title: context.l10n.emptyResources,
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        HiveCard(
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded),
                onPressed: () => _shiftDate(-1),
              ),
              Expanded(
                child: Text(
                  DateTimeFormatter.formatDate(
                    _selectedDate,
                    pattern: 'EEEE, d MMM yyyy',
                  ),
                  style: AppTextStyle.body1,
                  textAlign: TextAlign.center,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded),
                onPressed: () => _shiftDate(1),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.sm),
        Text(
          context.l10n.resourcesAvailabilityHint,
          style: AppTextStyle.caption,
        ),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(AppTheme.lg),
            child: Center(
              child: CircularProgressIndicator(color: AppColors.amberAccent),
            ),
          )
        else
          ...widget.resources.map((resource) {
            final freeSlots = _freeSlotsForResource(resource.id);
            return Padding(
              padding: const EdgeInsets.only(top: AppTheme.sm),
              child: SizedBox(
                height: _roomCardHeight,
                child: HiveCard(
                  onTap: () => _openRoom(resource),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              resource.name,
                              style: AppTextStyle.h3,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (resource.location != null)
                              Text(
                                resource.location!,
                                style: AppTextStyle.caption,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            Text(
                              context.l10n.resourcesFreeSlotsCount(freeSlots),
                              style: AppTextStyle.caption.copyWith(
                                color: freeSlots > 0
                                    ? AppColors.successGreen
                                    : AppColors.errorRed,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.amberAccent,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }
}
