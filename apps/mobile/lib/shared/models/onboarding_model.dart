class OnboardingTaskModel {
  final String id;
  final String title;
  final String? description;
  final String category;
  final String assignedTo;
  final int dueAfterDays;

  const OnboardingTaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.assignedTo,
    required this.dueAfterDays,
  });

  factory OnboardingTaskModel.fromJson(Map<String, dynamic> json) {
    return OnboardingTaskModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String? ?? '',
      assignedTo: json['assignedTo'] as String? ?? 'employee',
      dueAfterDays: (json['dueAfterDays'] as num?)?.toInt() ?? 0,
    );
  }
}

class OnboardingTaskProgressModel {
  final String id;
  final String taskId;
  final String status;
  final OnboardingTaskModel task;

  const OnboardingTaskProgressModel({
    required this.id,
    required this.taskId,
    required this.status,
    required this.task,
  });

  factory OnboardingTaskProgressModel.fromJson(Map<String, dynamic> json) {
    return OnboardingTaskProgressModel(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      status: json['status'] as String? ?? 'pending',
      task: OnboardingTaskModel.fromJson(json['task'] as Map<String, dynamic>),
    );
  }

  bool get isDone => status == 'done' || status == 'skipped';
}

class OnboardingTemplateModel {
  final String id;
  final String name;
  final String? description;

  const OnboardingTemplateModel({
    required this.id,
    required this.name,
    this.description,
  });

  factory OnboardingTemplateModel.fromJson(Map<String, dynamic> json) {
    return OnboardingTemplateModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }
}

class OnboardingAssignmentModel {
  final String id;
  final String status;
  final String startDate;
  final String? completedAt;
  final OnboardingTemplateModel template;
  final List<OnboardingTaskProgressModel> taskProgress;

  const OnboardingAssignmentModel({
    required this.id,
    required this.status,
    required this.startDate,
    this.completedAt,
    required this.template,
    required this.taskProgress,
  });

  factory OnboardingAssignmentModel.fromJson(Map<String, dynamic> json) {
    return OnboardingAssignmentModel(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'in_progress',
      startDate: json['startDate'] as String,
      completedAt: json['completedAt'] as String?,
      template: OnboardingTemplateModel.fromJson(
        json['template'] as Map<String, dynamic>,
      ),
      taskProgress: (json['taskProgress'] as List<dynamic>? ?? [])
          .map(
            (e) => OnboardingTaskProgressModel.fromJson(
              e as Map<String, dynamic>,
            ),
          )
          .toList(),
    );
  }

  int get progressPercent {
    if (taskProgress.isEmpty) return 0;
    final done = taskProgress.where((p) => p.isDone).length;
    return ((done / taskProgress.length) * 100).round();
  }

  int get doneCount => taskProgress.where((p) => p.isDone).length;
}
