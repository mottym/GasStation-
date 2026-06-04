import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/models.dart';
import '../../providers/auth_provider.dart';

class FuelingsScreen extends ConsumerStatefulWidget {
  const FuelingsScreen({super.key});

  @override
  ConsumerState<FuelingsScreen> createState() => _FuelingsScreenState();
}

class _FuelingsScreenState extends ConsumerState<FuelingsScreen> {
  List<Fueling> _fuelings = [];
  bool _loading = true;

  Future<void> _load() async {
    final profile = await ref.read(profileProvider.future);
    if (profile?.customerId == null) return;
    final rows = await ref
        .read(supabaseProvider)
        .from('fuelings')
        .select('*, vehicles(license_plate)')
        .eq('customer_id', profile!.customerId!)
        .order('created_at', ascending: false)
        .limit(50);
    setState(() {
      _fuelings = (rows as List).map((e) => Fueling.fromJson(e as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Map<String, double> _weeklyGallons() {
    final map = <String, double>{};
    for (final f in _fuelings) {
      final key = DateFormat('MM/dd').format(f.createdAt);
      map[key] = (map[key] ?? 0) + f.gallons;
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final weekly = _weeklyGallons();
    final keys = weekly.keys.toList();
    final totalGallons = _fuelings.fold<double>(0, (s, f) => s + f.gallons);
    final totalCents = _fuelings.fold<int>(0, (s, f) => s + f.totalCents);

    return Scaffold(
      appBar: AppBar(title: const Text('Fuelings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Total gallons',
                  value: totalGallons.toStringAsFixed(1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Total spend',
                  value: '\$${(totalCents / 100).toStringAsFixed(2)}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Gallons by day', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SizedBox(
            height: 200,
            child: keys.isEmpty
                ? const Center(child: Text('No data yet'))
                : BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: (weekly.values.isEmpty ? 1 : weekly.values.reduce((a, b) => a > b ? a : b)) * 1.2,
                      barGroups: List.generate(
                        keys.length,
                        (i) => BarChartGroupData(
                          x: i,
                          barRods: [
                            BarChartRodData(
                              toY: weekly[keys[i]]!,
                              color: Theme.of(context).colorScheme.primary,
                              width: 16,
                            ),
                          ],
                        ),
                      ),
                      titlesData: FlTitlesData(
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (v, _) {
                              final i = v.toInt();
                              if (i < 0 || i >= keys.length) return const Text('');
                              return Text(keys[i], style: const TextStyle(fontSize: 10));
                            },
                          ),
                        ),
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 32)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      gridData: const FlGridData(show: true),
                    ),
                  ),
          ),
          const SizedBox(height: 24),
          const Text('Recent fuelings', style: TextStyle(fontWeight: FontWeight.bold)),
          ..._fuelings.map(
            (f) => ListTile(
              title: Text(f.licensePlate ?? 'Vehicle'),
              subtitle: Text(DateFormat.yMMMd().add_jm().format(f.createdAt)),
              trailing: Text('\$${(f.totalCents / 100).toStringAsFixed(2)}'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            Text(value, style: Theme.of(context).textTheme.headlineSmall),
          ],
        ),
      ),
    );
  }
}
