import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive_hrm/main.dart';

void main() {
  testWidgets('App launches and shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: HiveHrmApp()),
    );
    await tester.pumpAndSettle();

    expect(find.text('HIVE HRM'), findsOneWidget);
  });
}
