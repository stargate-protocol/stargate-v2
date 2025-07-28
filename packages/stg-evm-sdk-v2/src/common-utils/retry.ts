export const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number,
    chainName: string,
    operationName: string,
    logger?: { warn: (msg: string, meta?: any) => void; error: (msg: string, ...args: any[]) => void }
): Promise<T> => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error

            if (attempt === maxRetries) {
                if (logger) {
                    logger.error(
                        `❌ Final attempt failed for ${operationName} on ${chainName} after ${maxRetries} retries:`,
                        error
                    )
                } else {
                    console.error(
                        `❌ Final attempt failed for ${operationName} on ${chainName} after ${maxRetries} retries:`,
                        error
                    )
                }
                throw error
            }

            const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff: 1s, 2s, 4s, etc.
            const logMessage = `⚠️  Attempt ${attempt}/${maxRetries} failed for ${operationName} on ${chainName}, retrying in ${delay}ms...`
            const errorInfo = {
                error: error instanceof Error ? error.message : String(error),
            }

            if (logger) {
                logger.warn(logMessage, errorInfo)
            } else {
                console.warn(logMessage, errorInfo)
            }

            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }

    throw lastError!
}
