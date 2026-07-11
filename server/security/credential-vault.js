import crypto from 'node:crypto';
import { AppError } from '../core/app-error.js';

function decodeKey(value){
  if(!value)return crypto.randomBytes(32);
  const base64=Buffer.from(value,'base64');if(base64.length===32)return base64;
  const hex=Buffer.from(value,'hex');if(hex.length===32)return hex;
  throw new Error('INTEGRATION_MASTER_KEY deve ser uma chave de 32 bytes em base64 ou hexadecimal.');
}

export class CredentialVault {
  constructor(masterKey,keyVersion='v1'){this.key=decodeKey(masterKey);this.keyVersion=keyVersion;}
  seal(payload,{homeId,provider}){
    const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(`${homeId}:${provider}:${this.keyVersion}`));
    const encrypted=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);
    return {ciphertext:encrypted.toString('base64'),iv:iv.toString('base64'),authTag:cipher.getAuthTag().toString('base64'),keyVersion:this.keyVersion};
  }
  open(record,{homeId,provider}){
    try{const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(record.iv,'base64'));decipher.setAAD(Buffer.from(`${homeId}:${provider}:${record.keyVersion}`));decipher.setAuthTag(Buffer.from(record.authTag,'base64'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(record.ciphertext,'base64')),decipher.final()]).toString('utf8'));}
    catch{throw new AppError('CREDENTIAL_DECRYPTION_FAILED','Não foi possível abrir as credenciais.',500);}
  }
}
