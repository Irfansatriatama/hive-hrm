import 'package:flutter/material.dart';

enum AppMenuId {
  attendance,
  leave,
  payslip,
  reward,
  resources,
  documents,
  assets,
  expense,
  shift,
  visitor,
  onboarding,
  orgChart,
  leaveCalendar,
  approval,
  announcement,
}

enum AppMenuSection { operational, hrTeam, manager, general }

class AppMenuItem {
  final AppMenuId id;
  final IconData icon;
  final String route;
  final AppMenuSection? section;
  final bool requiresApprover;

  const AppMenuItem({
    required this.id,
    required this.icon,
    required this.route,
    this.section,
    this.requiresApprover = false,
  });
}

const homeMenuItems = [
  AppMenuItem(
    id: AppMenuId.attendance,
    icon: Icons.fingerprint_rounded,
    route: '/attendance',
  ),
  AppMenuItem(
    id: AppMenuId.leave,
    icon: Icons.beach_access_rounded,
    route: '/leave',
  ),
  AppMenuItem(
    id: AppMenuId.payslip,
    icon: Icons.receipt_long_rounded,
    route: '/payslip',
  ),
  AppMenuItem(
    id: AppMenuId.reward,
    icon: Icons.emoji_events_rounded,
    route: '/reward',
  ),
  AppMenuItem(
    id: AppMenuId.resources,
    icon: Icons.meeting_room_rounded,
    route: '/resources',
  ),
  AppMenuItem(
    id: AppMenuId.documents,
    icon: Icons.folder_rounded,
    route: '/documents',
  ),
  AppMenuItem(
    id: AppMenuId.assets,
    icon: Icons.laptop_mac_rounded,
    route: '/assets',
  ),
];

const moreMenuItems = [
  AppMenuItem(
    id: AppMenuId.expense,
    icon: Icons.receipt_rounded,
    route: '/expense',
    section: AppMenuSection.operational,
  ),
  AppMenuItem(
    id: AppMenuId.shift,
    icon: Icons.schedule_rounded,
    route: '/shift',
    section: AppMenuSection.operational,
  ),
  AppMenuItem(
    id: AppMenuId.visitor,
    icon: Icons.person_pin_rounded,
    route: '/visitor',
    section: AppMenuSection.operational,
  ),
  AppMenuItem(
    id: AppMenuId.onboarding,
    icon: Icons.checklist_rounded,
    route: '/onboarding',
    section: AppMenuSection.hrTeam,
  ),
  AppMenuItem(
    id: AppMenuId.orgChart,
    icon: Icons.account_tree_rounded,
    route: '/org-chart',
    section: AppMenuSection.hrTeam,
  ),
  AppMenuItem(
    id: AppMenuId.leaveCalendar,
    icon: Icons.calendar_month_rounded,
    route: '/leave/calendar',
    section: AppMenuSection.hrTeam,
  ),
  AppMenuItem(
    id: AppMenuId.approval,
    icon: Icons.task_alt_rounded,
    route: '/approval',
    section: AppMenuSection.manager,
    requiresApprover: true,
  ),
  AppMenuItem(
    id: AppMenuId.announcement,
    icon: Icons.campaign_rounded,
    route: '/announcement',
    section: AppMenuSection.general,
  ),
];
