import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
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

  @override
  void initState() {
    super.initState();
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

  void _submitSOS() async {
    if (!_formKey.currentState!.validate()) return;

    final newSOS = SOS(
      id: "SOS-${const Uuid().v4().substring(0, 8).toUpperCase()}",
      name: _nameController.text.trim(),
      need: _needController.text.trim(),
      people: _peopleCount,
      location: _locationController.text.trim(),
      status: 'RELAY_PENDING',
      relayDecision: 'PENDING',
      commandDecision: 'PENDING',
      eta: '',
      timestamp: DateTime.now(),
      lastUpdated: DateTime.now(),
    );

    await StorageService.saveSOS(newSOS);
    
    // Clear form inputs
    _nameController.clear();
    _locationController.clear();
    _needController.clear();
    setState(() {
      _peopleCount = 1;
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

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner Status
          _buildMeshStatusBanner(),
          const SizedBox(height: 16),
          
          // SOS Creation Card
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
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
                      validator: (value) => value == null || value.isEmpty ? 'Please enter name' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _locationController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Exact Location Description / Landmark',
                        prefixIcon: Icon(Icons.location_on),
                        border: OutlineInputBorder(),
                        hintText: 'e.g. 3rd Floor, Blue Building, near Main Crossway',
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter location description' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _needController,
                      decoration: const InputDecoration(
                        labelText: 'Immediate Need / Distress Type',
                        prefixIcon: Icon(Icons.medical_services_outlined),
                        border: OutlineInputBorder(),
                        hintText: 'e.g. Boat Rescue, Medical Aid, Food/Water',
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your immediate need' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Stranded People Count:',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                        Row(
                          children: [
                            IconButton(
                              onPressed: _peopleCount > 1 ? () => setState(() => _peopleCount--) : null,
                              icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                            ),
                            Text(
                              '$_peopleCount',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              onPressed: () => setState(() => _peopleCount++),
                              icon: const Icon(Icons.add_circle_outline, color: Colors.green),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _submitSOS,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.wifi_tethering, size: 24),
                          SizedBox(width: 10),
                          Text(
                            'SEND OFFLINE SOS SIGNAL',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
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
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF5F7161)),
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
          statusText = "Mesh Active: ${WifiService.instance.connectedPeers.length} Peers Connectable";
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
                  style: TextStyle(fontWeight: FontWeight.bold, color: bannerColor),
                ),
              ),
              if (status == MeshConnectionStatus.connected)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: bannerColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'ONLINE',
                    style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
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
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBadgeColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusBadgeColor),
                  ),
                  child: Text(
                    sos.status.replaceAll('_', ' '),
                    style: TextStyle(color: statusBadgeColor, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
              ],
            ),
            const Divider(height: 16),
            Text('Need: ${sos.need}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Stranded: ${sos.people} People', style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 4),
            Text('Location: ${sos.location}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
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
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 15),
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
          backgroundColor: active ? const Color(0xFF6D8B74) : Colors.grey.shade300,
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
