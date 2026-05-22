import 'package:hive_flutter/hive_flutter.dart';
import '../models/sos.dart';

class StorageService {
  static const String _boxName = 'sos_box';
  static const String _settingsBoxName = 'settings_box';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxName);
    await Hive.openBox(_settingsBoxName);
  }

  static Box get _box => Hive.box(_boxName);
  static Box get _settingsBox => Hive.box(_settingsBoxName);

  // Get all SOS messages
  static List<SOS> getAllSOS() {
    try {
      final list = _box.values.toList();
      return list.map((val) {
        if (val is Map) {
          return SOS.fromMap(Map<String, dynamic>.from(val));
        } else {
          return SOS.fromJson(val.toString());
        }
      }).toList();
    } catch (e) {
      print('Error loading local SOS records: $e');
      return [];
    }
  }

  // Get single SOS by ID
  static SOS? getSOS(String id) {
    final val = _box.get(id);
    if (val == null) return null;
    if (val is Map) {
      return SOS.fromMap(Map<String, dynamic>.from(val));
    }
    return SOS.fromJson(val.toString());
  }

  // Save or update an SOS message
  static Future<void> saveSOS(SOS sos) async {
    await _box.put(sos.id, sos.toMap());
  }

  // Delete an SOS message
  static Future<void> deleteSOS(String id) async {
    await _box.delete(id);
  }

  // Clear all SOS messages
  static Future<void> clearAll() async {
    await _box.clear();
  }

  // Save device role (Victim, Relay, Command)
  static Future<void> saveRole(String role) async {
    await _settingsBox.put('role', role);
  }

  // Get device role
  static String getRole() {
    return _settingsBox.get('role', defaultValue: 'Victim');
  }

  // Save device name
  static Future<void> saveDeviceName(String name) async {
    await _settingsBox.put('deviceName', name);
  }

  // Get device name
  static String getDeviceName() {
    return _settingsBox.get('deviceName', defaultValue: 'RescueNode');
  }
}
