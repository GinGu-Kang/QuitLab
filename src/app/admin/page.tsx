import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { getAdminStats } from '@/lib/repository';

export default async function AdminPage() {
  const stats = await getAdminStats();

  return <AdminDashboardCharts stats={stats} />;
}
