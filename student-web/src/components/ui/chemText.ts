// Plain-text chemistry typed without LaTeX: "H2SO4" → H<sub>2</sub>SO<sub>4</sub>, "->" → "→", "<=>" → "⇌".
// Kept in step with the app's chem_text.dart. Real <sub> rather than Unicode ₂, which the Bengali
// fonts lack and draw badly.

const ELEMENTS = new Set(
  (
    'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
    'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb ' +
    'Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr'
  ).split(' ')
);

// Single-element molecules that are written with a count; anything else needs two or more
// elements, so "B12" (vitamin) or "A4" (paper) never change.
const MOLECULES = new Set(['H2', 'O2', 'O3', 'N2', 'F2', 'Cl2', 'Br2', 'I2', 'P4', 'S8']);

// A coefficient, then element symbols and (groups) each with an optional 1–2 digit count.
const FORMULA = /(?<![A-Za-z0-9])(\d{0,2})((?:[A-Z][a-z]?\d{0,2}|\((?:[A-Z][a-z]?\d{0,2})+\)\d{0,2})+)(?![A-Za-z0-9])/g;

function isFormula(body: string): boolean {
  if (!/\d/.test(body)) return false;
  const symbols = body.match(/[A-Z][a-z]?/g) ?? [];
  if (!symbols.every((s) => ELEMENTS.has(s))) return false;
  return symbols.length >= 2 || MOLECULES.has(body);
}

export type ChemPart = string | { sub: string };

const arrows = (text: string) => text.replace(/<=>/g, '⇌').replace(/->/g, '→');

/** [text] split into plain strings and formula counts to draw as subscripts. */
export function chemParts(text: string): ChemPart[] {
  if (!/[A-Z]/.test(text) && !/->|<=>/.test(text)) return [text];
  const parts: ChemPart[] = [];
  let cursor = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const last = parts[parts.length - 1];
    if (typeof last === 'string') parts[parts.length - 1] = last + value;
    else parts.push(value);
  };
  for (const match of text.matchAll(FORMULA)) {
    const [, coefficient, body] = match;
    if (!isFormula(body)) continue;
    const start = match.index ?? 0;
    pushText(arrows(text.slice(cursor, start)) + coefficient);
    for (const piece of body.split(/(?<=[A-Za-z)])(\d{1,2})/)) {
      if (/^\d+$/.test(piece)) parts.push({ sub: piece });
      else pushText(piece);
    }
    cursor = start + match[0].length;
  }
  pushText(arrows(text.slice(cursor)));
  return parts;
}
