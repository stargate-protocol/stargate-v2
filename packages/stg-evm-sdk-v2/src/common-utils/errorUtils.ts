export const throwError = <Err extends Error>(message: string, error?: (message: string) => Err): never => {
    throw error?.(message) ?? new Error(message)
}
