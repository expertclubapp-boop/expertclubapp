import { Timestamp } from 'firebase/firestore'

type TimestampLike = {
  toDate?: () => Date
  seconds?: number
  nanoseconds?: number
  _seconds?: number
  _nanoseconds?: number
}

export type FirestoreDateInput = Timestamp | TimestampLike | Date | string | number | null | undefined

function warnInvalidDate(value: unknown) {
  if (typeof console !== 'undefined') {
    console.warn('[FirestoreDate] Invalid date value ignored', value)
  }
}

export function fromFirestoreDate(value: FirestoreDateInput): Date | null {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const date = value.toDate()
      return Number.isNaN(date.getTime()) ? null : date
    }

    const seconds = value.seconds ?? value._seconds
    const nanos = value.nanoseconds ?? value._nanoseconds ?? 0
    if (typeof seconds === 'number') {
      return new Timestamp(seconds, nanos).toDate()
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  warnInvalidDate(value)
  return null
}

export function toFirestoreDate(value: FirestoreDateInput): Timestamp | null {
  if (value == null || value === '') return null
  if (value instanceof Timestamp) return value

  if (typeof value === 'object' && !(value instanceof Date)) {
    const seconds = value.seconds ?? value._seconds
    const nanos = value.nanoseconds ?? value._nanoseconds ?? 0
    if (typeof seconds === 'number') return new Timestamp(seconds, nanos)
  }

  const date = fromFirestoreDate(value)
  return date ? Timestamp.fromDate(date) : null
}

export function nowTimestamp(): Timestamp {
  return Timestamp.now()
}

const FIRESTORE_WRITE_DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'publishedAt',
  'assignedAt',
  'selectedAt',
  'submittedAt',
  'reviewedAt',
  'completedAt',
  'startedAt',
  'finishedAt',
  'joinedAt',
  'paidAt',
  'approvedAt',
  'reversedAt',
  'cancelledAt',
  'expiresAt',
  'renewalDate',
  'currentPeriodStart',
  'currentPeriodEnd',
  'startedAt',
  'onboardingCompletedAt',
  'lastInteractionAt',
  'inactiveWarningShownAt',
  'publishedAt',
  'startsAt',
  'endsAt',
  'effectiveFrom',
  'firstSeenAt',
  'attributedAt',
  'processedAt',
  'lastSubmittedAt',
  'nextDueAt',
  'date',
])

export function removeUndefinedFields<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>
}

export function normalizeFirestoreWriteData<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue

    if (FIRESTORE_WRITE_DATE_FIELDS.has(key)) {
      output[key] = toFirestoreDate(value as FirestoreDateInput) ?? value
      continue
    }

    output[key] = value
  }

  return output as Partial<T>
}

export function dateMillis(value: FirestoreDateInput): number {
  return fromFirestoreDate(value)?.getTime() ?? 0
}

export function safeDateKey(value: FirestoreDateInput = new Date()): string {
  const date = fromFirestoreDate(value) ?? new Date()
  return date.toISOString().slice(0, 10)
}
