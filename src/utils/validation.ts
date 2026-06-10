/**
 * Client-side validation utilities for couple sync data.
 * Ensures data integrity before sending to Supabase.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate that a string is a non-empty trimmed value within max length.
 */
export function isValidString(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

/**
 * Validate UUID format.
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

/**
 * Validate a couple_id (non-empty string, typically a UUID).
 */
export function isValidCoupleId(value: unknown): value is string {
  return isValidString(value, 100)
}

/**
 * Validate a profile ID (non-empty string).
 */
export function isValidProfileId(value: unknown): value is string {
  return isValidString(value, 100)
}

/**
 * Validate a positive timestamp.
 */
export function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value)
}

/**
 * Sanitize a string by trimming and removing dangerous characters.
 */
export function sanitizeString(value: string, maxLength = 500): string {
  return value
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, '')
}

/**
 * Validate invite code format (alphanumeric, reasonable length).
 */
export function isValidInviteCode(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 4 && value.length <= 20
}

/**
 * Validate couple connection data before insert/update.
 */
export function validateCoupleConnection(data: {
  id?: unknown
  inviteCode?: unknown
  profile1Id?: unknown
  profile1Name?: unknown
  profile2Id?: unknown
  profile2Name?: unknown
  status?: unknown
}): string | null {
  if (data.id !== undefined && !isValidUUID(data.id)) {
    return 'Invalid connection ID format'
  }
  if (data.profile1Id !== undefined && !isValidProfileId(data.profile1Id)) {
    return 'Invalid profile1 ID'
  }
  if (data.profile1Name !== undefined && !isValidString(data.profile1Name, 100)) {
    return 'Invalid profile1 name'
  }
  if (data.inviteCode !== undefined && data.inviteCode !== null && !isValidInviteCode(data.inviteCode)) {
    return 'Invalid invite code'
  }
  if (data.status !== undefined && !['pending', 'active', 'inactive'].includes(data.status as string)) {
    return 'Invalid status'
  }
  return null
}

/**
 * Validate couple-scoped data (goals, love notes, activity, shared tasks).
 */
export function validateCoupleData(data: {
  id?: unknown
  coupleId?: unknown
  data?: unknown
  updatedAt?: unknown
}): string | null {
  if (data.id !== undefined && !isValidString(data.id, 100)) {
    return 'Invalid record ID'
  }
  if (!isValidCoupleId(data.coupleId)) {
    return 'Invalid or missing couple_id'
  }
  if (data.data === null || data.data === undefined) {
    return 'Data payload is required'
  }
  if (data.updatedAt !== undefined && !isValidTimestamp(data.updatedAt)) {
    return 'Invalid timestamp'
  }
  return null
}
