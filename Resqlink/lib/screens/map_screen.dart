import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/sos.dart';
import '../services/storage_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  List<SOS> _sosList = [];
  SOS? _selectedSOS;

  // Default base coordinates (Mandya base station)
  final LatLng _myLocation = const LatLng(12.5118, 76.8851);

  @override
  void initState() {
    super.initState();
    _loadSOSSignals();
  }

  void _loadSOSSignals() {
    setState(() {
      _sosList = StorageService.getAllSOS();
    });
  }

  LatLng _parseCoords(String locationStr) {
    try {
      final parts = locationStr.split(',');
      final latStr = parts[0].replaceAll('Lat:', '').trim();
      final lngStr = parts[1].replaceAll('Lng:', '').trim();
      return LatLng(double.parse(latStr), double.parse(lngStr));
    } catch (_) {
      // Add a slight random offset so they don't overlay on top of each other exactly
      final random = Random();
      return LatLng(
        _myLocation.latitude + (random.nextDouble() - 0.5) * 0.02,
        _myLocation.longitude + (random.nextDouble() - 0.5) * 0.02,
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'RESOLVED':
        return Colors.green;
      case 'RELAY_ACCEPTED':
      case 'DISPATCHED':
        return Colors.orange;
      case 'CREATED':
      case 'RELAY_PENDING':
      default:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    final markers = <Marker>[
      // My Location Marker (Blue pulse)
      Marker(
        point: _myLocation,
        width: 40,
        height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: Colors.blue,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    ];

    // Add SOS Markers
    for (final sos in _sosList) {
      final pos = _parseCoords(sos.location);
      final color = _getStatusColor(sos.status);

      markers.add(
        Marker(
          point: pos,
          width: 45,
          height: 45,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _selectedSOS = sos;
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              child: Icon(
                Icons.location_on,
                color: color,
                size: _selectedSOS?.id == sos.id ? 44 : 36,
                shadows: const [
                  Shadow(
                    color: Colors.black45,
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  )
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tactical Mesh Map'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _loadSOSSignals();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Reloaded mesh telemetry markers')),
              );
            },
          )
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _myLocation,
              initialZoom: 13.0,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c'],
                userAgentPackageName: 'com.resqlink.mesh',
              ),
              MarkerLayer(markers: markers),
            ],
          ),

          // Offline Telemetry Banner
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[900]!.withOpacity(0.95),
                borderRadius: BorderRadius.circular(30),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  )
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wifi_off, color: Colors.amber, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Offline Mode: Using Local Mesh Telemetry',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Detail Sheet when marker is tapped
          if (_selectedSOS != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                color: Colors.grey[900],
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getStatusColor(_selectedSOS!.status)
                                  .withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _getStatusColor(_selectedSOS!.status),
                                width: 1.5,
                              ),
                            ),
                            child: Text(
                              _selectedSOS!.status.replaceAll('_', ' '),
                              style: TextStyle(
                                color: _getStatusColor(_selectedSOS!.status),
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close,
                                color: Colors.white54, size: 20),
                            onPressed: () {
                              setState(() {
                                _selectedSOS = null;
                              });
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Distress ID: ${_selectedSOS!.id.substring(0, min(8, _selectedSOS!.id.length))}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Contact: ${_selectedSOS!.name} | Affecting: ${_selectedSOS!.people} people',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Colors.amber, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Need: ${_selectedSOS!.need}',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_selectedSOS!.safetyChecklist.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        const Text(
                          'Safety Items Requested:',
                          style: TextStyle(
                              color: Colors.white38,
                              fontSize: 11,
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: _selectedSOS!.safetyChecklist.map((item) {
                            return Chip(
                              labelPadding: const EdgeInsets.symmetric(
                                  horizontal: 4, vertical: -4),
                              backgroundColor: Colors.blueGrey[900],
                              label: Text(
                                item,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 10),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (_selectedSOS!.synced)
                            const Row(
                              children: [
                                Icon(Icons.cloud_done,
                                    color: Colors.green, size: 16),
                                SizedBox(width: 4),
                                Text(
                                  'Synced to Cloud HQ',
                                  style: TextStyle(
                                      color: Colors.green,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            )
                          else
                            const Row(
                              children: [
                                Icon(Icons.cloud_queue,
                                    color: Colors.amber, size: 16),
                                SizedBox(width: 4),
                                Text(
                                  'Local Mesh Only',
                                  style: TextStyle(
                                      color: Colors.amber, fontSize: 11),
                                ),
                              ],
                            ),
                          const Spacer(),
                          TextButton(
                            child: const Text('Center on Map'),
                            onPressed: () {
                              final pos = _parseCoords(_selectedSOS!.location);
                              _mapController.move(pos, 15.0);
                            },
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
