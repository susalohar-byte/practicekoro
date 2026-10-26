import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/** "PracticeKoro PRO" dialog shown when a locked test is opened. */
export function ProDialog({ open, onClose, what = 'mock test' }: { open: boolean; onClose: () => void; what?: string }) {
  const navigate = useNavigate();
  const full = what === 'previous year paper' ? 'full PYQs' : 'full tests';
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold" /> PracticeKoro PRO
        </span>
      }
      footer={
        <>
          <Button block onClick={() => navigate('/plans')}>
            View Plans
          </Button>
          <Button block variant="secondary" onClick={onClose}>
            Maybe Later
          </Button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-ink-soft">
        This {what} requires a PRO membership. Unlock {full}, detailed solutions, and performance rankings with PRO.
      </p>
    </Modal>
  );
}
