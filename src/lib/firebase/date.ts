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

export function dateMillis(value: FirestoreDateInput): number {
  return fromFirestoreDate(value)?.getTime() ?? 0
}

export function safeDateKey(value: FirestoreDateInput = new Date()): string {
  const date = fromFirestoreDate(value) ?? new Date()
  return date.toISOString().slice(0, 10)
}
