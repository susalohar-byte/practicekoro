import { describe, expect, it } from 'vitest';
import { examLogoSrc } from './Brand';

const base = import.meta.env.BASE_URL;

describe('examLogoSrc', () => {
  it('uses the logo the admin uploaded', () => {
    expect(examLogoSrc('WBP Constable', 'data:image/png;base64,AAAA')).toBe(
      'data:image/png;base64,AAAA'
    );
    expect(examLogoSrc('SSC GD', 'https://cdn.example.com/ssc.png')).toBe(
      'https://cdn.example.com/ssc.png'
    );
    expect(examLogoSrc('Railway', '/images/exams/logo_railway.png')).toBe(
      '/images/exams/logo_railway.png'
    );
  });

  it('picks the same emblem as the admin console otherwise', () => {
    expect(examLogoSrc('Kolkata Police SI', 'Award')).toBe(`${base}exam-art/logo_kp.png`);
    expect(examLogoSrc('Food SI', 'Shield')).toBe(`${base}exam-art/logo_wbp.png`);
    expect(examLogoSrc('ICDS Supervisor', 'icds')).toBe(`${base}exam-art/logo_wbpsc.png`);
    expect(examLogoSrc('Primary TET', null)).toBe(`${base}exam-art/logo_wbtet.png`);
    expect(examLogoSrc('Something New', 'BookOpen')).toBe(`${base}brand/logo-icon.png`);
  });
});
