import { Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { useNotifications } from '@/hooks/queries';
import { relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';

export default function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" back="/home" />
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState message="Notifications could not be loaded." error={error} onRetry={() => void refetch()} />
      ) : (data ?? []).length === 0 ? (
        <Message
          icon={<Bell />}
          title="No notifications yet"
          message="Test announcements and updates for your account will appear here."
          action={<ButtonLink to="/exams" variant="secondary">Browse tests</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((n) => {
            const internal = n.actionLink?.startsWith('/');
            const body = (
              <div className="flex gap-3.5 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14.5px] font-bold text-ink">{n.title}</p>
                    <span className="shrink-0 text-[11.5px] text-faint">{relativeTime(n.sentAt)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{n.message}</p>
                </div>
                {internal && <ChevronRight className="h-5 w-5 self-center text-faint" />}
              </div>
            );
            return (
              <li key={n.id} className="rounded-card border border-line bg-white shadow-card">
                {internal ? <Link to={n.actionLink!}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
