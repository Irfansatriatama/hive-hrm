import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'connectivity_provider.g.dart';

bool _isOnline(List<ConnectivityResult> results) {
  return results.any(
    (result) =>
        result == ConnectivityResult.mobile ||
        result == ConnectivityResult.wifi ||
        result == ConnectivityResult.ethernet ||
        result == ConnectivityResult.vpn,
  );
}

@Riverpod(keepAlive: true)
class NetworkStatus extends _$NetworkStatus {
  @override
  Stream<bool> build() async* {
    final connectivity = Connectivity();
    final initial = await connectivity.checkConnectivity();
    yield _isOnline(initial);

    yield* connectivity.onConnectivityChanged.map(_isOnline);
  }
}
