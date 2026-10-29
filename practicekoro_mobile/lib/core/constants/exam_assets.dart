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

  /// Resolves an exam title and optional icon name/URL to a local bundled asset.
  /// If the iconName is a preset path (e.g. /images/exams/logo_kp.png), it extracts
  /// the name and maps it to the bundled .webp asset.
  static String? resolveExamAsset(String? examName, [String? iconName]) {
    final icon = iconName?.trim();
    if (icon != null && icon.isNotEmpty) {
      if (icon.startsWith('assets/')) {
        return icon;
      }
      final lower = icon.toLowerCase();
      // Match presets & filenames
      if (lower.contains('logo_kp') || lower.contains('kolkata_police')) {
        return logoKp;
      }
      if (lower.contains('emblem_wbssc') || lower.contains('logo_wbssc')) {
        return logoWbssc;
      }
      if (lower.contains('logo_wbtet') || lower.contains('icon_primary_tet')) {
        return logoWbtet;
      }
      if (lower.contains('logo_railway') || lower.contains('icon_railway')) {
        return logoRailway;
      }
      if (lower.contains('logo_ssc') || lower.contains('icon_ssc')) {
        return logoSsc;
      }
      if (lower.contains('logo_wbpsc') || lower.contains('wbcs_emblem')) {
        return logoWbpsc;
      }
      if (lower.contains('logo_wbp') || lower.contains('icon_wbp')) {
        return logoWbp;
      }

      // Match admin keywords / Lucide icon names
      if (lower == 'award' || lower == 'kolkata' || lower == 'kp') {
        return logoKp;
      }
      if (lower == 'school' || lower == 'wbssc') {
        return logoWbssc;
      }
      if (lower == 'tet' || lower == 'primary') {
        return logoWbtet;
      }
      if (lower == 'train' || lower == 'railway') {
        return logoRailway;
      }
      if (lower == 'ssc') {
        return logoSsc;
      }
      if (lower == 'food' || lower == 'icds' || lower == 'wbpsc' || lower == 'psc') {
        return logoWbpsc;
      }
      if (lower == 'shield' || lower == 'wbp') {
        return logoWbp;
      }
    }

    return getRoundIconAsset(examName);
  }

  static String? getRoundIconAsset(String? examName) {
    if (examName == null) return null;
    final name = examName.toLowerCase().trim();

    // 1. Kolkata Police (MUST be checked BEFORE general 'police' to avoid WBP shield clash!)
    if (name.contains('kolkata') || name.contains('kp')) {
      return logoKp;
    }

    // 2. WBSSC Group C & D (MUST be checked BEFORE general 'ssc' or 'police'!)
    if (name.contains('wbssc') ||
        name.contains('school service') ||
        name.contains('group c') ||
        name.contains('group d') ||
        name.contains('clerk')) {
      return logoWbssc;
    }

    // 3. Primary TET / Upper Primary TET / Teaching
    if (name.contains('tet') ||
        name.contains('primary') ||
        name.contains('teacher') ||
        name.contains('slst') ||
        name.contains('ctet')) {
      return logoWbtet;
    }

    // 4. Indian Railway (RRB / NTPC / ALP / Group D)
    if (name.contains('railway') ||
        name.contains('rrb') ||
        name.contains('ntpc') ||
        name.contains('alp')) {
      return logoRailway;
    }

    // 5. Staff Selection Commission (SSC CGL / CHSL / MTS / GD)
    if (name.contains('ssc') ||
        name.contains('cgl') ||
        name.contains('chsl') ||
        name.contains('mts') ||
        name.contains('gd')) {
      return logoSsc;
    }

    // 6. WBPSC / WBCS / Food SI / ICDS / Clerkship
    if (name.contains('wbpsc') ||
        name.contains('psc') ||
        name.contains('civil service') ||
        name.contains('wbcs') ||
        name.contains('food') ||
        name.contains('icds') ||
        name.contains('clerkship')) {
      return logoWbpsc;
    }

    // 7. West Bengal Police (WBP Constable / SI / Lady Constable)
    if (name.contains('wbp') ||
        name.contains('police') ||
        name.contains('constable') ||
        name.contains('sub-inspector') ||
        name.contains('sergeant')) {
      return logoWbp;
    }

    if (name.contains('bank') ||
        name.contains('ibps') ||
        name.contains('sbi')) {
      return 'assets/images/exams/header_icon_central.webp';
    }

    return logoWbpsc;
  }
}
