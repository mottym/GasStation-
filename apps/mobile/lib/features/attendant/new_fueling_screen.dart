import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import 'package:storage_client/storage_client.dart';
import 'package:uuid/uuid.dart';
import '../../core/models.dart';
import '../../providers/auth_provider.dart';

class NewFuelingScreen extends ConsumerStatefulWidget {
  const NewFuelingScreen({super.key});

  @override
  ConsumerState<NewFuelingScreen> createState() => _NewFuelingScreenState();
}

class _NewFuelingScreenState extends ConsumerState<NewFuelingScreen> {
  final _plateCtrl = TextEditingController();
  final _gallonsCtrl = TextEditingController();
  final _priceCtrl = TextEditingController(text: '3.8999');
  final _odometerCtrl = TextEditingController();
  final _driverCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _signatureController = SignatureController(
    penStrokeWidth: 2,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );

  VehicleLookup? _match;
  String _fuelType = 'regular';
  XFile? _pumpPhoto;
  bool _loading = false;
  String? _error;
  double? _defaultPrice;

  Future<void> _lookupPlate() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.companyId == null) return;
    setState(() {
      _loading = true;
      _error = null;
      _match = null;
    });
    try {
      final rows = await ref.read(supabaseProvider).rpc(
        'lookup_vehicle_by_plate',
        params: {'p_plate': _plateCtrl.text, 'p_company_id': profile!.companyId},
      );
      if (rows is List && rows.isNotEmpty) {
        setState(() => _match = VehicleLookup.fromJson(rows.first as Map<String, dynamic>));
      } else {
        setState(() => _error = 'No vehicle found for this plate.');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadDefaultPrice() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.stationId == null) return;
    final station = await ref
        .read(supabaseProvider)
        .from('stations')
        .select('default_price_per_gallon')
        .eq('id', profile!.stationId!)
        .maybeSingle();
    if (station != null) {
      final p = (station['default_price_per_gallon'] as num).toDouble();
      setState(() {
        _defaultPrice = p;
        _priceCtrl.text = p.toStringAsFixed(4);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _loadDefaultPrice();
  }

  Future<void> _pickPumpPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (file != null) setState(() => _pumpPhoto = file);
  }

  Future<void> _submit() async {
    if (_match == null) {
      setState(() => _error = 'Look up a valid plate first.');
      return;
    }
    if (_pumpPhoto == null) {
      setState(() => _error = 'Pump photo is required.');
      return;
    }
    if (_signatureController.isEmpty) {
      setState(() => _error = 'Driver signature is required.');
      return;
    }

    final profile = await ref.read(profileProvider.future);
    final session = ref.read(supabaseProvider).auth.currentSession;
    if (profile == null || session == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final fuelingId = const Uuid().v4();
      final companyId = profile.companyId!;
      final stationId = profile.stationId!;

      final pumpPath = '$companyId/$fuelingId/pump.jpg';
      final sigPath = '$companyId/$fuelingId/signature.png';

      final pumpBytes = await _pumpPhoto!.readAsBytes();
      await ref.read(supabaseProvider).storage.from('pump-photos').uploadBinary(
            pumpPath,
            pumpBytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg', upsert: true),
          );

      final Uint8List? sigBytes = await _signatureController.toPngBytes();
      if (sigBytes == null) throw Exception('Signature export failed');
      await ref.read(supabaseProvider).storage.from('signatures').uploadBinary(
            sigPath,
            sigBytes,
            fileOptions: const FileOptions(contentType: 'image/png', upsert: true),
          );

      await ref.read(supabaseProvider).from('fuelings').insert({
        'id': fuelingId,
        'company_id': companyId,
        'station_id': stationId,
        'attendant_id': session.user.id,
        'vehicle_id': _match!.vehicleId,
        'customer_id': _match!.customerId,
        'driver_name': _driverCtrl.text.isEmpty ? null : _driverCtrl.text,
        'gallons': double.parse(_gallonsCtrl.text),
        'price_per_gallon': double.parse(_priceCtrl.text),
        'fuel_type': _fuelType,
        'odometer': _odometerCtrl.text.isEmpty ? null : int.parse(_odometerCtrl.text),
        'pump_photo_path': pumpPath,
        'signature_path': sigPath,
        'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      });

      if (mounted) context.go('/attendant/success?id=$fuelingId');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New fueling')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _plateCtrl,
                    decoration: const InputDecoration(
                      labelText: 'License plate',
                      border: OutlineInputBorder(),
                    ),
                    textCapitalization: TextCapitalization.characters,
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _loading ? null : _lookupPlate, child: const Text('Look up')),
              ],
            ),
            if (_match != null)
              Card(
                margin: const EdgeInsets.only(top: 12),
                child: ListTile(
                  title: Text(_match!.licensePlate),
                  subtitle: Text('${_match!.customerName} · ${_match!.make ?? ''} ${_match!.model ?? ''}'),
                ),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _gallonsCtrl,
              decoration: const InputDecoration(labelText: 'Gallons', border: OutlineInputBorder()),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _priceCtrl,
              decoration: InputDecoration(
                labelText: 'Price per gallon',
                border: const OutlineInputBorder(),
                helperText: _defaultPrice != null ? 'Station default loaded' : null,
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _fuelType,
              decoration: const InputDecoration(labelText: 'Fuel type', border: OutlineInputBorder()),
              items: ['regular', 'midgrade', 'premium', 'diesel', 'other']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _fuelType = v ?? 'regular'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _odometerCtrl,
              decoration: const InputDecoration(labelText: 'Odometer (optional)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _driverCtrl,
              decoration: const InputDecoration(labelText: 'Driver name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _pickPumpPhoto,
              icon: const Icon(Icons.camera_alt),
              label: Text(_pumpPhoto == null ? 'Take pump photo' : 'Photo captured ✓'),
            ),
            const SizedBox(height: 16),
            const Text('Driver signature'),
            Container(
              height: 160,
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)),
              child: Signature(controller: _signatureController, backgroundColor: Colors.white),
            ),
            TextButton(onPressed: () => _signatureController.clear(), child: const Text('Clear signature')),
            const SizedBox(height: 12),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Notes (optional)', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Submit fueling'),
            ),
          ],
        ),
      ),
    );
  }
}
