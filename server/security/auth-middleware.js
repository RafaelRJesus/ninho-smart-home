import { AppError } from '../core/app-error.js';

export function authenticate(tokens,identity) {
  return async (req,_res,next) => {
    try {
      const [scheme,token] = String(req.get('authorization')||'').split(' ');
      const cookies=Object.fromEntries(String(req.get('cookie')||'').split(';').map(item=>item.trim().split('=').map(decodeURIComponent)).filter(pair=>pair.length===2));
      const access=scheme==='Bearer'&&token?token:cookies.ninho_access;
      if (!access) throw new AppError('AUTHENTICATION_REQUIRED','Autenticação obrigatória.',401);
      req.auth=tokens.verify(access,'access');
      if(identity&&await identity.getSessionVersion(req.auth.sub)!==req.auth.ver)throw new AppError('INVALID_SESSION','Sessão inválida.',401);
      next();
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
