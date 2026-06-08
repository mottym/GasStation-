'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    let authError: { message: string } | null = null;
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      authError = result.error;
    } catch {
      setError(
        'Cannot reach Supabase. Check apps/web/.env.local has your project URL and anon key from the Supabase dashboard.'
      );
      setLoading(false);
      return;
    }
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single();
    const role = profile?.role;
    if (role === 'super_admin') router.push('/super');
    else if (role === 'company_admin') router.push('/admin');
    else if (role === 'customer') router.push('/portal');
    else if (role === 'attendant') {
      setError('Attendants use the mobile app.');
      await supabase.auth.signOut();
    } else setError('No profile assigned. Contact your administrator.');
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fleet Fueling Platform</CardTitle>
          <p className="text-sm text-foreground/60">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
