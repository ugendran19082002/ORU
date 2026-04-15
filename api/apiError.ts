/**
 * Typed API error that wraps backend and network failures.
 * Throw this from API modules so callers can distinguish error types.
 *
 * Usage:
 *   throw new ApiError('SHOP_NOT_FOUND', 404, 'Shop not found');
 *
 *   catch (err) {
 *     if (err instanceof ApiError && err.status === 404) { ... }
 *   }
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintain proper prototype chain in transpiled output
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static from(err: unknown, fallbackMessage = 'Request failed'): ApiError {
    if (err instanceof ApiError) return err;

    const axiosErr = err as {
      response?: { status?: number; data?: { message?: string; code?: string } };
      message?: string;
    };

    const status = axiosErr.response?.status ?? 0;
    const message = axiosErr.response?.data?.message ?? axiosErr.message ?? fallbackMessage;
    const code = axiosErr.response?.data?.code ?? 'UNKNOWN';

    return new ApiError(code, status, message, err);
  }
}
