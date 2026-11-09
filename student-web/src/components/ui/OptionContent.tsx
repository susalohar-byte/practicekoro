import { MathText } from './MathText';

/**
 * An MCQ answer option: its text (as before) and, when the option has one, its image below the
 * text. Options can be text only, image only, or both.
 */
export function OptionContent({
  text,
  imageUrl,
  label,
}: {
  text: string;
  imageUrl?: string | null;
  /** Option letter, used for the image's alt text. */
  label: string;
}) {
  return (
    <>
      {text && <MathText>{text}</MathText>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Option ${label}`}
          loading="lazy"
          className={
            'block max-h-48 max-w-full rounded-lg border border-line bg-white object-contain' +
            (text ? ' mt-2' : '')
          }
        />
      )}
    </>
  );
}
