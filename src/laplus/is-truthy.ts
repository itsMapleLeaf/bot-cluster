type Falsy = false | undefined | null | "" | 0

export function isTruthy<T>(value: T | Falsy): value is T {
  return Boolean(value)
}
