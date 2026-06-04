import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../providers/auth_provider.dart';

class VehiclesScreen extends ConsumerStatefulWidget {
  const VehiclesScreen({super.key});

  @override
  ConsumerState<VehiclesScreen> createState() => _VehiclesScreenState();
}

class _VehiclesScreenState extends ConsumerState<VehiclesScreen> {
  List<Vehicle> _vehicles = [];
  bool _loading = true;
  String? _companyId;

  final _plate = TextEditingController();
  final _make = TextEditingController();
  final _model = TextEditingController();

  Future<void> _load() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.customerId == null) return;
    final customer = await ref
        .read(supabaseProvider)
        .from('customers')
        .select('company_id')
        .eq('id', profile!.customerId!)
        .single();
    _companyId = customer['company_id'] as String;
    final rows = await ref
        .read(supabaseProvider)
        .from('vehicles')
        .select()
        .eq('customer_id', profile.customerId!)
        .order('license_plate');
    setState(() {
      _vehicles = (rows as List).map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  Future<void> _add() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.customerId == null || _companyId == null) return;
    await ref.read(supabaseProvider).from('vehicles').insert({
      'customer_id': profile!.customerId,
      'company_id': _companyId,
      'license_plate': _plate.text,
      'make': _make.text.isEmpty ? null : _make.text,
      'model': _model.text.isEmpty ? null : _model.text,
    });
    _plate.clear();
    _make.clear();
    _model.clear();
    setState(() => _loading = true);
    await _load();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicles')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(controller: _plate, decoration: const InputDecoration(labelText: 'Plate', border: OutlineInputBorder())),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: TextField(controller: _make, decoration: const InputDecoration(labelText: 'Make', border: OutlineInputBorder()))),
                    const SizedBox(width: 8),
                    Expanded(child: TextField(controller: _model, decoration: const InputDecoration(labelText: 'Model', border: OutlineInputBorder()))),
                  ],
                ),
                const SizedBox(height: 8),
                FilledButton(onPressed: _add, child: const Text('Add vehicle')),
                const SizedBox(height: 16),
                ..._vehicles.map(
                  (v) => Card(
                    child: ListTile(
                      title: Text(v.licensePlate, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                      subtitle: Text([v.make, v.model].where((e) => e != null && e.isNotEmpty).join(' ')),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
