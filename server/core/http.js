import crypto from 'node:crypto';

export function requestContext(req, res, next) {
  const supplied = req.get('x-correlation-id');
  req.correlationId = supplied?.slice(0, 128) || crypto.randomUUID();
  res.set('x-correlation-id', req.correlationId);
  next();
}

export function notFoundHandler(req, res) {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.', correlationId: req.correlationId });
}

export function errorHandler(error, req, res, _next) {
  const status = Number(error.status) || 500;
  const body = {
    code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: status >= 500 && !error.code ? 'Erro interno do servidor.' : error.message,
    correlationId: req.correlationId
  };
  if (error.details && status < 500) body.details = error.details;
  res.status(status).json(body);
}
