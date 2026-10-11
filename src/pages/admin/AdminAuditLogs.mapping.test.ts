import { describe, expect, it } from 'vitest';
import { mapAuditAction, mapAuditResource } from './AdminAuditLogs';

describe('audit log trigger mapping', () => {
  it('maps database trigger operations to their real actions', () => {
    expect(mapAuditAction('insert')).toBe('Created');
    expect(mapAuditAction('update')).toBe('Updated');
    expect(mapAuditAction('delete')).toBe('Deleted');
  });
  it('maps plural trigger table names to resources', () => {
    expect(mapAuditResource('questions')).toBe('Question');
    expect(mapAuditResource('tests')).toBe('Mock Test');
    expect(mapAuditResource('profiles')).toBe('Student');
    expect(mapAuditResource('hero_banners')).toBe('Banner');
    expect(mapAuditResource('app_settings')).toBe('Settings');
    expect(mapAuditResource('unknown_table')).toBe('System');
  });
});
