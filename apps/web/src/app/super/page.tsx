import { createClient } from '@/lib/supabase/server';
import { CompaniesTable } from '@/components/super/companies-table';
import { CreateCompanyForm } from '@/components/super/create-company-form';

export default async function SuperCompaniesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-foreground/60 text-sm mt-1">Manage gas station companies on the platform.</p>
      </div>
      <CreateCompanyForm />
      <CompaniesTable companies={companies ?? []} />
    </div>
  );
}
