import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Background hierarchy — warm ink, not generic navy
  static const Color primaryNavy = Color(0xFF0D0B12);
  static const Color surfaceBlue = Color(0xFF1A1722);
  static const Color cardElevated = Color(0xFF242030);

  // Brand
  static const Color amberAccent = Color(0xFFFFB830);
  static const Color tealSecondary = Color(0xFFFF7A6B);

  // Accent palette for cards, icons, and highlights
  static const Color accentViolet = Color(0xFF9B8AFB);
  static const Color accentMint = Color(0xFF4ECDC4);
  static const Color accentRose = Color(0xFFFF7A6B);
  static const Color accentSky = Color(0xFF5BB8FF);

  // Text
  static const Color textPrimary = Color(0xFFF5F3F7);
  static const Color textSubtle = Color(0xFF8E8A9A);
  static const Color dividerLine = Color(0xFF2E2A38);

  // Semantic
  static const Color successGreen = Color(0xFF3DDB8A);
  static const Color warningAmber = Color(0xFFFFC947);
  static const Color errorRed = Color(0xFFFF6B6B);

  static const LinearGradient scaffoldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0D0B12),
      Color(0xFF16131F),
      Color(0xFF1A1525),
      Color(0xFF0D0B12),
    ],
    stops: [0.0, 0.35, 0.7, 1.0],
  );

  static const LinearGradient honeyGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFD060), Color(0xFFFF9A3C)],
  );

  static const LinearGradient cardSheen = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF242030),
      Color(0xFF1E1B28),
    ],
  );

  static const List<Color> statAccents = [
    accentRose,
    accentMint,
    accentViolet,
    amberAccent,
  ];

  static const List<Color> menuIconAccents = [
    accentRose,
    accentMint,
    accentViolet,
    accentSky,
    amberAccent,
    accentRose,
    accentMint,
    accentViolet,
    accentSky,
    amberAccent,
    accentRose,
    accentMint,
    accentViolet,
    accentSky,
  ];
}
