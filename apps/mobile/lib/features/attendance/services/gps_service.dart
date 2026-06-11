import 'package:geolocator/geolocator.dart';

class GpsResult {
  final double? latitude;
  final double? longitude;
  final GpsFailure? failure;

  const GpsResult({
    this.latitude,
    this.longitude,
    this.failure,
  });

  bool get hasCoordinates => latitude != null && longitude != null;
}

enum GpsFailure {
  permissionDenied,
  serviceDisabled,
  unavailable,
}

class GpsService {
  GpsService._();

  static Future<GpsResult> resolve({required bool required}) async {
    final permission = await Geolocator.requestPermission();
    if (permission != LocationPermission.whileInUse &&
        permission != LocationPermission.always) {
      return GpsResult(
        failure: required ? GpsFailure.permissionDenied : null,
      );
    }

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return GpsResult(
        failure: required ? GpsFailure.serviceDisabled : null,
      );
    }

    Position? position;
    try {
      position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (_) {
      position = null;
    }

    if (position == null) {
      return GpsResult(
        failure: required ? GpsFailure.unavailable : null,
      );
    }

    return GpsResult(
      latitude: position.latitude,
      longitude: position.longitude,
    );
  }
}
