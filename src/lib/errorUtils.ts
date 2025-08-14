export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function logError(error: unknown, context?: string): void {
  const message = handleError(error);
  console.error(`${context ? `[${context}] ` : ''}Error:`, message);
}

export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  );
}