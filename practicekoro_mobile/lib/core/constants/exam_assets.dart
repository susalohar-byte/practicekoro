class ExamAssets {
  ExamAssets._();

  static const String logoWbp = 'assets/images/exams/logo_wbp.png';
  static const String logoKp = 'assets/images/exams/logo_kp.png';
  static const String logoWbpsc = 'assets/images/exams/logo_wbpsc.png';
  static const String logoRailway = 'assets/images/exams/logo_railway.png';
  static const String logoSsc = 'assets/images/exams/logo_ssc.png';
  static const String logoWbtet = 'assets/images/exams/logo_wbtet.png';
  static const String logoWbssc = 'assets/images/exams/emblem_wbssc.png';
  static const String emblemWbp = 'assets/images/exams/emblem_wbp.png';
  static const String emblemRailway = 'assets/images/exams/emblem_railway.png';
  static const String emblemSsc = 'assets/images/exams/emblem_ssc.png';

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
      return 'assets/images/exams/header_icon_wb.png';
    }
    if (name.contains('bank') ||
        name.contains('ibps') ||
        name.contains('sbi')) {
      return 'assets/images/exams/header_icon_central.png';
    }
    return logoWbp;
  }
}
