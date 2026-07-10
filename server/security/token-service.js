import crypto from 'node:crypto';
import { AppError } from '../core/app-error.js';

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

export class TokenService {
  constructor(secret, issuer = 'ninho-api') {
    if (!secret || secret.length < 32) throw new Error('AUTH_SECRET deve possuir pelo menos 32 caracteres.');
    this.secret = secret; this.issuer = issuer;
  }
  sign(payload, expiresInSeconds, type = 'access') {
    const now = Math.floor(Date.now()/1000);
    const header = encode({alg:'HS256',typ:'JWT'});
    const body = encode({...payload,iss:this.issuer,type,iat:now,exp:now+expiresInSeconds,jti:crypto.randomUUID()});
    const signature = crypto.createHmac('sha256',this.secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }
  verify(token, expectedType = 'access') {
    const [header,body,signature] = String(token||'').split('.');
    if (!header||!body||!signature) throw new AppError('INVALID_SESSION','Sessão inválida.',401);
    const expected = crypto.createHmac('sha256',this.secret).update(`${header}.${body}`).digest();
    const received = Buffer.from(signature,'base64url');
    if (expected.length!==received.length||!crypto.timingSafeEqual(expected,received)) throw new AppError('INVALID_SESSION','Sessão inválida.',401);
    const payload = JSON.parse(Buffer.from(body,'base64url').toString());
    if (payload.iss!==this.issuer||payload.type!==expectedType||payload.exp<=Math.floor(Date.now()/1000)) throw new AppError('EXPIRED_SESSION','Sessão expirada.',401);
    return payload;
  }
}
