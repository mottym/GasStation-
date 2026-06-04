import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/attendant/attendant_home.dart';
import 'features/attendant/new_fueling_screen.dart';
import 'features/attendant/fueling_success_screen.dart';
import 'features/customer/customer_home.dart';
import 'features/customer/vehicles_screen.dart';
import 'features/customer/fuelings_screen.dart';
import 'features/customer/invoices_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: GoRouterRefreshStream(
      ref.watch(supabaseProvider).auth.onAuthStateChange,
    ),
    redirect: (context, state) async {
      final session = ref.read(supabaseProvider).auth.currentSession;
      final onLogin = state.matchedLocation == '/login';

      if (session == null) {
        return onLogin ? null : '/login';
      }

      if (onLogin) {
        final profile = await ref.read(profileProvider.future);
        if (profile?.isAttendant == true) return '/attendant';
        if (profile?.isCustomer == true) return '/customer';
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/attendant', builder: (_, __) => const AttendantHome()),
      GoRoute(path: '/attendant/fueling', builder: (_, __) => const NewFuelingScreen()),
      GoRoute(
        path: '/attendant/success',
        builder: (_, state) => FuelingSuccessScreen(
          fuelingId: state.uri.queryParameters['id'] ?? '',
        ),
      ),
      GoRoute(path: '/customer', builder: (_, __) => const CustomerHome()),
      GoRoute(path: '/customer/vehicles', builder: (_, __) => const VehiclesScreen()),
      GoRoute(path: '/customer/fuelings', builder: (_, __) => const FuelingsScreen()),
      GoRoute(path: '/customer/invoices', builder: (_, __) => const InvoicesScreen()),
    ],
  );
});

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
