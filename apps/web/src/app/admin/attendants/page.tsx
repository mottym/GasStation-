import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { AttendantsManager } from '@/components/admin/attendants-manager';

export default async function AttendantsPage() {
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const [{ data: attendantsRaw }, { data: stations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, station_id, stations(name)')
      .eq('company_id', profile.company_id!)
      .eq('role', 'attendant' as const),
    supabase.from('stations').select('id, name').eq('company_id', profile.company_id!),
  ]);

  type AttendantRow = {
    id: string;
    full_name: string | null;
    phone: string | null;
    station_id: string | null;
    stations: { name: string } | { name: string }[] | null;
  };

  const attendants = (attendantsRaw ?? []) as AttendantRow[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendants</h1>
      <AttendantsManager
        companyId={profile.company_id!}
        stations={stations ?? []}
        attendants={attendants.map((a) => ({
          id: a.id,
          full_name: a.full_name,
          phone: a.phone,
          station_id: a.station_id,
          station_name: Array.isArray(a.stations)
            ? a.stations[0]?.name ?? null
            : a.stations?.name ?? null,
        }))}
      />
    </div>
  );
}
