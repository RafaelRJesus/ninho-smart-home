import test from 'node:test';
import assert from 'node:assert/strict';
import { CredentialVault } from '../server/security/credential-vault.js';

const key=Buffer.alloc(32,7).toString('base64');
test('cofre cifra e autentica credenciais por residência',()=>{const vault=new CredentialVault(key);const credentials={accessId:'client-id',accessSecret:'super-secret',region:'us'};const sealed=vault.seal(credentials,{homeId:'home-a',provider:'tuya'});assert.ok(!JSON.stringify(sealed).includes('super-secret'));assert.deepEqual(vault.open(sealed,{homeId:'home-a',provider:'tuya'}),credentials);});
test('cofre rejeita adulteração e uso em outra residência',()=>{const vault=new CredentialVault(key);const sealed=vault.seal({token:'secret'},{homeId:'home-a',provider:'tuya'});assert.throws(()=>vault.open(sealed,{homeId:'home-b',provider:'tuya'}),error=>error.code==='CREDENTIAL_DECRYPTION_FAILED');sealed.ciphertext=`A${sealed.ciphertext.slice(1)}`;assert.throws(()=>vault.open(sealed,{homeId:'home-a',provider:'tuya'}));});
