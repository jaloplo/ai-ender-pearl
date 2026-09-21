import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';
import RecentVisitsPager from '@/app/components/RecentVisitsPager';

export default function ListLayout({ children }) {
  return <div className="list-layout">{children}<RecentVisitsPager /><AnalyticsDashboard /></div>;
}
