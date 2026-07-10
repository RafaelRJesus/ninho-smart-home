import { assertDeviceProvider } from './device-provider.js';

export class ProviderRegistry {
  constructor(){this.providers=new Map();}
  register(id,provider){if(this.providers.has(id))throw new Error(`Integração duplicada: ${id}`);this.providers.set(id,assertDeviceProvider(provider));return provider;}
  get(id){return this.providers.get(id)||null;}
  list(){return [...this.providers.entries()].map(([id,provider])=>({id,provider}));}
  async health(){return Object.fromEntries(await Promise.all(this.list().map(async({id,provider})=>{try{return [id,await provider.healthCheck()]}catch(error){return [id,{status:'down',message:error.message}]}})))}
}
