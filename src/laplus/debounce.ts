export function debounce<Args extends unknown[]>(
  periodMs: number,
  fn: (...args: Args) => void,
) {
  let timeoutId: NodeJS.Timeout | undefined
  return (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(fn, periodMs, ...args)
  }
}
