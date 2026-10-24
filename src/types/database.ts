export type { Database, Json } from './database.generated';

export type UserRole = 'student' | 'admin' | 'instructor';
export type TestType = 'chapter_mock' | 'full_mock' | 'subject_mock' | 'pyq';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
