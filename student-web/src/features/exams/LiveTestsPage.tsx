import { useEffect, useState } from 'react';
import { RadioTower } from 'lucide-react';
import { useLiveTests } from '@/hooks/queries';
import { isLiveNow, isUpcoming } from '@/services/catalog';
import { PageHeader } from '@/components/ui/PageHeader';
import { Chips } from '@/components/ui/Chips';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { LiveTestCard } from '@/components/domain/LiveTestCard';

type Filter = 'all' | 'live' | 'upcoming';

export default function LiveTestsPage() {
  const { data, isLoading, isError, error, refetch } = useLiveTests();
  const [filter, setFilter] = useState<Filter>('all');
  // Re-evaluate LIVE / UPCOMING as time passes.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const list = (data ?? []).filter((t) => (filter === 'live' ? isLiveNow(t, now) : filter === 'upcoming' ? isUpcoming(t, now) : true));

  return (
    <div>
      <PageHeader title="Live Tests" back="/home" />
      <Chips
        label="Filter live tests"
        className="mb-5"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'live', label: 'Live Now' },
          { value: 'upcoming', label: 'Upcoming' },
        ]}
      />
      {isLoading ? (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[122px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load live tests." error={error} onRetry={() => void refetch()} />
      ) : list.length === 0 ? (
        <Message
          icon={<RadioTower />}
          title={filter === 'live' ? 'No live tests active right now' : 'No tests found in this category'}
          message="Scheduled statewide live tests appear here."
        />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t, i) => (
            <LiveTestCard key={t.id} test={t} index={i} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
