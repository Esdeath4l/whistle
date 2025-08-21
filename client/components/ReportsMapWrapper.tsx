import dynamic from 'next/dynamic';
import { Report } from '@shared/api';

// Dynamically import the ReportsMap to avoid SSR issues with Leaflet
const ReportsMap = dynamic(() => import('./ReportsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-muted flex items-center justify-center rounded-lg border">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface ReportsMapWrapperProps {
  reports: Report[];
  onReportSelect?: (report: Report) => void;
  className?: string;
}

const ReportsMapWrapper: React.FC<ReportsMapWrapperProps> = (props) => {
  return <ReportsMap {...props} />;
};

export default ReportsMapWrapper;
