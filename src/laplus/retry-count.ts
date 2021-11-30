export async function retryCount<Result>(
  count: number,
  fn: () => Result | Promise<Result>,
): Promise<Result> {
  let lastError: unknown
  for (let i = 0; i < count; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}
