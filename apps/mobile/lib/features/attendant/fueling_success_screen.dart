import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FuelingSuccessScreen extends StatelessWidget {
  const FuelingSuccessScreen({super.key, required this.fuelingId});

  final String fuelingId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Success')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 72),
            const SizedBox(height: 16),
            Text('Fueling recorded', style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('ID: $fuelingId', style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: () => context.go('/attendant/fueling'),
              child: const Text('Record another'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => context.go('/attendant'),
              child: const Text('Back to home'),
            ),
          ],
        ),
      ),
    );
  }
}
