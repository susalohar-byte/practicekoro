import { useEffect, useState } from 'react';
import { FileText, GraduationCap, type LucideIcon } from 'lucide-react';
import { storedImage } from '@/lib/student/homepage';

/** The admin-owned URL is the source of truth. Broken images use an icon, never another exam's artwork. */
export function HomepageImage({
  src,
  alt = '',
  kind = 'test',
  icon: Icon,
  className = '',
}: {
  src?: string;
  alt?: string;
  kind?: 'test' | 'exam';
  icon?: LucideIcon;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const Fallback = Icon || (kind === 'exam' ? GraduationCap : FileText);
  const url = storedImage(src);
  return (
    <span className={`study-art ${className}`}>
      {url && !failed ? (
        <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Fallback aria-hidden="true" size={28} />
      )}
    </span>
  );
}
