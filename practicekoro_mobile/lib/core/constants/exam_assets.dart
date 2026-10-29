class ExamAssets {
  ExamAssets._();

  static const String logoWbp = 'assets/images/exams/logo_wbp.webp';
  static const String logoKp = 'assets/images/exams/logo_kp.webp';
  static const String logoWbpsc = 'assets/images/exams/logo_wbpsc.webp';
  static const String logoRailway = 'assets/images/exams/logo_railway.webp';
  static const String logoSsc = 'assets/images/exams/logo_ssc.webp';
  static const String logoWbtet = 'assets/images/exams/logo_wbtet.webp';
  static const String logoWbssc = 'assets/images/exams/emblem_wbssc.webp';
  static const String emblemWbp = 'assets/images/exams/emblem_wbp.webp';
  static const String emblemRailway = 'assets/images/exams/emblem_railway.webp';
  static const String emblemSsc = 'assets/images/exams/emblem_ssc.webp';

  static String? getRoundIconAsset(String? examName) {
    if (examName == null) return null;
    final name = examName.toLowerCase().trim();
    // WBPSC before WBP: "wbpsc" also contains "wbp".
    if (name.contains('wbpsc') ||
        name.contains('psc') ||
        name.contains('civil service') ||
        name.contains('wbcs')) {
      return logoWbpsc;
    }
    if (name.contains('wbp') ||
        name.contains('police') ||
        name.contains('constable')) {
      return logoWbp;
    }
    if (name.contains('kp') || name.contains('kolkata police')) {
      return logoKp;
    }
    if (name.contains('wbssc') ||
        name.contains('group c') ||
        name.contains('group d') ||
        name.contains('clerk')) {
      return logoWbssc;
    }
    if (name.contains('railway') ||
        name.contains('rrb') ||
        name.contains('ntpc') ||
        name.contains('alp')) {
      return logoRailway;
    }
    if (name.contains('ssc') ||
        name.contains('cgl') ||
        name.contains('chsl') ||
        name.contains('mts') ||
        name.contains('gd')) {
      return logoSsc;
    }
    if (name.contains('tet') ||
        name.contains('primary') ||
        name.contains('teacher')) {
      return logoWbtet;
    }
    if (name.contains('food') || name.contains('icds')) {
      return 'assets/images/exams/header_icon_wb.webp';
    }
    if (name.contains('bank') ||
        name.contains('ibps') ||
        name.contains('sbi')) {
      return 'assets/images/exams/header_icon_central.webp';
    }
    return logoWbp;
  }
}
