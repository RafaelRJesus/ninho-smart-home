import crypto from 'node:crypto';

export function securityHeaders(req,res,next){
  res.set({
    'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
    'Permissions-Policy':'camera=(), geolocation=(), payment=()',
    'Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'"
  });
  if(process.env.NODE_ENV==='production')res.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  next();
}

export function requireHttps(req,res,next){
  if(req.path.startsWith('/api/health')||process.env.NODE_ENV!=='production'||process.env.REQUIRE_HTTPS==='false'||req.secure)return next();
  return res.status(426).json({code:'HTTPS_REQUIRED',message:'HTTPS é obrigatório.',correlationId:req.correlationId});
}

export function rateLimit({windowMs=60000,max=60}={}){
  const clients=new Map();
  return (req,res,next)=>{const now=Date.now();const key=req.ip||'unknown';let entry=clients.get(key);if(!entry||entry.resetAt<=now){entry={count:0,resetAt:now+windowMs};clients.set(key,entry);}entry.count++;res.set('RateLimit-Limit',String(max));res.set('RateLimit-Remaining',String(Math.max(0,max-entry.count)));if(entry.count>max)return res.status(429).json({code:'RATE_LIMITED',message:'Muitas solicitações. Tente novamente em instantes.',correlationId:req.correlationId});next();};
}

export function requireCriticalPin(req,res,next){
  const expected=process.env.CRITICAL_ACTION_PIN_SHA256;if(!expected)return next();
  const supplied=crypto.createHash('sha256').update(String(req.get('x-action-pin')||'')).digest('hex');
  const valid=expected.length===supplied.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(supplied));
  if(!valid)return res.status(403).json({code:'ACTION_PIN_REQUIRED',message:'PIN de ação crítica inválido.',correlationId:req.correlationId});next();
}
