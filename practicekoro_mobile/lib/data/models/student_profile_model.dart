/// A student's profile, mirroring the `public.profiles` columns the admin
/// panel manages, so it can be synced to Supabase unchanged once sign-in
/// exists. Codes (gender, category, preparation status) use the same values as
/// the database and the admin panel.
class StudentProfileModel {
  final String fullName;
  final String email;
  final String phone;
  final String? avatarUrl;
  final String? customAvatarUrl;
  final String? googleAvatarUrl;
  final DateTime? dob;
  final String gender; // MALE | FEMALE | OTHER | NOT_SPECIFIED
  final String? targetExamId;
  final String? targetExamTitle;
  final String
  preparationStatus; // BEGINNER | INTERMEDIATE | ADVANCED | REVISION
  final List<String> preferredSubjects; // subject names
  final String state;
  final String? district;
  final String? block;
  final String
  category; // GEN | OBC_A | OBC_B | SC | ST | EWS | PWD | OTHER | NOT_SPECIFIED
  final String accountStatus; // active | inactive — set by admins only
  final DateTime? createdAt;
  final bool isPro;

  const StudentProfileModel({
    this.fullName = '',
    this.email = '',
    this.phone = '',
    this.avatarUrl,
    this.customAvatarUrl,
    this.googleAvatarUrl,
    this.dob,
    this.gender = 'NOT_SPECIFIED',
    this.targetExamId,
    this.targetExamTitle,
    this.preparationStatus = 'BEGINNER',
    this.preferredSubjects = const [],
    this.state = 'West Bengal',
    this.district,
    this.block,
    this.category = 'NOT_SPECIFIED',
    this.accountStatus = 'active',
    this.createdAt,
    this.isPro = false,
  });

  /// Priority: Custom uploaded picture > Google profile picture > fallback (null)
  String? get effectiveAvatarUrl {
    final custom = (customAvatarUrl ?? '').trim();
    if (custom.isNotEmpty) return custom;
    final primary = (avatarUrl ?? '').trim();
    if (primary.isNotEmpty) return primary;
    final google = (googleAvatarUrl ?? '').trim();
    if (google.isNotEmpty) return google;
    return null;
  }

  static const genders = {
    'MALE': 'Male',
    'FEMALE': 'Female',
    'OTHER': 'Other',
    'NOT_SPECIFIED': 'Prefer not to say',
  };

  static const categories = {
    'GEN': 'General (UR)',
    'OBC_A': 'OBC-A',
    'OBC_B': 'OBC-B',
    'SC': 'SC',
    'ST': 'ST',
    'EWS': 'EWS',
    'PWD': 'PwD',
    'OTHER': 'Other',
    'NOT_SPECIFIED': 'Not specified',
  };

  static String normalizeCategoryCode(String? raw) {
    if (raw == null || raw.trim().isEmpty) return 'NOT_SPECIFIED';
    final upper = raw.trim().toUpperCase();
    if (categories.containsKey(upper)) return upper;
    if (upper.contains('OBC_A') || upper.contains('OBC-A') || upper.contains('OBC A')) return 'OBC_A';
    if (upper.contains('OBC_B') || upper.contains('OBC-B') || upper.contains('OBC B')) return 'OBC_B';
    if (upper.contains('SC') || upper.contains('SCHEDULED CASTE')) return 'SC';
    if (upper.contains('ST') || upper.contains('SCHEDULED TRIBE')) return 'ST';
    if (upper.contains('EWS')) return 'EWS';
    if (upper.contains('PWD')) return 'PWD';
    if (upper.contains('GEN') || upper.contains('UR') || upper.contains('UNRESERVED')) return 'GEN';
    return 'NOT_SPECIFIED';
  }

  static const preparationLevels = {
    'BEGINNER': 'Beginner',
    'INTERMEDIATE': 'Intermediate',
    'ADVANCED': 'Advanced',
    'REVISION': 'Revision',
  };

  static const preparationDescriptions = {
    'BEGINNER': 'Starting preparation',
    'INTERMEDIATE': 'Covered the basics',
    'ADVANCED': 'Exam-ready practice',
    'REVISION': 'Final revision',
  };

  /// The 23 districts of West Bengal (same list as the admin panel).
  static const westBengalDistricts = [
    'Alipurduar',
    'Bankura',
    'Birbhum',
    'Cooch Behar',
    'Dakshin Dinajpur',
    'Darjeeling',
    'Hooghly',
    'Howrah',
    'Jalpaiguri',
    'Jhargram',
    'Kalimpong',
    'Kolkata',
    'Malda',
    'Murshidabad',
    'Nadia',
    'North 24 Parganas',
    'Paschim Bardhaman',
    'Paschim Medinipur',
    'Purba Bardhaman',
    'Purba Medinipur',
    'Purulia',
    'South 24 Parganas',
    'Uttar Dinajpur',
  ];

  /// Master list of all Community Development (CD) Blocks / Municipal Zones
  /// for all 23 districts of West Bengal.
  static const Map<String, List<String>> westBengalBlocks = {
    'Alipurduar': [
      'Alipurduar I',
      'Alipurduar II',
      'Falakata',
      'Kalchini',
      'Kumargram',
      'Madarihat-Birpara',
    ],
    'Bankura': [
      'Bankura I',
      'Bankura II',
      'Barjora',
      'Chhatna',
      'Gangajalghati',
      'Mejia',
      'Onda',
      'Saltora',
      'Indpur',
      'Khatra',
      'Hirbandh',
      'Ranibandh',
      'Raipur',
      'Sarenga',
      'Simlapal',
      'Taldangra',
      'Bishnupur',
      'Joypur',
      'Kotulpur',
      'Sonamukhi',
      'Patrasayer',
      'Indus',
    ],
    'Birbhum': [
      'Suri I',
      'Suri II',
      'Sainthia',
      'Dubrajpur',
      'Khoyrasol',
      'Rajnagar',
      'Mohammad Bazar',
      'Bolpur Sriniketan',
      'Ilambazar',
      'Labpur',
      'Nanoor',
      'Rampurhat I',
      'Rampurhat II',
      'Mayureswar I',
      'Mayureswar II',
      'Nalhati I',
      'Nalhati II',
      'Murarai I',
      'Murarai II',
    ],
    'Cooch Behar': [
      'Cooch Behar I',
      'Cooch Behar II',
      'Dinhata I',
      'Dinhata II',
      'Sitai',
      'Mathabhanga I',
      'Mathabhanga II',
      'Sitalkuchi',
      'Mekhliganj',
      'Haldibari',
      'Tufanganj I',
      'Tufanganj II',
    ],
    'Dakshin Dinajpur': [
      'Balurghat',
      'Hili',
      'Kumarganj',
      'Tapan',
      'Gangarampur',
      'Banshihari',
      'Harirampur',
      'Kushmandi',
    ],
    'Darjeeling': [
      'Darjeeling Pulbazar',
      'Rangli Rangliot',
      'Jorebunglow Sukhiapokhri',
      'Mirik',
      'Kurseong',
      'Matigara',
      'Naxalbari',
      'Phansidewa',
      'Kharibari',
    ],
    'Hooghly': [
      'Chinsurah-Mogra',
      'Polba Dadpur',
      'Balagarh',
      'Pandua',
      'Dhaniakhali',
      'Tarakeswar',
      'Haripal',
      'Singur',
      'Chanditala I',
      'Chanditala II',
      'Jangipara',
      'Serampore Uttarpara',
      'Arambagh',
      'Pursurah',
      'Khanakul I',
      'Khanakul II',
      'Goghat I',
      'Goghat II',
    ],
    'Howrah': [
      'Bally Jagachha',
      'Domjur',
      'Panchla',
      'Sankrail',
      'Jagatballavpur',
      'Uluberia I',
      'Uluberia II',
      'Amta I',
      'Amta II',
      'Udaynarayanpur',
      'Bagnan I',
      'Bagnan II',
      'Shyampur I',
      'Shyampur II',
    ],
    'Jalpaiguri': [
      'Jalpaiguri',
      'Maynaguri',
      'Dhupguri',
      'Mal',
      'Matiali',
      'Nagrakata',
      'Kranti',
    ],
    'Jhargram': [
      'Jhargram',
      'Binpur I',
      'Binpur II',
      'Jamboni',
      'Gopiballavpur I',
      'Gopiballavpur II',
      'Sankrail',
      'Nayagram',
    ],
    'Kalimpong': [
      'Kalimpong I',
      'Kalimpong II',
      'Gorubathan',
      'Lava',
    ],
    'Kolkata': [
      'Kolkata North',
      'Kolkata South',
      'Kolkata Central',
      'Kolkata East',
      'Kolkata Port',
      'Jadavpur',
      'Tollygunge',
      'Behala',
      'Gariahat',
      'Salt Lake',
    ],
    'Malda': [
      'English Bazar',
      'Old Malda',
      'Habibpur',
      'Bamangola',
      'Gazole',
      'Chanchal I',
      'Chanchal II',
      'Ratua I',
      'Ratua II',
      'Harischandrapur I',
      'Harischandrapur II',
      'Kaliachak I',
      'Kaliachak II',
      'Kaliachak III',
      'Manikchak',
    ],
    'Murshidabad': [
      'Berhampore',
      'Beldanga I',
      'Beldanga II',
      'Hariharpara',
      'Naoda',
      'Kandi',
      'Khargram',
      'Burwan',
      'Bharatpur I',
      'Bharatpur II',
      'Jangipur',
      'Raghunathganj I',
      'Raghunathganj II',
      'Suti I',
      'Suti II',
      'Samserganj',
      'Farakka',
      'Lalbagh',
      'Murshidabad-Jiaganj',
      'Bhagabangola I',
      'Bhagabangola II',
      'Lalgola',
      'Domkal',
      'Jalangi',
      'Raninagar I',
      'Raninagar II',
      'Nabagram',
    ],
    'Nadia': [
      'Krishnanagar I',
      'Krishnanagar II',
      'Nabadwip',
      'Chapra',
      'Nakashipara',
      'Kaliganj',
      'Tehatta I',
      'Tehatta II',
      'Karimpur I',
      'Karimpur II',
      'Ranaghat I',
      'Ranaghat II',
      'Shantipur',
      'Hanskhali',
      'Chakdaha',
      'Kalyani',
      'Haringhata',
    ],
    'North 24 Parganas': [
      'Barasat I',
      'Barasat II',
      'Amdanga',
      'Deganga',
      'Habra I',
      'Habra II',
      'Rajarhat',
      'Basirhat I',
      'Basirhat II',
      'Baduria',
      'Haroa',
      'Hasnabad',
      'Hingalganj',
      'Minakhan',
      'Sandeshkhali I',
      'Sandeshkhali II',
      'Swarupnagar',
      'Bongaon',
      'Bagdah',
      'Gaighata',
      'Barrackpore I',
      'Barrackpore II',
    ],
    'Paschim Bardhaman': [
      'Asansol Municipal Corp',
      'Durgapur Municipal Corp',
      'Andal',
      'Pandabeswar',
      'Faridpur-Durgapur',
      'Kanksa',
      'Raniganj',
      'Salanpur',
      'Barabani',
    ],
    'Paschim Medinipur': [
      'Midnapore Sadar',
      'Garhbeta I',
      'Garhbeta II',
      'Garhbeta III',
      'Keshpur',
      'Salboni',
      'Debra',
      'Pingla',
      'Kharagpur I',
      'Kharagpur II',
      'Sabang',
      'Dantan I',
      'Dantan II',
      'Keshiary',
      'Mohanpur',
      'Narayangarh',
      'Ghatal',
      'Chandrakona I',
      'Chandrakona II',
      'Daspur I',
      'Daspur II',
    ],
    'Purba Bardhaman': [
      'Burdwan I',
      'Burdwan II',
      'Bhatar',
      'Galsi I',
      'Galsi II',
      'Ausgram I',
      'Ausgram II',
      'Jamalpur',
      'Memari I',
      'Memari II',
      'Kalna I',
      'Kalna II',
      'Manteswar',
      'Purbasthali I',
      'Purbasthali II',
      'Katwa I',
      'Katwa II',
      'Ketugram I',
      'Ketugram II',
      'Mongalkote',
      'Raina I',
      'Raina II',
      'Khandaghosh',
    ],
    'Purba Medinipur': [
      'Tamluk',
      'Sahid Matangini',
      'Panskura',
      'Kolaghat',
      'Moyna',
      'Nandakumar',
      'Chandipur',
      'Mahishadal',
      'Nandigram I',
      'Nandigram II',
      'Sutahata',
      'Haldia',
      'Contai I',
      'Contai II',
      'Contai III',
      'Deshapran',
      'Khejuri I',
      'Khejuri II',
      'Ramnagar I',
      'Ramnagar II',
      'Egra I',
      'Egra II',
      'Bhagabanpur I',
      'Bhagabanpur II',
      'Patashpur I',
      'Patashpur II',
    ],
    'Purulia': [
      'Purulia I',
      'Purulia II',
      'Balarampur',
      'Barabazar',
      'Hura',
      'Jhalda I',
      'Jhalda II',
      'Kashipur',
      'Manbazar I',
      'Manbazar II',
      'Neturia',
      'Para',
      'Puncha',
      'Raghunathpur I',
      'Raghunathpur II',
      'Santuri',
      'Arsha',
      'Baghmundi',
      'Joypur',
      'Bundwan',
    ],
    'South 24 Parganas': [
      'Alipore Sadar',
      'Bishnupur I',
      'Bishnupur II',
      'Budge Budge I',
      'Budge Budge II',
      'Thakurpukur Maheshtala',
      'Baruipur',
      'Bhangar I',
      'Bhangar II',
      'Jaynagar I',
      'Jaynagar II',
      'Kultali',
      'Sonarpur',
      'Canning I',
      'Canning II',
      'Basanti',
      'Gosaba',
      'Diamond Harbour I',
      'Diamond Harbour II',
      'Falta',
      'Kulpi',
      'Magrahat I',
      'Magrahat II',
      'Mandirbazar',
      'Mathurapur I',
      'Mathurapur II',
      'Kakdwip',
      'Namkhana',
      'Patharpratima',
      'Sagar',
    ],
    'Uttar Dinajpur': [
      'Raiganj',
      'Hemtabad',
      'Kaliaganj',
      'Itahar',
      'Islampur',
      'Chopra',
      'Goalpokhar I',
      'Goalpokhar II',
      'Karandighi',
    ],
  };

  /// Returns the sorted list of CD Blocks / Municipal Zones for a given district.
  static List<String> getBlocksForDistrict(String? district) {
    if (district == null || district.trim().isEmpty) return const [];
    final clean = district.trim().toLowerCase();
    for (final entry in westBengalBlocks.entries) {
      if (entry.key.toLowerCase() == clean) {
        return entry.value;
      }
    }
    return const [];
  }

  String get genderLabel => genders[gender] ?? 'Prefer not to say';
  String get categoryLabel => categories[category] ?? 'Not specified';
  String get preparationLabel =>
      preparationLevels[preparationStatus] ?? 'Beginner';

  /// Fields a student is expected to fill in, used for the completion meter.
  List<bool> get _filled => [
    fullName.trim().isNotEmpty,
    email.trim().isNotEmpty,
    (district ?? '').isNotEmpty,
    category != 'NOT_SPECIFIED' && category.isNotEmpty,
    (targetExamTitle ?? '').isNotEmpty,
    dob != null,
  ];

  double get completion => _filled.where((f) => f).length / _filled.length;

  int get missingCount => _filled.where((f) => !f).length;

  static String? resolveExamTitle(String? examId) {
    if (examId == null || examId.trim().isEmpty) return null;
    return switch (examId.toLowerCase().trim()) {
      'exam_wbp' || 'wbp-constable' || 'wbp' => 'WBP Constable',
      'exam_wbpsc' || 'wbpsc' => 'WBPSC',
      'exam_kp' || 'kp-si' || 'kp' => 'Kolkata Police SI',
      'exam_ssc' || 'ssc' => 'SSC CGL / CHSL / MTS',
      'exam_railway' || 'railway' => 'RRB NTPC & Group D',
      'exam_banking' || 'banking' => 'IBPS & SBI Bank Exams',
      _ => null,
    };
  }

  StudentProfileModel copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? customAvatarUrl,
    String? googleAvatarUrl,
    bool clearCustomAvatar = false,
    bool clearGoogleAvatar = false,
    DateTime? dob,
    bool clearDob = false,
    String? gender,
    String? targetExamId,
    String? targetExamTitle,
    String? preparationStatus,
    List<String>? preferredSubjects,
    String? state,
    String? district,
    String? block,
    bool clearBlock = false,
    String? category,
    DateTime? createdAt,
    bool? isPro,
  }) {
    final nextExamId = targetExamId ?? this.targetExamId;
    final nextExamTitle = targetExamTitle ??
        (targetExamId != null
            ? resolveExamTitle(targetExamId)
            : this.targetExamTitle);
    return StudentProfileModel(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      customAvatarUrl: clearCustomAvatar
          ? null
          : (customAvatarUrl ?? this.customAvatarUrl),
      googleAvatarUrl: clearGoogleAvatar
          ? null
          : (googleAvatarUrl ?? this.googleAvatarUrl),
      dob: clearDob ? null : (dob ?? this.dob),
      gender: gender ?? this.gender,
      targetExamId: nextExamId,
      targetExamTitle: nextExamTitle,
      preparationStatus: preparationStatus ?? this.preparationStatus,
      preferredSubjects: preferredSubjects ?? this.preferredSubjects,
      state: state ?? this.state,
      district: district ?? this.district,
      block: clearBlock ? null : (block ?? this.block),
      category: category ?? this.category,
      accountStatus: accountStatus,
      createdAt: createdAt ?? this.createdAt,
      isPro: isPro ?? this.isPro,
    );
  }

  factory StudentProfileModel.fromJson(Map<String, dynamic> json) {
    String code(String key, Map<String, String> allowed, String fallback) {
      final v = json[key]?.toString().toUpperCase();
      return v != null && allowed.containsKey(v) ? v : fallback;
    }

    final examId = json['target_exam_id']?.toString();
    var examTitle = json['target_exam_title']?.toString();
    if ((examTitle == null || examTitle.trim().isEmpty) && examId != null) {
      examTitle = resolveExamTitle(examId);
    }

    final customAvatar = json['custom_avatar_url']?.toString();
    final googleAvatar = json['google_avatar_url']?.toString() ??
        json['picture']?.toString();
    final primaryAvatar = json['avatar_url']?.toString() ??
        json['avatarUrl']?.toString() ??
        customAvatar ??
        googleAvatar;

    return StudentProfileModel(
      fullName: json['full_name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      avatarUrl: primaryAvatar,
      customAvatarUrl: customAvatar,
      googleAvatarUrl: googleAvatar,
      dob: json['dob'] != null
          ? DateTime.tryParse(json['dob'].toString())
          : (json['birth_date'] != null
              ? DateTime.tryParse(json['birth_date'].toString())
              : null),
      gender: code('gender', genders, 'NOT_SPECIFIED'),
      targetExamId: examId,
      targetExamTitle: examTitle,
      preparationStatus: code(
        'preparation_status',
        preparationLevels,
        'BEGINNER',
      ),
      preferredSubjects:
          (json['preferred_subjects'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      state: json['state']?.toString() ?? 'West Bengal',
      district: json['district']?.toString(),
      block: json['block']?.toString(),
      category: normalizeCategoryCode(
        json['category']?.toString() ?? json['caste']?.toString(),
      ),
      accountStatus: json['account_status']?.toString() == 'inactive'
          ? 'inactive'
          : 'active',
      createdAt: json['created_at'] == null
          ? null
          : DateTime.tryParse(json['created_at'].toString()),
      isPro: json['is_pro'] as bool? ??
          json['isPro'] as bool? ??
          (json['plan']?.toString().toLowerCase() == 'pro'),
    );
  }

  /// Same keys as `public.profiles`.
  Map<String, dynamic> toJson() => {
    'full_name': fullName,
    'email': email,
    'phone': phone,
    'avatar_url': effectiveAvatarUrl,
    'custom_avatar_url': customAvatarUrl,
    'google_avatar_url': googleAvatarUrl,
    'dob': dob == null
        ? null
        : '${dob!.year.toString().padLeft(4, '0')}-${dob!.month.toString().padLeft(2, '0')}-${dob!.day.toString().padLeft(2, '0')}',
    'birth_date': dob == null
        ? null
        : '${dob!.year.toString().padLeft(4, '0')}-${dob!.month.toString().padLeft(2, '0')}-${dob!.day.toString().padLeft(2, '0')}',
    'gender': gender,
    'target_exam_id': targetExamId,
    'target_exam_title': targetExamTitle,
    'preparation_status': preparationStatus,
    'preferred_subjects': preferredSubjects,
    'state': state,
    'district': district,
    'block': block,
    'category': category,
    'caste': category,
    'account_status': accountStatus,
    'created_at': createdAt?.toIso8601String(),
    'is_pro': isPro,
  };
}
