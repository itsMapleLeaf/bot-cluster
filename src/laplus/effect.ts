export function createEffect<Args extends unknown[]>(
  fn: (...args: Args) => (() => void) | undefined | void,
) {
  let cleanup: (() => void) | undefined | void
  return function run(...args: Args) {
    cleanup?.()
    cleanup = fn(...args)
  }
}
