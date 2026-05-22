import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:nearby_connections/nearby_connections.dart';
import 'storage_service.dart';
import '../models/sos.dart';

enum MeshConnectionStatus { disconnected, advertising, discovering, connected }

class WifiService {
  static final WifiService instance = WifiService._internal();
  WifiService._internal();

  static const String serviceId = "com.resqlink.mesh";
  static const Strategy strategy = Strategy.P2P_CLUSTER;

  // Active connections: endpointId -> PeerDetails
  final Map<String, PeerDetails> connectedPeers = {};
  
  // Discovered endpoints: endpointId -> name
  final Map<String, String> discoveredEndpoints = {};

  // Status notifier for UI
  final ValueNotifier<MeshConnectionStatus> connectionStatus = 
      ValueNotifier<MeshConnectionStatus>(MeshConnectionStatus.disconnected);
  
  // Callback when local storage is updated by sync
  VoidCallback? onSyncCompleted;

  bool _isAdvertising = false;
  bool _isDiscovering = false;

  bool get isAdvertising => _isAdvertising;
  bool get isDiscovering => _isDiscovering;

  // Start both advertising and discovery for ad-hoc mesh behavior
  Future<bool> startMesh() async {
    await stopMesh();

    // Check if location services are enabled, required for scanning/beacons
    bool locationEnabled = await Nearby().checkLocationEnabled();
    if (!locationEnabled) {
      bool serviceGranted = await Nearby().enableLocationServices();
      if (!serviceGranted) {
        print('Location services not enabled by the user.');
        return false;
      }
    }

    bool advStarted = await _startAdvertising();
    bool discStarted = await _startDiscovery();
    _updateStatus();

    return advStarted || discStarted;
  }

  Future<void> stopMesh() async {
    await Nearby().stopAdvertising();
    await Nearby().stopDiscovery();
    await Nearby().stopAllEndpoints();
    _isAdvertising = false;
    _isDiscovering = false;
    connectedPeers.clear();
    discoveredEndpoints.clear();
    _updateStatus();
  }

  void _updateStatus() {
    if (connectedPeers.isNotEmpty) {
      connectionStatus.value = MeshConnectionStatus.connected;
    } else if (_isAdvertising && _isDiscovering) {
      connectionStatus.value = MeshConnectionStatus.connected; // mesh active (searching/advertising)
    } else if (_isAdvertising) {
      connectionStatus.value = MeshConnectionStatus.advertising;
    } else if (_isDiscovering) {
      connectionStatus.value = MeshConnectionStatus.discovering;
    } else {
      connectionStatus.value = MeshConnectionStatus.disconnected;
    }
  }

  // Advertising
  Future<bool> _startAdvertising() async {
    try {
      final myName = "${StorageService.getDeviceName()} (${StorageService.getRole()})";
      bool running = await Nearby().startAdvertising(
        myName,
        strategy,
        onConnectionInitiated: _onConnectionInitiated,
        onConnectionResult: (id, status) => _onConnectionResult(id, status),
        onDisconnected: _onDisconnected,
        serviceId: serviceId,
      );
      _isAdvertising = running;
      print('Advertising status: $running');
      return running;
    } catch (e) {
      print('Advertising failed to start: $e');
      _isAdvertising = false;
      return false;
    }
  }

  // Discovery
  Future<bool> _startDiscovery() async {
    try {
      bool running = await Nearby().startDiscovery(
        StorageService.getDeviceName(),
        strategy,
        onEndpointFound: (id, name, serviceId) {
          print('Endpoint found: $id ($name)');
          discoveredEndpoints[id] = name;
          // Auto-connect to build the mesh
          _requestConnection(id, name);
        },
        onEndpointLost: (id) {
          print('Endpoint lost: $id');
          discoveredEndpoints.remove(id);
        },
        serviceId: serviceId,
      );
      _isDiscovering = running;
      print('Discovery status: $running');
      return running;
    } catch (e) {
      print('Discovery failed to start: $e');
      _isDiscovering = false;
      return false;
    }
  }

  // Request Connection
  Future<void> _requestConnection(String endpointId, String endpointName) async {
    try {
      final myName = "${StorageService.getDeviceName()} (${StorageService.getRole()})";
      await Nearby().requestConnection(
        myName,
        endpointId,
        onConnectionInitiated: _onConnectionInitiated,
        onConnectionResult: (id, status) => _onConnectionResult(id, status),
        onDisconnected: _onDisconnected,
      );
    } catch (e) {
      print('Connection request to $endpointName failed: $e');
    }
  }

  // Connection flow callbacks
  void _onConnectionInitiated(String endpointId, ConnectionInfo info) {
    print('Connection initiated with $endpointId (${info.endpointName})');
    // Automatically accept incoming connection to keep the experience seamless
    Nearby().acceptConnection(
      endpointId,
      onPayloadReceived: (id, payload) => _onPayloadReceived(endpointId, payload),
      onPayloadTransferUpdate: (id, payloadTransferUpdate) {},
    );
  }

  void _onConnectionResult(String endpointId, Status status) {
    if (status == Status.CONNECTED) {
      print('Connected successfully to $endpointId');
      final name = discoveredEndpoints[endpointId] ?? 'Peer';
      connectedPeers[endpointId] = PeerDetails(id: endpointId, name: name);
      _updateStatus();
      
      // Perform handshake and sync instantly
      syncAllData();
    } else {
      print('Connection result failed: $status');
      connectedPeers.remove(endpointId);
      _updateStatus();
    }
  }

  void _onDisconnected(String endpointId) {
    print('Disconnected from $endpointId');
    connectedPeers.remove(endpointId);
    _updateStatus();
  }

  // Data transmission
  void syncAllData() {
    if (connectedPeers.isEmpty) return;

    // Build the sync payload
    final localSOSList = StorageService.getAllSOS();
    final dataMap = {
      'type': 'SYNC',
      'role': StorageService.getRole(),
      'deviceName': StorageService.getDeviceName(),
      'sosList': localSOSList.map((sos) => sos.toMap()).toList(),
    };

    final jsonString = json.encode(dataMap);
    final bytes = Uint8List.fromList(utf8.encode(jsonString));

    for (var endpointId in connectedPeers.keys) {
      Nearby().sendBytesPayload(endpointId, bytes);
      print('Synced data to peer: $endpointId');
    }
  }

  void _onPayloadReceived(String endpointId, Payload payload) {
    if (payload.type != PayloadType.BYTES || payload.bytes == null) return;

    try {
      final jsonString = utf8.decode(payload.bytes!);
      final dataMap = json.decode(jsonString) as Map<String, dynamic>;

      if (dataMap['type'] == 'SYNC') {
        final peerRole = dataMap['role'] ?? 'Unknown';
        final peerName = dataMap['deviceName'] ?? 'Unknown';
        final sosListMaps = dataMap['sosList'] as List<dynamic>;

        print('Received sync payload from $peerName ($peerRole) containing ${sosListMaps.length} items');

        bool hasChanges = false;
        
        for (var item in sosListMaps) {
          final incomingSOS = SOS.fromMap(Map<String, dynamic>.from(item));
          final existingSOS = StorageService.getSOS(incomingSOS.id);

          if (existingSOS == null) {
            // New message discovered
            StorageService.saveSOS(incomingSOS);
            hasChanges = true;
          } else {
            // Deduplicate and choose the latest status based on lastUpdated
            if (incomingSOS.lastUpdated.isAfter(existingSOS.lastUpdated)) {
              StorageService.saveSOS(incomingSOS);
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          print('Local state updated from sync. Refreshing UI and cascading updates.');
          if (onSyncCompleted != null) {
            onSyncCompleted!();
          }
          // In a mesh, cascade updates to all other peers
          syncAllData();
        }
      }
    } catch (e) {
      print('Error parsing received payload: $e');
    }
  }
}

class PeerDetails {
  final String id;
  final String name;

  PeerDetails({required this.id, required this.name});
}
