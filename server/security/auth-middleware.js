import { AppError } from '../core/app-error.js';

export function authenticate(tokens) {
  return (req,_res,next) => {
    try {
      const [scheme,token] = String(req.get('authorization')||'').split(' ');
      if (scheme!=='Bearer'||!token) throw new AppError('AUTHENTICATION_REQUIRED','Autenticação obrigatória.',401);
      req.auth=tokens.verify(token,'access'); next();
    } catch(error){next(error)}
  };
}

export function authorizeHome(identity, allowedRoles = ['owner','admin','resident','guest']) {
  return async (req,_res,next) => {
    try {
      const role=await identity.getRole(req.params.homeId,req.auth.sub);
      if (!role||!allowedRoles.includes(role)) throw new AppError('FORBIDDEN','Você não possui acesso a esta residência.',403);
      req.homeRole=role; next();
    } catch(error){next(error)}
  };
}
