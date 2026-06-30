import 'package:flutter/material.dart';
import '../models/sos.dart';
import '../services/storage_service.dart';
import '../services/wifi_service.dart';

class RelayScreen extends StatefulWidget {
  const RelayScreen({Key? key}) : super(key: key);

  @override
  State<RelayScreen> createState() => _RelayScreenState();
}

class _RelayScreenState extends State<RelayScreen> {
  List<SOS> _sosList = [];

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
      // Sort: newest first
      _sosList.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    });
  }

  void _updateDecision(SOS sos, String decision, String status) async {
    final updatedSOS = sos.copyWith(
      relayDecision: decision,
      status: status,
      lastUpdated: DateTime.now(),
    );

    await StorageService.saveSOS(updatedSOS);
    _loadSOS();

    // Broadcast changes immediately to the mesh
    WifiService.instance.syncAllData();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('SOS ${sos.id} decision updated to: $decision'),
        backgroundColor: const Color(0xFF6D8B74),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Separate pending vs completed/decided requests
    final pendingRequests =
        _sosList.where((sos) => sos.relayDecision == 'PENDING').toList();
    final decidedRequests =
        _sosList.where((sos) => sos.relayDecision != 'PENDING').toList();

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          // Mesh Banner Info
          _buildMeshStatusBanner(),

          TabBar(
            labelColor: const Color(0xFF5F7161),
            indicatorColor: const Color(0xFF6D8B74),
            tabs: [
              Tab(text: 'Pending Verification (${pendingRequests.length})'),
              Tab(text: 'Verified History (${decidedRequests.length})'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildSOSList(pendingRequests, isPending: true),
                _buildSOSList(decidedRequests, isPending: false),
              ],
            ),
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

        if (status == MeshConnectionStatus.connected) {
          bannerColor = const Color(0xFF6D8B74);
          statusText =
              "Mesh Connected: ${WifiService.instance.connectedPeers.length} active nodes";
        } else if (status == MeshConnectionStatus.advertising) {
          bannerColor = Colors.orangeAccent;
          statusText = "Syncing with surrounding nodes...";
        } else if (status == MeshConnectionStatus.discovering) {
          bannerColor = Colors.blueAccent;
          statusText = "Seeking new nodes to sync...";
        }

        return Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: bannerColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: bannerColor),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.device_hub, color: bannerColor, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    statusText,
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: bannerColor,
                        fontSize: 13),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {
                  WifiService.instance.syncAllData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('Cascading data sync triggered across mesh!')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: bannerColor,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  minimumSize: Size.zero,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6)),
                ),
                icon: const Icon(Icons.sync, size: 12),
                label: const Text('SYNC',
                    style:
                        TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildSOSList(List<SOS> list, {required bool isPending}) {
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            isPending
                ? 'No pending distress signals in range.\nWaiting to connect and sync with Victim devices...'
                : 'No verified requests in your local registry.',
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
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.redAccent),
                      ),
                      child: Text(
                        sos.id,
                        style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 12),
                      ),
                    ),
                    Text(
                      _formatTime(sos.timestamp),
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Name: ${sos.name}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text('Distress Need: ${sos.need}',
                    style: const TextStyle(fontSize: 15)),
                Text('People Stranded: ${sos.people}',
                    style: const TextStyle(fontSize: 14)),
                Text('Location: ${sos.location}',
                    style: const TextStyle(fontSize: 13, color: Colors.grey)),
                const Divider(height: 20),
                if (isPending) ...[
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () =>
                              _updateDecision(sos, 'REJECTED', 'CREATED'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('REJECT'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _updateDecision(
                              sos, 'ESCALATED', 'COMMAND_PENDING'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.orange,
                            side: const BorderSide(color: Colors.orange),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('ESCALATE'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _updateDecision(
                              sos, 'APPROVED', 'COMMAND_PENDING'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6D8B74),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('ACCEPT'),
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
                          const Text('Your Verification: '),
                          Text(
                            sos.relayDecision,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: sos.relayDecision == 'APPROVED'
                                  ? Colors.green
                                  : Colors.red,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF5F7161).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Status: ${sos.status}',
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                      ),
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

  String _formatTime(DateTime time) {
    return "${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}";
  }
}
