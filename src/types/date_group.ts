// src/lib/dateGroups.ts

export type DateGroupLabel =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 days'
  | 'Previous 30 days'
  | string // e.g. "June 2025"

export interface DateGroup<T> {
  label: DateGroupLabel
  items: T[]
}