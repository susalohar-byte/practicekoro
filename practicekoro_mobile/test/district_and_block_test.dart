import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/student_profile_model.dart';

void main() {
  group('West Bengal Districts and Blocks in Mobile Model', () {
    test('contains all 23 districts of West Bengal', () {
      expect(StudentProfileModel.westBengalDistricts.length, 23);
      expect(StudentProfileModel.westBengalDistricts, containsAll([
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
      ]));
    });

    test('every district has a mapped non-empty list of blocks', () {
      for (final district in StudentProfileModel.westBengalDistricts) {
        final blocks = StudentProfileModel.getBlocksForDistrict(district);
        expect(blocks, isNotEmpty, reason: '$district should have blocks');
      }
    });

    test('getBlocksForDistrict handles case-insensitivity and whitespace', () {
      final puruliaBlocks = StudentProfileModel.getBlocksForDistrict('  purulia  ');
      expect(puruliaBlocks, isNotEmpty);
      expect(puruliaBlocks, containsAll(['Purulia I', 'Purulia II', 'Balarampur', 'Hura', 'Kashipur']));

      final kolkataZones = StudentProfileModel.getBlocksForDistrict('Kolkata');
      expect(kolkataZones, containsAll(['Kolkata North', 'Kolkata South', 'Salt Lake']));

      expect(StudentProfileModel.getBlocksForDistrict(null), isEmpty);
      expect(StudentProfileModel.getBlocksForDistrict(''), isEmpty);
      expect(StudentProfileModel.getBlocksForDistrict('NonExistent'), isEmpty);
    });

    test('StudentProfileModel preserves optional block in copyWith, json roundtrip', () {
      const profile = StudentProfileModel(
        fullName: 'Susanta Lohar',
        district: 'Purulia',
        block: 'Hura',
      );

      expect(profile.block, 'Hura');

      final json = profile.toJson();
      expect(json['district'], 'Purulia');
      expect(json['block'], 'Hura');

      final deserialized = StudentProfileModel.fromJson(json);
      expect(deserialized.district, 'Purulia');
      expect(deserialized.block, 'Hura');

      final cleared = deserialized.copyWith(clearBlock: true);
      expect(cleared.block, isNull);

      final updated = deserialized.copyWith(block: 'Purulia I');
      expect(updated.block, 'Purulia I');
    });
  });
}
