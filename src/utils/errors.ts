export class MikrotikApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number = 502, details?: unknown) {
    super(message);
    this.name = 'MikrotikApiError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, MikrotikApiError.prototype);
  }
}

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
