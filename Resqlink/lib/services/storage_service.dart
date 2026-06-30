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

  // Save server URL for HQ Sync Bridge
  static Future<void> saveServerUrl(String url) async {
    await _settingsBox.put('serverUrl', url);
  }

  // Get server URL (defaults to Mac local dev IP)
  static String getServerUrl() {
    return _settingsBox.get('serverUrl',
        defaultValue: 'http://172.20.10.2:3000');
  }

  // Save login status
  static Future<void> saveIsLoggedIn(bool value) async {
    await _settingsBox.put('isLoggedIn', value);
  }

  // Get login status
  static bool isLoggedIn() {
    return _settingsBox.get('isLoggedIn', defaultValue: false);
  }

  // Save logged-in username
  static Future<void> saveUsername(String username) async {
    await _settingsBox.put('username', username);
  }

  // Get logged-in username
  static String getUsername() {
    return _settingsBox.get('username', defaultValue: '');
  }

  // Save admin status
  static Future<void> saveIsAdmin(bool value) async {
    await _settingsBox.put('isAdmin', value);
  }

  // Get admin status
  static bool isAdmin() {
    return _settingsBox.get('isAdmin', defaultValue: false);
  }

  // Get available resources (seeded if not present)
  static List<Map<String, dynamic>> getAvailableResources() {
    final list = _settingsBox.get('resources');
    if (list == null) {
      final defaultRes = [
        { 'id': 1, 'name': 'Emergency Medical Kit', 'type': 'Medical Supplies', 'totalQuantity': 500, 'availableQuantity': 350 },
        { 'id': 2, 'name': 'Food Packages', 'type': 'Food & Water', 'totalQuantity': 1000, 'availableQuantity': 800 },
        { 'id': 3, 'name': 'Emergency Tents', 'type': 'Shelter', 'totalQuantity': 100, 'availableQuantity': 75 },
        { 'id': 4, 'name': 'Rescue Personnel', 'type': 'Rescue Team', 'totalQuantity': 50, 'availableQuantity': 40 },
        { 'id': 5, 'name': 'Emergency Ambulances', 'type': 'Ambulance', 'totalQuantity': 20, 'availableQuantity': 15 },
        { 'id': 6, 'name': 'Clean Drinking Water', 'type': 'Food & Water', 'totalQuantity': 5000, 'availableQuantity': 3200 },
        { 'id': 7, 'name': 'Blankets & Sleeping Bags', 'type': 'Bedding', 'totalQuantity': 1500, 'availableQuantity': 1200 },
        { 'id': 8, 'name': 'Inflatable Rescue Boats', 'type': 'Rescue Boats', 'totalQuantity': 40, 'availableQuantity': 28 },
        { 'id': 9, 'name': 'Heavy Duty Excavators (JCB)', 'type': 'Heavy Machinery', 'totalQuantity': 15, 'availableQuantity': 10 }
      ];
      _settingsBox.put('resources', defaultRes);
      return defaultRes;
    }
    return (list as List).map((item) => Map<String, dynamic>.from(item)).toList();
  }

  // Save available resources
  static Future<void> saveAvailableResources(List<Map<String, dynamic>> resources) async {
    await _settingsBox.put('resources', resources);
  }
}
