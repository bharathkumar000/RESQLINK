import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../main.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // User Controllers
  final _userNameController = TextEditingController();
  final _userPhoneController = TextEditingController();
  final _userEmergencyController = TextEditingController();

  // Admin Controllers
  final _adminIdController = TextEditingController();
  final _adminPasswordController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _userNameController.dispose();
    _userPhoneController.dispose();
    _userEmergencyController.dispose();
    _adminIdController.dispose();
    _adminPasswordController.dispose();
    super.dispose();
  }

  void _loginAsUser() async {
    final name = _userNameController.text.trim();
    final phone = _userPhoneController.text.trim();
    final emergency = _userEmergencyController.text.trim();

    if (name.isEmpty || phone.isEmpty) {
      _showErrorSnackBar('Please fill in Name and Phone Number');
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(
        const Duration(milliseconds: 800)); // Simulate local validation

    // Save details to Local Storage
    await StorageService.saveIsLoggedIn(true);
    await StorageService.saveIsAdmin(false); // Normal User access
    await StorageService.saveUsername(name);

    // Ensure standard user starts in 'Victim' role and cannot access Command Screen
    await StorageService.saveRole('Victim');
    await StorageService.saveDeviceName('User_$name');

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DashboardShell()),
      );
    }
  }

  void _loginAsAdmin() async {
    final id = _adminIdController.text.trim();
    final password = _adminPasswordController.text.trim();

    if (id.isEmpty || password.isEmpty) {
      _showErrorSnackBar('Please fill in Admin ID and Password');
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(
        milliseconds: 1000)); // Simulate secure local decryption/auth

    // Admin local credential validation
    if (id == 'admin' && password == 'admin123') {
      await StorageService.saveIsLoggedIn(true);
      await StorageService.saveIsAdmin(true); // Administrative HQ access
      await StorageService.saveUsername('ADMIN');
      await StorageService.saveRole('Command'); // Starts in Command role
      await StorageService.saveDeviceName('HQ_COMMAND');

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardShell()),
        );
      }
    } else {
      setState(() => _isLoading = false);
      _showErrorSnackBar('Invalid Admin Credentials. Try: admin / admin123');
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F0),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Premium Visual Header/Logo Icon
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF5F7161).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.security_rounded,
                    size: 64,
                    color: Color(0xFF5F7161),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'RESQ LINK',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    color: Color(0xFF5F7161),
                  ),
                ),
                const Text(
                  'Disaster Mesh Communication Network',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 32),

                // Form Container
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Tab Bar for switching roles
                      TabBar(
                        controller: _tabController,
                        labelColor: const Color(0xFF5F7161),
                        unselectedLabelColor: Colors.grey,
                        indicatorColor: const Color(0xFF5F7161),
                        indicatorSize: TabBarIndicatorSize.tab,
                        tabs: const [
                          Tab(text: 'User / Citizen'),
                          Tab(text: 'Command Admin'),
                        ],
                      ),

                      // Tab Content
                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: SizedBox(
                          height: 280,
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildUserForm(),
                              _buildAdminForm(),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Offline Notice footer
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.wifi_off_rounded, size: 16, color: Colors.grey),
                    SizedBox(width: 8),
                    Text(
                      'No internet needed. Authenticates locally.',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _userNameController,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            prefixIcon: Icon(Icons.person_outline),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(10))),
            contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _userPhoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Phone Number',
            prefixIcon: Icon(Icons.phone_outlined),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(10))),
            contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _userEmergencyController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Emergency Contact (Optional)',
            prefixIcon: Icon(Icons.contact_phone_outlined),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(10))),
            contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: _isLoading ? null : _loginAsUser,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF5F7161),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : const Text('Enter Incident Zone',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildAdminForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _adminIdController,
          decoration: const InputDecoration(
            labelText: 'Admin ID / Call-Sign',
            prefixIcon: Icon(Icons.badge_outlined),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(10))),
            contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _adminPasswordController,
          obscureText: !_isPasswordVisible,
          decoration: InputDecoration(
            labelText: 'Access Code',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(
                  _isPasswordVisible ? Icons.visibility : Icons.visibility_off),
              onPressed: () {
                setState(() {
                  _isPasswordVisible = !_isPasswordVisible;
                });
              },
            ),
            border: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(10))),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: _isLoading ? null : _loginAsAdmin,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6D8B74),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : const Text('Authenticate HQ Node',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
