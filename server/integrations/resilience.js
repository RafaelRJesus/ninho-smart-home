import { AppError } from '../core/app-error.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export class CircuitBreaker {
  constructor({failureThreshold=3,resetTimeoutMs=30000}={}){this.failureThreshold=failureThreshold;this.resetTimeoutMs=resetTimeoutMs;this.failures=0;this.openedAt=0;}
  get state(){if(!this.openedAt)return 'closed';if(Date.now()-this.openedAt>=this.resetTimeoutMs)return 'half-open';return 'open';}
  assertAvailable(){if(this.state==='open')throw new AppError('CIRCUIT_OPEN','Integração temporariamente indisponível.',503);}
  success(){this.failures=0;this.openedAt=0;}
  failure(){this.failures+=1;if(this.failures>=this.failureThreshold)this.openedAt=Date.now();}
}

export async function resilientCall(operation,{timeoutMs=8000,retries=2,baseDelayMs=150,breaker=new CircuitBreaker()}={}){
  breaker.assertAvailable();let lastError;
  for(let attempt=0;attempt<=retries;attempt+=1){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{const result=await Promise.race([operation({signal:controller.signal,attempt}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Object.assign(new Error('Timeout'),{name:'AbortError'})),{once:true}))]);clearTimeout(timer);breaker.success();return result}
    catch(error){clearTimeout(timer);lastError=error;if(attempt<retries)await delay(baseDelayMs*2**attempt)}
  }
  breaker.failure();
  if(lastError?.name==='AbortError')throw new AppError('PROVIDER_TIMEOUT','A integração excedeu o tempo limite.',504);
  throw lastError;
}

export function withResilience(provider,options={}){
  const breaker=options.breaker||new CircuitBreaker(options);
  const resilientMethods=new Set(['connect','listDevices','getDeviceState','sendCommand','refreshCredentials','healthCheck']);
  return new Proxy(provider,{get(target,property){const value=target[property];if(typeof value!=='function')return value;if(!resilientMethods.has(property))return value.bind(target);return (...args)=>resilientCall(()=>value.apply(target,args),{...options,breaker})}});
}
