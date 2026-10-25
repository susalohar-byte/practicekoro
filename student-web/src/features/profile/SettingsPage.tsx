import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Crown, ExternalLink, Info, LifeBuoy, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useIsPro } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { DialogHero, Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const PRIVACY_URL = 'https://practicekoro.online/privacy';

function Row({ icon, color, title, subtitle, trailing, to, href, onClick, danger }: { icon: ReactNode; color: string; title: string; subtitle?: string; trailing?: ReactNode; to?: string; href?: string; onClick?: () => void; danger?: boolean }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-[22px] [&>svg]:w-[22px]" style={{ background: `${color}1F`, color }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={danger ? 'block text-[14px] font-semibold text-danger' : 'block text-[14px] font-semibold text-ink'}>{title}</span>
        {subtitle && <span className="block text-[12px] text-muted">{subtitle}</span>}
      </span>
      {trailing}
      {(to || href || onClick) && (href ? <ExternalLink className="h-4 w-4 text-faint" /> : <ChevronRight className="h-5 w-5 text-faint" />)}
    </>
  );
  const cls = 'flex min-h-[64px] w-full items-center gap-3.5 px-1 py-2.5 hover:bg-surface/60';
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

export default function SettingsPage() {
  const isPro = useIsPro();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Settings" back="/profile" />
      <h2 className="mb-2.5 text-[16.5px] font-bold text-ink">Membership & Subscription</h2>
      <Card className="px-3">
        <Row
          icon={<Crown />}
          color="#F59E0B"
          title="Plans"
          subtitle={isPro ? 'Active Pro Pass · View & Manage' : 'View subscription packages & get Pro'}
          trailing={isPro ? <Tag tone="gold">PRO</Tag> : <Tag tone="primary">Get Pro</Tag>}
          to="/plans"
        />
      </Card>
      <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">About</h2>
      <Card className="divide-y divide-line px-3">
        <Row icon={<Shield />} color="#0EA5E9" title="Privacy Policy" href={PRIVACY_URL} />
        <Row icon={<LifeBuoy />} color="#1F48E8" title="Help & Support" to="/help" />
        <Row icon={<Info />} color="#6B7280" title="App version" subtitle="PracticeKoro · Student Web 1.0.0" />
      </Card>
      <Card className="mt-7 px-3">
        <Row icon={<LogOut />} color="#DC2626" title="Logout" danger onClick={() => setConfirm(true)} />
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} hideClose size="sm">
        <DialogHero icon={<LogOut />} tone="danger" title="Log out?" message="Your results are saved to your account. You can log in again anytime." />
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            block
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await signOut();
              navigate('/login', { replace: true });
            }}
          >
            Log Out
          </Button>
          <Button block variant="secondary" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
