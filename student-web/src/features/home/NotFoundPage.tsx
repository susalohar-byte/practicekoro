import { Compass } from 'lucide-react';
import { Message } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <Message
      icon={<Compass />}
      title="Page not found"
      message="This page does not exist or has moved."
      action={<ButtonLink to="/home">Go to Home</ButtonLink>}
    />
  );
}
