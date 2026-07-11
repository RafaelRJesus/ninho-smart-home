import { AppError } from '../core/app-error.js';
import { isIP } from 'node:net';
import { TuyaClient } from '../tuya-client.js';
import { TuyaProvider } from './tuya/tuya-provider.js';
import { HomeAssistantProvider } from './home-assistant/home-assistant-provider.js';
import { withResilience } from './resilience.js';

const required=(value,label)=>{const clean=String(value||'').trim();if(!clean)throw new AppError('INVALID_INTEGRATION_CREDENTIALS',`${label} é obrigatório.`,400);return clean;};

export function createProvider(provider,credentials,integrationId){
  let adapter;
  if(provider==='tuya'){
    const region=required(credentials.region,'Região').toLowerCase();
    if(!['us','eu','in','cn'].includes(region))throw new AppError('INVALID_INTEGRATION_CREDENTIALS','Região Tuya inválida.',400);
    adapter=new TuyaProvider({client:new TuyaClient({accessId:required(credentials.accessId,'Access ID'),accessSecret:required(credentials.accessSecret,'Access Secret'),region}),integrationId});
  }else if(provider==='home-assistant'){
    const baseUrl=required(credentials.baseUrl,'URL do Home Assistant');
    let parsed;try{parsed=new URL(baseUrl);}catch{throw new AppError('INVALID_INTEGRATION_CREDENTIALS','URL do Home Assistant inválida.',400);}
    if(parsed.protocol!=='https:'||isIP(parsed.hostname)||parsed.hostname==='localhost'||parsed.hostname.endsWith('.local'))throw new AppError('INVALID_INTEGRATION_CREDENTIALS','Use uma URL HTTPS pública do Home Assistant.',400);
    adapter=new HomeAssistantProvider({baseUrl,token:required(credentials.token,'Token do Home Assistant'),integrationId});
  }else throw new AppError('INTEGRATION_NOT_SUPPORTED','Provedor não suportado.',400);
  return withResilience(adapter,{timeoutMs:provider==='tuya'?8000:5000,retries:2});
}
