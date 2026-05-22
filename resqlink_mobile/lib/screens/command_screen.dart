import 'package:flutter/material.dart';
import '../models/sos.dart';
import '../services/storage_service.dart';
import '../services/wifi_service.dart';

class CommandScreen extends StatefulWidget {
  const CommandScreen({Key? key}) : super(key: key);

  @override
  State<CommandScreen> createState() => _CommandScreenState();
}

class _CommandScreenState extends State<CommandScreen> {
  List<SOS> _sosList = [];
  final _etaController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSOS();
    WifiService.instance.onSyncCompleted = () {
      if (mounted) {
        _loadSOS();
      }
    };
  }

  void _loadSOS() {
    setState(() {
      _sosList = StorageService.getAllSOS();
      // Command Center only shows requests verified (APPROVED or ESCALATED) by Relay
      _sosList = _sosList.where((sos) => 
        sos.relayDecision == 'APPROVED' || sos.relayDecision == 'ESCALATED'
      ).toList();
      _sosList.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    });
  }

  void _dispatchRescue(SOS sos) {
    _etaController.text = "15 mins"; // Default ETA hint

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Dispatch Rescue Unit: ${sos.id}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Stranded Victim: ${sos.name}'),
              Text('Location: ${sos.location}'),
              const SizedBox(height: 16),
              TextField(
                controller: _etaController,
                decoration: const InputDecoration(
                  labelText: 'Estimated Time of Arrival (ETA)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.timer),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: () async {
                final updatedSOS = sos.copyWith(
                  status: 'DISPATCHED',
                  commandDecision: 'DISPATCHED',
                  eta: _etaController.text.trim(),
                  lastUpdated: DateTime.now(),
                );

                await StorageService.saveSOS(updatedSOS);
                Navigator.pop(context);
                _loadSOS();

                // Broadcast dispatch decision back through the mesh
                WifiService.instance.syncAllData();

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Rescue team dispatched for ${sos.name}! ETA: ${updatedSOS.eta}'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6D8B74)),
              child: const Text('DISPATCH TEAM'),
            ),
          ],
        );
      },
    );
  }

  void _rejectSOS(SOS sos) async {
    final updatedSOS = sos.copyWith(
      status: 'RELAY_ACCEPTED',
      commandDecision: 'REJECTED',
      lastUpdated: DateTime.now(),
    );

    await StorageService.saveSOS(updatedSOS);
    _loadSOS();

    // Broadcast rejected command decision to mesh
    WifiService.instance.syncAllData();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('SOS ${sos.id} rejected by Command Center'),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingDispatch = _sosList.where((sos) => sos.commandDecision == 'PENDING').toList();
    final dispatchedRequests = _sosList.where((sos) => sos.commandDecision == 'DISPATCHED').toList();

    return Column(
      children: [
        _buildStatsHeader(),
        DefaultTabController(
          length: 2,
          child: Expanded(
            child: Column(
              children: [
                TabBar(
                  labelColor: const Color(0xFF5F7161),
                  indicatorColor: const Color(0xFF6D8B74),
                  tabs: [
                    Tab(text: 'Pending Dispatch (${pendingDispatch.length})'),
                    Tab(text: 'Active Dispatches (${dispatchedRequests.length})'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _buildSOSList(pendingDispatch, isPending: true),
                      _buildSOSList(dispatchedRequests, isPending: false),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsHeader() {
    final totalVerified = _sosList.length;
    final totalDispatched = _sosList.where((s) => s.status == 'DISPATCHED').length;
    final pendingCount = totalVerified - totalDispatched;

    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFF5F7161).withOpacity(0.08),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatCard('Total Verified', '$totalVerified', Colors.blue),
          _buildStatCard('Pending Dispatch', '$pendingCount', Colors.orange),
          _buildStatCard('Dispatched', '$totalDispatched', Colors.green),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String val, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(
              val,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSOSList(List<SOS> list, {required bool isPending}) {
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            isPending 
              ? 'No verified requests waiting to be dispatched.\nSync with Relay nodes to fetch verified alerts.'
              : 'No active dispatches on record.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final sos = list[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.blueAccent),
                          ),
                          child: Text(
                            sos.id,
                            style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (sos.relayDecision == 'ESCALATED')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'ESCALATED',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, color: Colors.green, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'Relay Verified',
                            style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Stranded: ${sos.name}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text('Emergency Need: ${sos.need}', style: const TextStyle(fontSize: 15)),
                Text('Stranded Count: ${sos.people} People', style: const TextStyle(fontSize: 14)),
                Text('Location: ${sos.location}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                
                const Divider(height: 20),

                if (isPending) ...[
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _rejectSOS(sos),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('REJECT'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _dispatchRescue(sos),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6D8B74),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.navigation, size: 16),
                          label: const Text('DISPATCH TEAM'),
                        ),
                      ),
                    ],
                  )
                ] else ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green, size: 18),
                          const SizedBox(width: 6),
                          Text(
                            'Dispatched (ETA: ${sos.eta})',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () {
                          // Allow updating dispatch status/ETA
                          _dispatchRescue(sos);
                        },
                        child: const Text('Update ETA', style: TextStyle(color: Color(0xFF5F7161))),
                      )
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
