import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/models.dart';

final supabaseProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(supabaseProvider).auth.onAuthStateChange;
});

final profileProvider = FutureProvider<Profile?>((ref) async {
  final session = ref.watch(supabaseProvider).auth.currentSession;
  if (session == null) return null;
  final data = await ref.watch(supabaseProvider).from('profiles').select().eq('id', session.user.id).maybeSingle();
  if (data == null) return null;
  return Profile.fromJson(data);
});
