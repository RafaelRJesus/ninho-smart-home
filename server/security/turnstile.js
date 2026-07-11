import crypto from 'node:crypto';
import { AppError } from '../core/app-error.js';

const endpoint='https://challenges.cloudflare.com/turnstile/v0/siteverify';
export class TurnstileVerifier {
  constructor({secretKey=process.env.TURNSTILE_SECRET_KEY,siteKey=process.env.TURNSTILE_SITE_KEY,required=process.env.TURNSTILE_REQUIRED==='true',hostname=process.env.TURNSTILE_HOSTNAME,fetcher=fetch,timeoutMs=5000}={}){this.secretKey=secretKey;this.siteKey=siteKey;this.required=required;this.hostname=hostname;this.fetcher=fetcher;this.timeoutMs=timeoutMs;}
  publicConfig(){return {enabled:this.required,siteKey:this.required?this.siteKey:null};}
  async verify(token,{ip,action}={}){
    if(!this.required)return {success:true,bypassed:true};
    if(!this.secretKey||!this.siteKey)throw new AppError('CAPTCHA_NOT_CONFIGURED','Proteção anti-bot indisponível.',503);
    if(!token||String(token).length>2048)throw new AppError('CAPTCHA_REQUIRED','Confirme que você não é um robô.',400);
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{const response=await this.fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:this.secretKey,response:String(token),remoteip:ip,idempotency_key:crypto.randomUUID()}),signal:controller.signal});if(!response.ok)throw new Error(`Siteverify ${response.status}`);const result=await response.json();const valid=result.success&&(!this.hostname||result.hostname===this.hostname)&&(!action||!result.action||result.action===action);if(!valid)throw new AppError('CAPTCHA_INVALID','Verificação anti-bot inválida ou expirada.',400);return result;}catch(error){if(error instanceof AppError)throw error;throw new AppError('CAPTCHA_UNAVAILABLE','Não foi possível validar a proteção anti-bot.',503);}finally{clearTimeout(timer);}
  }
  middleware(action){return async(req,_res,next)=>{try{await this.verify(req.body?.turnstileToken,{ip:req.ip,action});next();}catch(error){next(error)}};}
}
