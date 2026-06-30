import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:geolocator/geolocator.dart';
import '../models/sos.dart';
import '../services/storage_service.dart';
import '../services/wifi_service.dart';

class VictimScreen extends StatefulWidget {
  const VictimScreen({Key? key}) : super(key: key);

  @override
  State<VictimScreen> createState() => _VictimScreenState();
}

class _VictimScreenState extends State<VictimScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _needController = TextEditingController();
  int _peopleCount = 1;
  List<SOS> _myRequests = [];
  final List<String> _availableItems = [
    'Medical Aid',
    'Drinking Water',
    'Emergency Food',
    'Warm Shelter',
    'Rescue Boat/Extraction'
  ];
  final List<String> _selectedItems = [];

  final List<String> _distressOptions = [
    'Medical Supplies',
    'Food & Water',
    'Shelter',
    'Rescue Team',
    'Ambulance',
    'Bedding',
    'Rescue Boats',
    'Heavy Machinery',
  ];
  String? _selectedDistressType;
  bool _detectingLocation = false;
  bool _sendingInstantSOS = false;

  @override
  void initState() {
    super.initState();
    _locationController.text = "Lat: 12.5118, Lng: 76.8851";
    _loadRequests();
    WifiService.instance.onSyncCompleted = () {
      if (mounted) {
        _loadRequests();
      }
    };
  }

  void _loadRequests() {
    setState(() {
      _myRequests = StorageService.getAllSOS();
      // Sort: newest first
      _myRequests.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    });
  }

  void _sendInstantSOS() async {
    setState(() {
      _sendingInstantSOS = true;
    });

    try {
      String locationStr = "Lat: 12.5118, Lng: 76.8851"; // Default fallback

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (serviceEnabled) {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }

        if (permission == LocationPermission.whileInUse ||
            permission == LocationPermission.always) {
          Position position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
            timeLimit: const Duration(seconds: 4),
          );
          locationStr =
              "Lat: ${position.latitude.toStringAsFixed(5)}, Lng: ${position.longitude.toStringAsFixed(5)}";
        }
      }

      final name = StorageService.getUsername();
      final finalName = name.isEmpty ? "Citizen" : name;

      final instantSOS = SOS(
        id: "SOS-INST-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}",
        name: finalName,
        need: 'CRITICAL RESCUE HELP NEEDED',
        people: 1,
        location: locationStr,
        status: 'RELAY_PENDING',
        relayDecision: 'PENDING',
        commandDecision: 'PENDING',
        eta: '',
        timestamp: DateTime.now(),
        lastUpdated: DateTime.now(),
        safetyChecklist: ['Urgent Extraction Required'],
        synced: false,
      );

      await StorageService.saveSOS(instantSOS);
      WifiService.instance.syncAllData();
      _loadRequests();

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.green, size: 28),
                SizedBox(width: 8),
                Text('SOS Broadcasted'),
              ],
            ),
            content: Text(
              'Your emergency alert has been sent to the mesh network!\n\n'
              '📍 Coordinates: $locationStr\n'
              '📡 Status: Broadcasting to nearby rescue nodes.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to trigger instant SOS: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _sendingInstantSOS = false;
        });
      }
    }
  }

  Widget _buildInstantSOSButton() {
    return GestureDetector(
      onTap: _sendingInstantSOS ? null : _sendInstantSOS,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _sendingInstantSOS
                ? [Colors.grey.shade400, Colors.grey.shade600]
                : [const Color(0xFFD32F2F), const Color(0xFFC62828)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFD32F2F).withOpacity(0.3),
              blurRadius: 15,
              spreadRadius: 2,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _sendingInstantSOS
                  ? const SizedBox(
                      width: 48,
                      height: 48,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 4,
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.wifi_tethering_rounded,
                        size: 44,
                        color: Colors.white,
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            Text(
              _sendingInstantSOS
                  ? 'BROADCASTING SOS...'
                  : 'TAP FOR INSTANT SOS',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'One-touch automatic GPS fetch & Bluetooth Mesh broadcast',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _submitSOS() async {
    if (!_formKey.currentState!.validate()) return;

    final newSOS = SOS(
      id: "SOS-${const Uuid().v4().substring(0, 8).toUpperCase()}",
      name: _nameController.text.trim(),
      need: _selectedDistressType ?? 'Rescue Team',
      people: _peopleCount,
      location: _locationController.text.trim(),
      status: 'RELAY_PENDING',
      relayDecision: 'PENDING',
      commandDecision: 'PENDING',
      eta: '',
      timestamp: DateTime.now(),
      lastUpdated: DateTime.now(),
      safetyChecklist: List<String>.from(_selectedItems),
      synced: false,
    );

    await StorageService.saveSOS(newSOS);

    // Clear form inputs
    _nameController.clear();
    _locationController.text = "Lat: 12.5118, Lng: 76.8851";
    _needController.clear();
    setState(() {
      _peopleCount = 1;
      _selectedItems.clear();
      _selectedDistressType = null;
    });

    _loadRequests();

    // Broadcast the new SOS immediately over the mesh network
    WifiService.instance.syncAllData();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🚨 SOS Alert ${newSOS.id} Broad-casted Offline!'),
        backgroundColor: const Color(0xFF5F7161),
      ),
    );
  }

  void _detectLiveLocation() async {
    setState(() {
      _detectingLocation = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Location services are disabled. Please enable GPS.')),
        );
        setState(() {
          _detectingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permissions are denied.')),
          );
          setState(() {
            _detectingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Location permissions are permanently denied.')),
        );
        setState(() {
          _detectingLocation = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );

      setState(() {
        _locationController.text =
            "Lat: ${position.latitude.toStringAsFixed(5)}, Lng: ${position.longitude.toStringAsFixed(5)}";
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('GPS Coordinates detected automatically!'),
            backgroundColor: Colors.green),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error detecting location: $e')),
      );
    } finally {
      setState(() {
        _detectingLocation = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildInstantSOSButton(),
          const SizedBox(height: 16),
          // Banner Status
          _buildMeshStatusBanner(),
          const SizedBox(height: 16),

          // SOS Creation Card
          Card(
            elevation: 4,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded,
                            color: Colors.redAccent, size: 28),
                        SizedBox(width: 8),
                        Text(
                          'Generate SOS Distress Signal',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF5F7161),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24, thickness: 1),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Your Name / Identifier',
                        prefixIcon: Icon(Icons.person),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Please enter name'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _locationController,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText:
                                  'Exact Location Description / Landmark',
                              prefixIcon: Icon(Icons.location_on),
                              border: OutlineInputBorder(),
                              hintText:
                                  'e.g. 3rd Floor, Blue Building, near Main Crossway',
                            ),
                            validator: (value) => value == null || value.isEmpty
                                ? 'Please enter location description'
                                : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          children: [
                            _detectingLocation
                                ? const Padding(
                                    padding: EdgeInsets.all(12.0),
                                    child: SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    ),
                                  )
                                : IconButton(
                                    icon: const Icon(Icons.my_location,
                                        color: Colors.blueAccent),
                                    tooltip: 'Detect GPS Location',
                                    onPressed: _detectLiveLocation,
                                    style: IconButton.styleFrom(
                                      backgroundColor:
                                          Colors.blueAccent.withOpacity(0.1),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.all(12),
                                    ),
                                  ),
                            const Text(
                              'Detect GPS',
                              style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.blueAccent,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedDistressType,
                      decoration: const InputDecoration(
                        labelText: 'Immediate Need / Distress Type',
                        prefixIcon: Icon(Icons.medical_services_outlined),
                        border: OutlineInputBorder(),
                      ),
                      items: _distressOptions.map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedDistressType = newValue;
                        });
                      },
                      validator: (value) => value == null || value.isEmpty
                          ? 'Please select distress type'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Stranded People Count:',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                        Row(
                          children: [
                            IconButton(
                              onPressed: _peopleCount > 1
                                  ? () => setState(() => _peopleCount--)
                                  : null,
                              icon: const Icon(Icons.remove_circle_outline,
                                  color: Colors.red),
                            ),
                            Text(
                              '$_peopleCount',
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              onPressed: () => setState(() => _peopleCount++),
                              icon: const Icon(Icons.add_circle_outline,
                                  color: Colors.green),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Request Critical Safety Items:',
                      style:
                          TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8.0,
                      runSpacing: 8.0,
                      children: _availableItems.map((item) {
                        final isSelected = _selectedItems.contains(item);
                        return ChoiceChip(
                          label: Text(item),
                          selected: isSelected,
                          selectedColor:
                              const Color(0xFF6D8B74).withOpacity(0.3),
                          checkmarkColor: const Color(0xFF5F7161),
                          labelStyle: TextStyle(
                            color: isSelected
                                ? const Color(0xFF5F7161)
                                : Colors.black87,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedItems.add(item);
                              } else {
                                _selectedItems.remove(item);
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _submitSOS,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.wifi_tethering, size: 24),
                          SizedBox(width: 10),
                          Text(
                            'SEND OFFLINE SOS SIGNAL',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),
          const Text(
            'Your SOS Status Signals',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF5F7161)),
          ),
          const SizedBox(height: 8),

          _myRequests.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'No active distress signals created yet.\nYour SOS alerts will list here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 15),
                    ),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _myRequests.length,
                  itemBuilder: (context, index) {
                    return _buildSOSStatusCard(_myRequests[index]);
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildMeshStatusBanner() {
    return ValueListenableBuilder<MeshConnectionStatus>(
      valueListenable: WifiService.instance.connectionStatus,
      builder: (context, status, child) {
        Color bannerColor = Colors.grey;
        String statusText = "Mesh Offline";
        IconData icon = Icons.offline_bolt_outlined;

        if (status == MeshConnectionStatus.connected) {
          bannerColor = const Color(0xFF6D8B74);
          statusText =
              "Mesh Active: ${WifiService.instance.connectedPeers.length} Peers Connectable";
          icon = Icons.insights;
        } else if (status == MeshConnectionStatus.advertising) {
          bannerColor = Colors.orangeAccent;
          statusText = "Broadcasting Mesh beacon...";
          icon = Icons.leak_add;
        } else if (status == MeshConnectionStatus.discovering) {
          bannerColor = Colors.blueAccent;
          statusText = "Searching for Mesh relays...";
          icon = Icons.search;
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: bannerColor.withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: bannerColor),
          ),
          child: Row(
            children: [
              Icon(icon, color: bannerColor),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  statusText,
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: bannerColor),
                ),
              ),
              if (status == MeshConnectionStatus.connected)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: bannerColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'ONLINE',
                    style: TextStyle(
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSOSStatusCard(SOS sos) {
    // Setup stepper properties based on current status
    int currentStep = 0;
    if (sos.status == 'RELAY_ACCEPTED' || sos.status == 'COMMAND_PENDING') {
      currentStep = 1;
    } else if (sos.status == 'DISPATCHED') {
      currentStep = 2;
    } else if (sos.status == 'COMPLETED') {
      currentStep = 3;
    }

    // Decisions summary info
    Color statusBadgeColor = Colors.orangeAccent;
    if (sos.status == 'DISPATCHED') statusBadgeColor = Colors.green;
    if (sos.status == 'COMPLETED') statusBadgeColor = Colors.blue;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  sos.id,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBadgeColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusBadgeColor),
                  ),
                  child: Text(
                    sos.status.replaceAll('_', ' '),
                    style: TextStyle(
                        color: statusBadgeColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11),
                  ),
                ),
              ],
            ),
            const Divider(height: 16),
            Text('Need: ${sos.need}',
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Stranded: ${sos.people} People',
                style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 4),
            Text('Location: ${sos.location}',
                style: const TextStyle(fontSize: 13, color: Colors.grey)),
            if (sos.safetyChecklist.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: sos.safetyChecklist.map((item) {
                  return Chip(
                    labelPadding:
                        const EdgeInsets.symmetric(horizontal: 4, vertical: -4),
                    backgroundColor: Colors.grey.shade200,
                    label: Text(
                      item,
                      style:
                          const TextStyle(color: Colors.black87, fontSize: 10),
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 12),

            // Stepper Visual Progression
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStepIndicator('SOS Created', currentStep >= 0),
                _buildStepLine(currentStep >= 1),
                _buildStepIndicator('Relay Verified', currentStep >= 1),
                _buildStepLine(currentStep >= 2),
                _buildStepIndicator('Rescue Sent', currentStep >= 2),
              ],
            ),

            if (sos.status == 'DISPATCHED' && sos.eta.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.timer, color: Colors.green),
                    const SizedBox(width: 8),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: const TextStyle(color: Colors.black),
                          children: [
                            const TextSpan(text: 'Rescue Team En Route! ETA: '),
                            TextSpan(
                              text: sos.eta,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                  fontSize: 15),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator(String label, bool active) {
    return Column(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor:
              active ? const Color(0xFF6D8B74) : Colors.grey.shade300,
          child: Icon(
            active ? Icons.check : Icons.circle,
            size: active ? 14 : 6,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
            color: active ? const Color(0xFF5F7161) : Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(bool active) {
    return Expanded(
      child: Container(
        height: 2,
        color: active ? const Color(0xFF6D8B74) : Colors.grey.shade300,
      ),
    );
  }
}
