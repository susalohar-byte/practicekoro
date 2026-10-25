import {
  BookOpen,
  Calculator,
  Brain,
  FlaskConical,
  Monitor,
  Newspaper,
  Trophy,
  Landmark,
  Globe,
  Gavel,
  Trees,
  TrendingUp,
  Library,
  Lightbulb,
  Languages,
  Medal,
  Leaf,
  type LucideIcon,
} from 'lucide-react';

/** Home "Explore Subjects" gradient, matched on the English name (first match wins). */
export function subjectGradient(name: string): [string, string] {
  const n = name.toLowerCase();
  const table: [string[], [string, string]][] = [
    [['gk', 'general knowledge'], ['#FF8533', '#FF5E1A']],
    [['math', 'arith'], ['#1EA0FF', '#0070F3']],
    [['reason'], ['#1BD894', '#00C27A']],
    [['english'], ['#FF5D8D', '#F62B64']],
    [['sci'], ['#9061F9', '#6C2BD9']],
    [['comp'], ['#38BDF8', '#0284C7']],
    [['current'], ['#FB7185', '#E11D48']],
    [['static'], ['#FBBF24', '#D97706']],
    [['history'], ['#F59E0B', '#B45309']],
    [['geo'], ['#2DD4BF', '#0D9488']],
    [['polity'], ['#818CF8', '#4F46E5']],
    [['econ'], ['#34D399', '#059669']],
    [['env'], ['#4ADE80', '#16A34A']],
  ];
  return table.find(([k]) => k.some((x) => n.includes(x)))?.[1] ?? ['#3B82F6', '#1D4ED8'];
}

/** Home subject icon (english renders the letter "A"). */
export function homeSubjectIcon(name: string): LucideIcon | 'A' {
  const n = name.toLowerCase();
  if (n.includes('english')) return 'A';
  const table: [string[], LucideIcon][] = [
    [['math', 'arith'], Calculator],
    [['reason'], Brain],
    [['gk', 'general knowledge', 'book'], BookOpen],
    [['sci'], FlaskConical],
    [['comp'], Monitor],
    [['current'], Newspaper],
    [['static'], Trophy],
    [['history'], Landmark],
    [['geo'], Globe],
    [['polity'], Gavel],
    [['env'], Trees],
    [['econ'], TrendingUp],
  ];
  return table.find(([k]) => k.some((x) => n.includes(x)))?.[1] ?? Library;
}

/** practice_common.subjectIcon */
export function subjectIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  const table: [string[], LucideIcon][] = [
    [['history'], Landmark],
    [['geograph'], Globe],
    [['math', 'arith'], Calculator],
    [['econom'], Leaf],
    [['polity', 'constitution'], Gavel],
    [['science', 'tech'], FlaskConical],
    [['current'], Newspaper],
    [['environment'], Trees],
    [['sport'], Trophy],
    [['award', 'honour'], Medal],
    [['book', 'author'], Library],
    [['english', 'bengali', 'language'], Languages],
    [['reason'], Brain],
    [['static', 'general knowledge', 'gk'], Lightbulb],
  ];
  return table.find(([k]) => k.some((x) => n.includes(x)))?.[1] ?? BookOpen;
}

const PALETTE = ['#1F48E8', '#DC2626', '#16A34A', '#F97316', '#8B5CF6', '#0EA5E9', '#F59E0B'];
export const paletteAt = (i: number) => PALETTE[i % PALETTE.length];

/** Practice subject colour (_getSubjectColor) */
export function subjectColor(name: string, index: number): string {
  const n = name.toLowerCase();
  const table: [string, string][] = [
    ['history', '#D97706'],
    ['geo', '#0D9488'],
    ['polity', '#7C3AED'],
    ['econ', '#2563EB'],
    ['sci', '#059669'],
    ['current', '#EA580C'],
    ['env', '#16A34A'],
    ['math', '#4F46E5'],
  ];
  return table.find(([k]) => n.includes(k))?.[1] ?? paletteAt(index);
}

export function qsLabel(n: number): string {
  if (n <= 0) return '0 Qs';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K Qs`;
  return `${n} Qs`;
}
