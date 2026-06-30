import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';
import '../models/sos.dart';

class SyncBridgeService {
  static Future<bool> isServerOnline() async {
    try {
      final baseUrl = StorageService.getServerUrl();
      // Ping the server requests endpoint with a short timeout
      final response = await http
          .get(
            Uri.parse('$baseUrl/api/requests'),
          )
          .timeout(const Duration(seconds: 3));

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, int>> syncUnsyncedSignals() async {
    int syncedCount = 0;
    int failedCount = 0;

    try {
      final baseUrl = StorageService.getServerUrl();
      final allSOS = StorageService.getAllSOS();
      final unsynced = allSOS.where((sos) => !sos.synced).toList();

      if (unsynced.isEmpty) {
        return {'synced': 0, 'failed': 0};
      }

      // Map Flutter SOS records to Next.js dashboard requests
      final payloads = unsynced.map((sos) {
        // Parse Lat/Lng from location string
        double lat = 12.5118;
        double lng = 76.8851;
        try {
          final parts = sos.location.split(',');
          final latStr = parts[0].replaceAll('Lat:', '').trim();
          final lngStr = parts[1].replaceAll('Lng:', '').trim();
          lat = double.parse(latStr);
          lng = double.parse(lngStr);
        } catch (_) {
          // Keep defaults
        }

        // Map need type directly (matches dashboard resources exactly)
        String resourceType = sos.need;

        // Map status
        String status = 'pending';
        if (sos.status == 'COMPLETED') {
          status = 'resolved';
        } else if (sos.status == 'DISPATCHED') {
          status = 'allocated';
        } else if (sos.status == 'RELAY_ACCEPTED') {
          status = 'partial';
        }

        final description = [
          'SOS Distress Need: ${sos.need}',
          'Stranded Individuals Count: ${sos.people}',
          if (sos.safetyChecklist.isNotEmpty)
            'Safety Items Needed: ${sos.safetyChecklist.join(", ")}',
          'Mesh Signal Trail: Created ➔ Sync Bridge Transmitted'
        ].join('\n');

        return {
          'requestId': sos.id,
          'resourceType': resourceType,
          'quantityRequested': sos.people,
          'quantityAllocated': status == 'resolved' ? sos.people : 0,
          'quantityPending': status == 'resolved' ? 0 : sos.people,
          'lat': lat,
          'lng': lng,
          'severity': sos.status == 'CREATED' ? 4 : 5,
          'individualsAffected': sos.people,
          'status': status,
          'contactPerson': sos.name.isNotEmpty ? sos.name : 'Unknown (Victim)',
          'contactPhone': 'Mesh Mesh ID: ${sos.id.substring(0, 4)}',
          'description': description
        };
      }).toList();

      // Send to server
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/requests'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode(payloads),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        // Mark all successfully synced records in Hive
        for (final sos in unsynced) {
          final updatedSos = sos.copyWith(synced: true);
          await StorageService.saveSOS(updatedSos);
          syncedCount++;
        }
      } else {
        failedCount = unsynced.length;
        print('Server sync failed status code: ${response.statusCode}');
      }
    } catch (e) {
      print('SyncBridge Error: $e');
      failedCount = 1; // Mark as failed
    }

    return {'synced': syncedCount, 'failed': failedCount};
  }
}
