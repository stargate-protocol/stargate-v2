/**
 * Semaphore class for controlling access to a resource by multiple processes.
 * It maintains a counter and a queue for managing access.
 */
class Semaphore {
    private counter = 0
    private queue: (() => void)[] = []
    constructor(private max: number) {}

    /**
     * Acquires a lock on the semaphore. If the semaphore is at its maximum,
     * the function will wait until it can acquire the lock.
     * @returns A promise that resolves when the lock has been acquired.
     */
    private async acquire(): Promise<void> {
        if (this.counter >= this.max) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }
        this.counter++
    }

    /**
     * Releases a lock on the semaphore.
     */
    private release(): void {
        if (this.counter == 0) return
        this.counter--
        const resolve = this.queue.shift() ?? (() => null)
        resolve()
    }

    /**
     * Executes a given asynchronous callback function, managing concurrency with semaphore locking.
     * The method ensures that the semaphore's lock is acquired before the callback is executed and released after execution.
     * It's the caller's responsibility to handle any errors within the callback.
     * @param callback - An asynchronous function to be executed. It should return a promise. The function is responsible for its own error handling.
     * @returns The promise returned by the callback function. If the callback throws, the error is not caught here and must be handled by the caller.
     */
    async process<T>(callback: () => Promise<T>): Promise<T> {
        await this.acquire()
        try {
            return await callback()
        } finally {
            this.release()
        }
    }
}

/**
 * Processes a batch of items in parallel with controlled concurrency, using a given asynchronous callback function for each item.
 * This function handles concurrency but does not catch errors from the callback functions. Errors must be handled by the caller or within the callback functions themselves.
 * @param callbacks - An array of asynchronous functions that each return a Promise. Each function should handle its own error logic.
 * @param concurrency - The maximum number of callback functions to be executed in parallel.
 * @returns A promise that resolves to an array of the resolved values of the callback functions for each item. If a callback throws, the error must be handled by the caller.
 */
export const parallelProcess = async <T>(
    callbacks: Array<() => Promise<T>>,
    concurrency: number
): Promise<Awaited<T>[]> => {
    const semaphore = new Semaphore(concurrency)
    return Promise.all(callbacks.map((cb) => semaphore.process(cb)))
}

/**
 * Helper function for processing promises with progress tracking.
 * @param title - Title to display in progress messages
 * @param promises - Array of promise-returning functions to execute
 * @param concurrency - Maximum number of concurrent executions (default: 20)
 */
export const processPromises = async (title: string, promises: (() => Promise<void>)[], concurrency = 20) => {
    let count = 0

    const wrappedPromises = promises.map((promise) => {
        return async () => {
            await promise()
            count++
        }
    })

    const printProgress = () => console.log(`[${title}] Processed ${count}/${promises.length}`)

    const interval = setInterval(printProgress, 1000)

    await parallelProcess(wrappedPromises, concurrency)

    printProgress()

    clearInterval(interval)
}
