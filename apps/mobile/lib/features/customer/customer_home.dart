import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class CustomerHome extends ConsumerWidget {
  const CustomerHome({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My fleet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(supabaseProvider).auth.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: profile.when(
        data: (p) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Hello, ${p?.fullName ?? 'Fleet manager'}', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            _NavTile(
              icon: Icons.directions_car,
              title: 'Vehicles',
              subtitle: 'Manage fleet plates',
              onTap: () => context.push('/customer/vehicles'),
            ),
            _NavTile(
              icon: Icons.local_gas_station,
              title: 'Fueling history',
              subtitle: 'Gallons and spend charts',
              onTap: () => context.push('/customer/fuelings'),
            ),
            _NavTile(
              icon: Icons.receipt_long,
              title: 'Invoices',
              subtitle: 'Weekly PDF invoices',
              onTap: () => context.push('/customer/invoices'),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, size: 32),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
