/**
 * Error Utilities
 *
 * This module provides common error handling utilities used across
 * the Stargate V2 SDK.
 */

/**
 * Throws an error with the given message, optionally using a custom error constructor
 * @param message - The error message
 * @param error - Optional custom error constructor function
 * @throws The constructed error
 */
export const throwError = <Err extends Error>(message: string, error?: (message: string) => Err): never => {
    throw error?.(message) ?? new Error(message)
}
