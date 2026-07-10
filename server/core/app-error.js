export class AppError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const errors = {
  validation: (message, details) => new AppError('VALIDATION_ERROR', message, 400, details),
  notFound: (resource) => new AppError('NOT_FOUND', `${resource} não encontrado.`, 404),
  conflict: (message) => new AppError('CONFLICT', message, 409),
  provider: (provider, message) => new AppError('PROVIDER_UNAVAILABLE', message, 502, { provider })
};
