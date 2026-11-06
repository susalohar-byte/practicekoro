import { Fragment, useEffect, useMemo, useState } from 'react';

type KatexRenderer = (typeof import('katex'))['default'];
type Segment = { text: string } | { tex: string; display: boolean; raw: string };

// Same delimiters as the admin console's MathText (BulkTxtImportModal tells authors to wrap LaTeX in $...$).
// Inline $...$ must not start or end with a space and must not be followed by a digit, so prices such as
// "$5 and $10" stay ordinary text.
const DELIMITED_MATH = /(\$\$[\s\S]+?\$\$|\$(?=\S)(?:\\.|[^$\n])+?(?<=\S)\$(?!\d)|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

export function splitMath(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of value.matchAll(DELIMITED_MATH)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: value.slice(cursor, start) });
    const wide = raw.startsWith('$$') || raw.startsWith('\\[') || raw.startsWith('\\(');
    segments.push({
      tex: wide ? raw.slice(2, -2) : raw.slice(1, -1),
      display: raw.startsWith('$$') || raw.startsWith('\\['),
      raw,
    });
    cursor = start + raw.length;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
  return segments;
}

/**
 * Question, option and explanation text with LaTeX math (fractions, powers, roots) typeset by KaTeX.
 * Plain text renders as before; KaTeX loads only when a string actually contains math.
 */
export function MathText({ children }: { children: string | null | undefined }) {
  const source = children ?? '';
  const segments = useMemo(() => splitMath(source), [source]);
  const hasMath = segments.some((s) => 'tex' in s);
  const [katex, setKatex] = useState<KatexRenderer | null>(null);

  useEffect(() => {
    if (!hasMath || katex) return;
    let active = true;
    void Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([module]) => {
        if (active) setKatex(() => module.default);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hasMath, katex]);

  if (!hasMath) return <>{source}</>;
  return (
    <>
      {segments.map((s, i) => {
        if ('text' in s) return <Fragment key={i}>{s.text}</Fragment>;
        if (!katex) return <Fragment key={i}>{s.raw}</Fragment>;
        const html = katex.renderToString(s.tex, {
          displayMode: s.display,
          throwOnError: false,
          trust: false,
          maxSize: 10,
          maxExpand: 500,
          // Full-size fractions inline too, as printed in exam papers (6⅓ with a readable ⅓, not a tiny one).
          macros: { '\\frac': '\\dfrac' },
        });
        return (
          <span
            key={i}
            className={s.display ? 'block overflow-x-auto overflow-y-hidden text-center' : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </>
  );
}
