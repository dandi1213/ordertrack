import { Suspense } from 'react';
import TrackingView, {
  TrackingError,
  TrackingNotFound,
} from '@/features/tracking/TrackingView';
import { loadTracking } from '@/app/actions/data';

type Params = PageProps<'/track/[token]'>['params'];

function TrackingFallback() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="h-24 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
        <div className="h-80 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

async function TrackedOrder({ params }: { params: Params }) {
  const { token } = await params;
  const result = await loadTracking(token);

  if (!result.ok) return <TrackingError message={result.error} />;
  if (!result.data) return <TrackingNotFound />;
  return <TrackingView info={result.data} />;
}

export default function PublicTrackingPage(props: { params: Params }) {
  return (
    <Suspense fallback={<TrackingFallback />}>
      <TrackedOrder params={props.params} />
    </Suspense>
  );
}
