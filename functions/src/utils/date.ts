export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayKey(): string {
  return daysAgoKey(1)
}

export function daysAgoKey(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

export function daysFromNowIso(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString()
}

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in (value as object)) {
    return (value as { toDate(): Date }).toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}
