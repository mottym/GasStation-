import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class AttendantHome extends ConsumerWidget {
  const AttendantHome({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendant'),
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
        data: (p) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Hello, ${p?.fullName ?? 'Attendant'}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text('Record a fleet fueling with plate lookup, pump photo, and driver signature.'),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => context.push('/attendant/fueling'),
                icon: const Icon(Icons.add),
                label: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('New fueling', style: TextStyle(fontSize: 18)),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
      ),
    );
  }
}
