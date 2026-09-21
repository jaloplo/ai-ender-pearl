'use client';

import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';

export default function StatsLayout({ children }) {
  const params = useParams();
  return <><AnalyticsDashboard short={params?.short} />{children}</>;
}
