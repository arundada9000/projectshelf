'use client';

import { useRouter } from 'next/navigation';
import { DashboardView } from '@/components/dashboard/DashboardView';

const ROUTES: Record<string, string> = {
  dashboard: '/app/dashboard',
  projects: '/app/projects',
  'launch-sets': '/app/launch-sets',
  settings: '/app/settings',
  manual: '/app/manual',
};

export default function DashboardPage() {
  const router = useRouter();
  return <DashboardView onNavigate={(page) => router.push(ROUTES[page] ?? '/app/projects')} />;
}
