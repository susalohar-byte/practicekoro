import { Fragment, useEffect, useMemo, useState } from 'react';
import { chemParts } from './chemText';

type KatexRenderer = (typeof import('katex'))['default'];
type Segment = { text: string } | { tex: string; display: boolean; raw: string };

// Same delimiters as the admin console's MathText (BulkTxtImportModal tells authors to wrap LaTeX in $...$).
// Inline $...$ must not start or end with a space and must not be followed by a digit, so prices such as
// "$5 and $10" stay ordinary text.
const DELIMITED_MATH = /(\$\$[\s\S]+?\$\$|\$(?=\S)(?:\\.|[^$\n])+?(?<=\S)\$(?!\d)|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

// Plain-text fractions typed without LaTeX: "6 1/3" (mixed) and "2/3", in ASCII or Bengali digits.
// Dates such as 15/08/2024 and decimals such as 1.5/2 are left alone.
const PLAIN_FRACTION = /(?<![\d০-৯/.])(?:([\d০-৯]{1,3})[ \t]+)?([\d০-৯]{1,3})\/([\d০-৯]{1,3})(?![\d০-৯/.])/g;

const texNumber = (digits: string) => (/^\d+$/.test(digits) ? digits : `\\text{${digits}}`);

function splitFractions(value: string, segments: Segment[]) {
  let cursor = 0;
  for (const match of value.matchAll(PLAIN_FRACTION)) {
    const [raw, whole, num, den] = match;
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: value.slice(cursor, start) });
    const frac = `\\frac{${texNumber(num)}}{${texNumber(den)}}`;
    segments.push({ tex: whole ? `${texNumber(whole)}${frac}` : frac, display: false, raw });
    cursor = start + raw.length;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
}

export function splitMath(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of value.matchAll(DELIMITED_MATH)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > cursor) splitFractions(value.slice(cursor, start), segments);
    const wide = raw.startsWith('$$') || raw.startsWith('\\[') || raw.startsWith('\\(');
    segments.push({
      tex: wide ? raw.slice(2, -2) : raw.slice(1, -1),
      display: raw.startsWith('$$') || raw.startsWith('\\['),
      raw,
    });
    cursor = start + raw.length;
  }
  if (cursor < value.length) splitFractions(value.slice(cursor), segments);
  return segments;
}

/** Plain text with chemical formula counts as subscripts (H2SO4) and -> / <=> as arrows. */
function ChemText({ text }: { text: string }) {
  const parts = useMemo(() => chemParts(text), [text]);
  return (
    <>
      {parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{p}</Fragment> : <sub key={i}>{p.sub}</sub>))}
    </>
  );
}

/**
 * Question, option and explanation text with LaTeX math (fractions, powers, roots, \ce{} chemistry,
 * \pu{} units) typeset by KaTeX, and plain formulas such as H2SO4 written with subscripts.
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
    // mhchem registers \ce{} (chemical equations) and \pu{} (physical units) on the same KaTeX instance.
    void Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(async ([module]) => {
        await import('katex/contrib/mhchem');
        if (active) setKatex(() => module.default);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hasMath, katex]);

  if (!hasMath) return <ChemText text={source} />;
  return (
    <>
      {segments.map((s, i) => {
        if ('text' in s) return <ChemText key={i} text={s.text} />;
        if (!katex) return <Fragment key={i}>{s.raw}</Fragment>;
        const html = katex.renderToString(s.tex, {
          displayMode: s.display,
          throwOnError: false,
          trust: false,
          strict: 'ignore',
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
