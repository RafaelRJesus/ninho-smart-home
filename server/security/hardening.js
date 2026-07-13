import crypto from 'node:crypto';
import expressRateLimit from 'express-rate-limit';

export function securityHeaders(req,res,next){
  res.set({
    'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
    'Permissions-Policy':'camera=(), geolocation=(), payment=()',
    'Content-Security-Policy':"default-src 'self'; connect-src 'self' https://challenges.cloudflare.com ws: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'"
  });
  if(process.env.NODE_ENV==='production')res.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  next();
}

export function requireHttps(req,res,next){
  if(req.path.startsWith('/api/health')||process.env.NODE_ENV!=='production'||process.env.REQUIRE_HTTPS==='false'||req.secure)return next();
  return res.status(426).json({code:'HTTPS_REQUIRED',message:'HTTPS é obrigatório.',correlationId:req.correlationId});
}

export function rateLimit({windowMs=60000,max=60}={}){
  return expressRateLimit({
    windowMs,
    limit:max,
    standardHeaders:'draft-7',
    legacyHeaders:false,
    handler:(req,res)=>res.status(429).json({code:'RATE_LIMITED',message:'Muitas solicitações. Tente novamente em instantes.',correlationId:req.correlationId}),
  });
}

export function requireCriticalPin(req,res,next){
  const valid=criticalPinValid(req);
  if(!valid)return res.status(403).json({code:'ACTION_PIN_REQUIRED',message:'PIN de ação crítica inválido.',correlationId:req.correlationId});next();
}

export function criticalPinValid(req){
  const expected=process.env.CRITICAL_ACTION_PIN_SHA256;if(!expected)return true;
  const supplied=crypto.createHash('sha256').update(String(req.get('x-action-pin')||'')).digest('hex');
  return expected.length===supplied.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(supplied));
}
