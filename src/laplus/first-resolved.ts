export async function firstResolved<
  Funcs extends [...Array<() => Promise<unknown>>],
>(funcs: Funcs): Promise<Awaited<ReturnType<Funcs[number]>>> {
  let firstError: unknown
  for (const func of funcs) {
    try {
      return (await func()) as Awaited<ReturnType<Funcs[number]>>
    } catch (error) {
      firstError ??= error
    }
  }
  throw firstError
}
