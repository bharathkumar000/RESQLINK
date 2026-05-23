import 'package:flutter/material.dart';
import 'package:nearby_connections/nearby_connections.dart';
import 'package:permission_handler/permission_handler.dart';
import 'services/storage_service.dart';
import 'services/wifi_service.dart';
import 'screens/victim_screen.dart';
import 'screens/relay_screen.dart';
import 'screens/command_screen.dart';
import 'screens/map_screen.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();
  runApp(const ResQLinkApp());
}

class ResQLinkApp extends StatelessWidget {
  const ResQLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Resqlink',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6D8B74),
          primary: const Color(0xFF5F7161),
          secondary: const Color(0xFF6D8B74),
          background: const Color(0xFFEFEAD8),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F5F0),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF5F7161),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      home: StorageService.isLoggedIn()
          ? const DashboardShell()
          : const LoginScreen(),
    );
  }
}

class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  String _currentRole = 'Victim';
  String _deviceName = 'RescueNode';
  bool _meshEnabled = false;

  @override
  void initState() {
    super.initState();
    _currentRole = StorageService.getRole();
    if (!StorageService.isAdmin() && _currentRole == 'Command') {
      _currentRole = 'Victim';
      StorageService.saveRole('Victim');
    }
    _deviceName = StorageService.getDeviceName();

    // Automatically check permissions and request them
    _requestPermissions();
  }

  void _requestPermissions() async {
    // Request permissions needed for nearby connections (including newer Android 12/13 permissions)
    await [
      Permission.location,
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.bluetoothAdvertise,
      Permission.nearbyWifiDevices,
      Permission.storage,
    ].request();
  }

  void _toggleMesh(bool enable) async {
    if (enable) {
      // Prompt permissions again just in case
      _requestPermissions();

      // Start advertising & discovery
      bool started = await WifiService.instance.startMesh();

      if (mounted) {
        if (started) {
          setState(() {
            _meshEnabled = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content:
                  Text('🟢 Offline Mesh Active! Discovery & Sync Enabled.'),
              backgroundColor: Color(0xFF6D8B74),
            ),
          );
        } else {
          setState(() {
            _meshEnabled = false;
          });
          // Show user-friendly error dialog for physical Android setup
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Mesh Activation Failed'),
              content: const Text(
                'Could not start the offline mesh signal. Please make sure:\n\n'
                '• Bluetooth is turned ON.\n'
                '• Location Services (GPS) are turned ON.\n'
                '• Wi-Fi is turned ON (even without internet).\n'
                '• All requested system permissions are granted.',
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
      }
    } else {
      await WifiService.instance.stopMesh();
      setState(() {
        _meshEnabled = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🔴 Offline Mesh Stopped.'),
            backgroundColor: Colors.grey,
          ),
        );
      }
    }
  }

  void _changeRole(String? newRole) async {
    if (newRole == null) return;

    // Stop current mesh before changing role parameters
    bool wasMeshEnabled = _meshEnabled;
    if (wasMeshEnabled) {
      await WifiService.instance.stopMesh();
    }

    await StorageService.saveRole(newRole);
    setState(() {
      _currentRole = newRole;
      _meshEnabled =
          false; // Turn off to force restart with new role parameters
    });

    if (wasMeshEnabled) {
      _toggleMesh(true);
    }
  }

  void _showSettingsDialog() {
    final nameController = TextEditingController(text: _deviceName);
    final urlController =
        TextEditingController(text: StorageService.getServerUrl());
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Configure Local Node'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Device Name (Visible to peers)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlController,
                decoration: const InputDecoration(
                  labelText: 'HQ Server API URL',
                  helperText: 'e.g. http://192.168.1.100:3000',
                  border: OutlineInputBorder(),
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
                final newName = nameController.text.trim();
                final newUrl = urlController.text.trim();
                if (newName.isNotEmpty) {
                  await StorageService.saveDeviceName(newName);
                  setState(() {
                    _deviceName = newName;
                  });
                }
                if (newUrl.isNotEmpty) {
                  await StorageService.saveServerUrl(newUrl);
                }
                // Restart mesh if active
                if (_meshEnabled) {
                  _toggleMesh(true);
                }
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6D8B74)),
              child: const Text('SAVE'),
            ),
          ],
        );
      },
    );
  }

  void _clearLocalDatabase() async {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Reset Data?'),
          content: const Text(
              'This will delete all stored SOS alerts on this local node.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL'),
            ),
            TextButton(
              onPressed: () async {
                await StorageService.clearAll();
                Navigator.pop(context);
                // Trigger refresh by updating dummy callback
                if (WifiService.instance.onSyncCompleted != null) {
                  WifiService.instance.onSyncCompleted!();
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Database cleared successfully.')),
                );
              },
              child: const Text('RESET', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Select body screen based on chosen role
    Widget activeScreen;
    if (_currentRole == 'Relay') {
      activeScreen = const RelayScreen();
    } else if (_currentRole == 'Command') {
      activeScreen = const CommandScreen();
    } else {
      activeScreen = const VictimScreen();
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ResQ Link Mesh',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Node: $_deviceName',
              style: const TextStyle(fontSize: 12, color: Color(0xFFEFEAD8)),
            ),
          ],
        ),
        actions: [
          // Role Selection Dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _currentRole,
                dropdownColor: const Color(0xFF5F7161),
                icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
                items: (StorageService.isAdmin()
                        ? <String>['Command', 'Relay', 'Victim']
                        : <String>['Victim', 'Relay'])
                    .map((String val) {
                  return DropdownMenuItem<String>(
                    value: val,
                    child: Text(val),
                  );
                }).toList(),
                onChanged: _changeRole,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.map_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MapScreen()),
              );
            },
            tooltip: 'View Map',
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showSettingsDialog,
            tooltip: 'Configure Node Name',
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: _clearLocalDatabase,
            tooltip: 'Clear DB',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await WifiService.instance.stopMesh();
              await StorageService.saveIsLoggedIn(false);
              await StorageService.saveUsername('');
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              }
            },
            tooltip: 'Log Out',
          ),
        ],
      ),
      body: activeScreen,
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey.shade300)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    _meshEnabled
                        ? Icons.wifi_tethering
                        : Icons.wifi_tethering_off,
                    color: _meshEnabled ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _meshEnabled
                        ? 'Mesh Signal: ACTIVE'
                        : 'Mesh Signal: INACTIVE',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _meshEnabled ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
              Switch(
                value: _meshEnabled,
                activeColor: const Color(0xFF6D8B74),
                onChanged: _toggleMesh,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
