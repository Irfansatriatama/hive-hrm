import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/hive_fab.dart';
import '../../profile/providers/profile_provider.dart';
import '../providers/resources_provider.dart';
import '../utils/booking_lifecycle.dart';
import 'resource_booking_detail_sheet.dart';
import 'resource_booking_sheet.dart';

const _dayStartHour = 8;
const _dayEndHour = 18;

class ResourceRoomScheduleScreen extends ConsumerStatefulWidget {
  final String resourceId;
  final String? initialDate;

  const ResourceRoomScheduleScreen({
    super.key,
    required this.resourceId,
    this.initialDate,
  });

  @override
  ConsumerState<ResourceRoomScheduleScreen> createState() =>
      _ResourceRoomScheduleScreenState();
}

class _ResourceRoomScheduleScreenState
    extends ConsumerState<ResourceRoomScheduleScreen> {
  late DateTime _selectedDate;
  List<ResourceBookingModel> _bookings = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.initialDate != null
        ? DateTime.tryParse(widget.initialDate!) ?? DateTime.now()
        : DateTime.now();
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
          _bookings = bookings
              .where((b) => b.resourceId == widget.resourceId)
              .toList();
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

  ResourceBookingModel? _bookingForHour(int hour) {
    final slotStart = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      hour,
    );
    final slotEnd = slotStart.add(const Duration(hours: 1));
    for (final booking in _bookings) {
      if (!resourceBookingBlocksSlot(booking)) continue;
      if (booking.startTime.isBefore(slotEnd) &&
          booking.endTime.isAfter(slotStart)) {
        return booking;
      }
    }
    return null;
  }

  void _onSlotTap(
    BookableResourceModel resource,
    List<BookableResourceModel> allResources,
    int hour,
  ) {
    final booking = _bookingForHour(hour);
    final profileId = ref.read(profileProvider).valueOrNull?.id;
    if (booking != null) {
      showResourceBookingDetailSheet(
        context,
        booking: booking,
        profileId: profileId,
        canApproveOthers: false,
      );
      return;
    }
    showResourceBookingSheet(
      context,
      resources: allResources,
      initialResourceId: resource.id,
      initialDate: _selectedDate,
      initialStartTime: TimeOfDay(hour: hour, minute: 0),
      initialEndTime: TimeOfDay(hour: hour + 1, minute: 0),
    );
  }

  @override
  Widget build(BuildContext context) {
    final resourcesState = ref.watch(resourcesProvider);
    final resources = resourcesState.valueOrNull?.resources ?? const [];
    final resource = resources
        .where((r) => r.id == widget.resourceId)
        .cast<BookableResourceModel?>()
        .firstWhere((r) => r != null, orElse: () => null);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(
          resource?.name ?? context.l10n.resourcesSelectRoom,
          style: AppTextStyle.h1,
        ),
      ),
      floatingActionButton: HiveFab.wrap(
        context,
        HiveFab(
          tooltip: context.l10n.resourcesBookingTitle,
          onPressed: resource == null
              ? null
              : () => showResourceBookingSheet(
                    context,
                    resources: resources,
                    initialResourceId: resource.id,
                    initialDate: _selectedDate,
                  ),
        ),
      ),
      body: resource == null
          ? Center(
              child: Text(context.l10n.emptyResources, style: AppTextStyle.body2),
            )
          : ListView(
              padding: const EdgeInsets.all(AppTheme.md),
              children: [
                if (resource.location != null)
                  Text(resource.location!, style: AppTextStyle.caption),
                if (resource.capacity != null)
                  Text(
                    context.l10n.resourcesCapacity(resource.capacity!),
                    style: AppTextStyle.caption,
                  ),
                const SizedBox(height: AppTheme.md),
                HiveCard(
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => _shiftDate(-1),
                        icon: const Icon(Icons.chevron_left_rounded),
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
                        onPressed: () => _shiftDate(1),
                        icon: const Icon(Icons.chevron_right_rounded),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppTheme.sm),
                Text(
                  context.l10n.resourcesRoomScheduleHint,
                  style: AppTextStyle.caption,
                ),
                const SizedBox(height: AppTheme.md),
                if (_loading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(AppTheme.lg),
                      child: CircularProgressIndicator(
                        color: AppColors.amberAccent,
                      ),
                    ),
                  )
                else
                  ...List.generate(_dayEndHour - _dayStartHour, (index) {
                    final hour = _dayStartHour + index;
                    final booking = _bookingForHour(hour);
                    final isBooked = booking != null;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.sm),
                      child: HiveCard(
                        onTap: () => _onSlotTap(resource, resources, hour),
                        child: Row(
                          children: [
                            Container(
                              width: 56,
                              padding: const EdgeInsets.symmetric(
                                vertical: AppTheme.sm,
                              ),
                              decoration: BoxDecoration(
                                color: isBooked
                                    ? AppColors.errorRed.withValues(alpha: 0.15)
                                    : AppColors.successGreen
                                        .withValues(alpha: 0.15),
                                borderRadius:
                                    BorderRadius.circular(AppTheme.radiusBtn),
                              ),
                              child: Text(
                                '${hour.toString().padLeft(2, '0')}:00',
                                style: AppTextStyle.body2.copyWith(
                                  color: isBooked
                                      ? AppColors.errorRed
                                      : AppColors.successGreen,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            const SizedBox(width: AppTheme.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isBooked
                                        ? context.l10n.resourcesSlotBooked
                                        : context.l10n.resourcesSlotFree,
                                    style: AppTextStyle.body1,
                                  ),
                                  if (isBooked && booking.employeeName != null)
                                    Text(
                                      context.l10n.resourcesBookedBy(
                                        booking.employeeName!,
                                      ),
                                      style: AppTextStyle.caption,
                                    ),
                                  if (isBooked)
                                    Text(
                                      booking.title,
                                      style: AppTextStyle.caption,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                ],
                              ),
                            ),
                            Icon(
                              isBooked
                                  ? Icons.event_busy_rounded
                                  : Icons.add_circle_outline_rounded,
                              color: isBooked
                                  ? AppColors.errorRed
                                  : AppColors.amberAccent,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
