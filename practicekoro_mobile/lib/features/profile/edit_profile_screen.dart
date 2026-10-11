import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/wb_districts.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 2: Edit Profile Screen
/// Exact recreation of Screen 2 from the approved 3-screen Profile UI reference (media_1791693901458_a6920a6b.png).
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;

  DateTime _selectedDob = DateTime(2002, 1, 12);
  String _selectedGender = 'Male';
  String _selectedState = 'West Bengal';
  String _selectedDistrict = 'Kolkata';
  List<String> _targetExams = [];

  bool _isSaving = false;

  final List<String> _states = [
    'West Bengal',
    'Assam',
    'Bihar',
    'Jharkhand',
    'Odisha',
    'Tripura',
    'Delhi',
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: LocalStorageService.getUserName());
    _emailController = TextEditingController(
      text: LocalStorageService.getUserEmail() ?? 'student@practicekoro.online',
    );
    _phoneController = TextEditingController(
      text: LocalStorageService.getUserPhone() ?? '',
    );

    _initFromStorage();
  }

  void _initFromStorage() {
    final rawGender = LocalStorageService.getUserGender();
    if (rawGender.toUpperCase() == 'FEMALE') {
      _selectedGender = 'Female';
    } else if (rawGender.toUpperCase() == 'OTHER') {
      _selectedGender = 'Other';
    } else {
      _selectedGender = 'Male';
    }

    final rawState = LocalStorageService.getUserState();
    if (rawState.isNotEmpty && _states.contains(rawState)) {
      _selectedState = rawState;
    }

    final rawDistrict = LocalStorageService.getUserDistrict();
    if (rawDistrict != null && rawDistrict.isNotEmpty && kWestBengalDistricts.contains(rawDistrict)) {
      _selectedDistrict = rawDistrict;
    } else {
      _selectedDistrict = kWestBengalDistricts.contains('Kolkata') ? 'Kolkata' : kWestBengalDistricts.first;
    }

    final rawDob = LocalStorageService.getUserDob();
    if (rawDob.isNotEmpty) {
      try {
        final parsed = DateFormat('d MMM yyyy').parse(rawDob);
        _selectedDob = parsed;
      } catch (_) {
        try {
          final parsedIso = DateTime.parse(rawDob);
          _selectedDob = parsedIso;
        } catch (_) {}
      }
    }

    _targetExams = List<String>.from(LocalStorageService.getTargetExamsList());
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob,
      firstDate: DateTime(1960),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF026BFC),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDob = picked);
    }
  }

  void _showAddExamModal() async {
    List<String> availableExams = [
      'WBP Constable',
      'WBSSC Group C & D',
      'Railway NTPC',
      'KP SI & Constable',
      'Primary TET',
      'WBPSC Clerkship',
      'SSC GD',
      'WBCS Prelims',
      'Railway Group D',
      'ICDS Supervisor',
    ];

    try {
      final fetched = await CatalogRepository().getExams();
      if (fetched.isNotEmpty) {
        availableExams = fetched.map((e) => e.title).toList();
      }
    } catch (_) {}

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Select Target Exams',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Choose the competitive exams you are preparing for:',
                  style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 14),
                Flexible(
                  child: SingleChildScrollView(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: availableExams.map((exam) {
                        final isAlreadyAdded = _targetExams.contains(exam);
                        return FilterChip(
                          label: Text(exam),
                          selected: isAlreadyAdded,
                          selectedColor: const Color(0xFFEFF6FF),
                          checkmarkColor: const Color(0xFF026BFC),
                          labelStyle: TextStyle(
                            fontSize: 12.5,
                            fontWeight: isAlreadyAdded ? FontWeight.w700 : FontWeight.w500,
                            color: isAlreadyAdded ? const Color(0xFF026BFC) : const Color(0xFF334155),
                          ),
                          backgroundColor: const Color(0xFFF8FAFC),
                          side: BorderSide(
                            color: isAlreadyAdded ? const Color(0xFF93C5FD) : const Color(0xFFE2E8F0),
                          ),
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                if (!_targetExams.contains(exam)) {
                                  _targetExams.add(exam);
                                }
                              } else {
                                if (_targetExams.length > 1) {
                                  _targetExams.remove(exam);
                                }
                              }
                            });
                            Navigator.of(ctx).pop();
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showAvatarPicker() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Avatar is synced with your PracticeKoro profile character.'),
        duration: Duration(seconds: 2),
        backgroundColor: Color(0xFF026BFC),
      ),
    );
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final fullName = _nameController.text.trim();
      final phone = _phoneController.text.trim();
      final dobStr = DateFormat('d MMM yyyy').format(_selectedDob);
      final genderKey = _selectedGender.toUpperCase();

      await AuthRepository().updateProfile(
        fullName: fullName,
        phone: phone,
        district: _selectedDistrict,
        gender: genderKey,
        dob: dobStr,
        state: _selectedState,
        targetExams: _targetExams,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully!'),
          backgroundColor: Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );

      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update profile: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dobFormatted = DateFormat('d MMM yyyy').format(_selectedDob);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Edit Profile',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Center Avatar with Camera Badge
              Center(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 104,
                      height: 104,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDBEAFE),
                        shape: BoxShape.circle,
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/profile_avatar_boy.png',
                          width: 104,
                          height: 104,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Image.asset(
                            'assets/images/student_avatar_hd.png',
                            width: 104,
                            height: 104,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.person_rounded,
                              size: 54,
                              color: Color(0xFF026BFC),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: GestureDetector(
                        onTap: _showAvatarPicker,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF026BFC),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2.5),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x1A000000),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 15,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 2. Full Name
              _buildFieldLabel('Full Name', isRequired: true),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
                decoration: _inputDecoration('Enter your full name'),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter your full name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 3. Email (Read-only / Protected)
              _buildFieldLabel('Email', isRequired: true),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                readOnly: true,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                ),
                decoration: _inputDecoration('').copyWith(
                  fillColor: const Color(0xFFF1F5F9),
                  filled: true,
                ),
              ),
              const SizedBox(height: 16),

              // 4. Phone Number
              _buildFieldLabel('Phone Number', isRequired: true),
              const SizedBox(height: 6),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
                decoration: _inputDecoration('+91 98765 43210'),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter your phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 5. Date of Birth
              _buildFieldLabel('Date of Birth'),
              const SizedBox(height: 6),
              InkWell(
                onTap: _pickDateOfBirth,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: Color(0xFF026BFC),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        dobFormatted,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 6. Gender Selection
              _buildFieldLabel('Gender'),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(child: _buildGenderButton('Male')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildGenderButton('Female')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildGenderButton('Other')),
                ],
              ),
              const SizedBox(height: 16),

              // 7. Location (State & District)
              _buildFieldLabel('Location'),
              const SizedBox(height: 6),
              Row(
                children: [
                  // State Dropdown
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedState,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                          items: _states.map((s) {
                            return DropdownMenuItem<String>(
                              value: s,
                              child: Text(s, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedState = val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // District Dropdown
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedDistrict,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                          items: kWestBengalDistricts.map((d) {
                            return DropdownMenuItem<String>(
                              value: d,
                              child: Text(d, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedDistrict = val);
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // 8. Target Exams
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildFieldLabel('Target Exams'),
                  GestureDetector(
                    onTap: _showAddExamModal,
                    child: const Text(
                      'Edit',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ..._targetExams.map((exam) {
                    final colorData = _getExamColor(exam);
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: colorData['bg'],
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: colorData['border']!),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            exam,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: colorData['text'],
                            ),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () {
                              if (_targetExams.length > 1) {
                                setState(() => _targetExams.remove(exam));
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('You must select at least one target exam.'),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              }
                            },
                            child: Icon(
                              Icons.close_rounded,
                              size: 14,
                              color: colorData['text'],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  GestureDetector(
                    onTap: _showAddExamModal,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.add_rounded, size: 14, color: Color(0xFF026BFC)),
                          SizedBox(width: 3),
                          Text(
                            'Add Exam',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF026BFC),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // 9. Save Changes Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveChanges,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF026BFC),
                    disabledBackgroundColor: const Color(0xFF93C5FD),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Save Changes',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label, {bool isRequired = false}) {
    return Text.rich(
      TextSpan(
        text: label,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Color(0xFF334155),
        ),
        children: [
          if (isRequired)
            const TextSpan(
              text: ' *',
              style: TextStyle(color: Color(0xFFEF4444)),
            ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF026BFC), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFEF4444)),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
      ),
    );
  }

  Widget _buildGenderButton(String gender) {
    final isSelected = _selectedGender == gender;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = gender),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          gender,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Map<String, Color> _getExamColor(String title) {
    final t = title.toLowerCase();
    if (t.contains('wbp') || t.contains('police') || t.contains('kp')) {
      return {
        'bg': const Color(0xFFEFF6FF),
        'border': const Color(0xFFDBEAFE),
        'text': const Color(0xFF2563EB),
      };
    }
    if (t.contains('ssc') || t.contains('clerk') || t.contains('group')) {
      return {
        'bg': const Color(0xFFECFDF5),
        'border': const Color(0xFFD1FAE5),
        'text': const Color(0xFF059669),
      };
    }
    if (t.contains('rail') || t.contains('ntpc')) {
      return {
        'bg': const Color(0xFFFFF1F2),
        'border': const Color(0xFFFFE4E6),
        'text': const Color(0xFFE11D48),
      };
    }
    return {
      'bg': const Color(0xFFFAF5FF),
      'border': const Color(0xFFF3E8FF),
      'text': const Color(0xFF9333EA),
    };
  }
}
