// src/lib/dateGroups.ts
import { DateGroup, DateGroupLabel } from "@/src/types/date_group"

function getGroupLabel(date: Date, now: Date): DateGroupLabel {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOf7DaysAgo = new Date(startOfToday)
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7)

  const startOf30DaysAgo = new Date(startOfToday)
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOf7DaysAgo) return 'Previous 7 days'
  if (date >= startOf30DaysAgo) return 'Previous 30 days'

  // Older: group by "Month Year"
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

// Chronological priority from newest to oldest
const GROUP_ORDER: DateGroupLabel[] = [
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days',
]

export function groupByDate<T extends { updatedAt?: string | Date | null }>(
  items: T[],
  ascendingSort: boolean = false
): DateGroup<T>[] {
  const now = new Date()
  const buckets = new Map<DateGroupLabel, T[]>()

  for (const item of items) {
    if (!item.updatedAt) continue
    const date = new Date(item.updatedAt)
    const label = getGroupLabel(date, now)
    if (!buckets.has(label)) buckets.set(label, [])
    buckets.get(label)!.push(item)
  }

  // Sort items within each bucket (newest first for descending)
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      const ta = new Date(a.updatedAt!).getTime()
      const tb = new Date(b.updatedAt!).getTime()
      return ascendingSort ? ta - tb : tb - ta
    })
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a)
    const bi = GROUP_ORDER.indexOf(b)

    // Case 1: Both keys are named relative groups (Today, Yesterday, etc.)
    if (ai !== -1 && bi !== -1) {
      return ascendingSort ? bi - ai : ai - bi
    }

    // Case 2: One key is a named group, the other is a Month-Year string
    if (ai !== -1) return ascendingSort ? 1 : -1
    if (bi !== -1) return ascendingSort ? -1 : 1

    // Case 3: Both keys are Month-Year strings (compare most recent item timestamps)
    const timeA = new Date(buckets.get(a)![0].updatedAt!).getTime()
    const timeB = new Date(buckets.get(b)![0].updatedAt!).getTime()
    return ascendingSort ? timeA - timeB : timeB - timeA
  })

  return sortedKeys.map((label) => ({ label, items: buckets.get(label)! }))
}