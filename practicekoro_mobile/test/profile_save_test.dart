import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/repositories/auth_repository.dart';

void main() {
  group('profile save payload', () {
    test('keeps the new name but never sends an inline (base64) photo', () {
      final payload = AuthRepository.profileUpdatePayload({
        'full_name': 'Susanta Lohar',
        'avatar_url': 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        'district': 'Purulia',
        'email': 'not-editable@example.com',
        'is_pro': true,
        'phone': null,
      });
      expect(payload, {'full_name': 'Susanta Lohar', 'district': 'Purulia'});
    });

    test('a normal photo URL is still saved', () {
      final payload = AuthRepository.profileUpdatePayload({
        'full_name': 'Asha',
        'avatar_url': 'https://x.supabase.co/storage/v1/object/public/avatars/u/a.jpg',
      });
      expect(payload['avatar_url'], startsWith('https://'));
      expect(payload['full_name'], 'Asha');
    });

    test('inline image detection', () {
      expect(AuthRepository.isInlineImage('  DATA:image/png;base64,AA'), isTrue);
      expect(AuthRepository.isInlineImage('https://img/a.png'), isFalse);
      expect(AuthRepository.isInlineImage(null), isFalse);
    });

    test('the failure carries a message for the student', () {
      const f = ProfileSaveFailure('Could not save your profile. Please try again.');
      expect(f.toString(), contains('Could not save'));
    });
  });
}
