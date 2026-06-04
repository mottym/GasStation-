import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart' show launchUrl, LaunchMode;
import '../../core/models.dart';
import '../../providers/auth_provider.dart';

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({super.key});

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
  List<Invoice> _invoices = [];
  bool _loading = true;

  Future<void> _load() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.customerId == null) return;
    final rows = await ref
        .read(supabaseProvider)
        .from('invoices')
        .select()
        .eq('customer_id', profile!.customerId!)
        .order('period_end', ascending: false);
    setState(() {
      _invoices = (rows as List).map((e) => Invoice.fromJson(e as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  Future<void> _openPdf(Invoice inv) async {
    if (inv.pdfPath == null) return;
    final url = await ref.read(supabaseProvider).storage.from('invoices').createSignedUrl(inv.pdfPath!, 3600);
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _invoices.length,
              padding: const EdgeInsets.all(16),
              itemBuilder: (_, i) {
                final inv = _invoices[i];
                return Card(
                  child: ListTile(
                    title: Text('${inv.periodStart} — ${inv.periodEnd}'),
                    subtitle: Text('\$${(inv.totalCents / 100).toStringAsFixed(2)} · ${inv.status}'),
                    trailing: inv.pdfPath != null
                        ? IconButton(icon: const Icon(Icons.picture_as_pdf), onPressed: () => _openPdf(inv))
                        : null,
                  ),
                );
              },
            ),
    );
  }
}
