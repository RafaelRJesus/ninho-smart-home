import test from 'node:test';
import assert from 'node:assert/strict';
import { connectPostgres } from '../server/infrastructure/postgres.js';
import { PostgresIdentityStore } from '../server/infrastructure/postgres-identity-store.js';

test('PostgreSQL é opcional no ambiente local',async()=>{assert.equal(await connectPostgres(''),null);});

test('repositório PostgreSQL nunca retorna material cifrado na listagem',async()=>{
  const pool={query:async(sql)=>({rowCount:1,rows:[{id:'integration-1',home_id:'home-1',provider:'tuya',status:'configured',credential_key_version:'v2',encrypted_credentials:Buffer.from('secret'),credential_iv:Buffer.alloc(12),credential_auth_tag:Buffer.alloc(16),created_at:new Date(),updated_at:new Date()}]})};
  const store=new PostgresIdentityStore(pool);const listed=await store.listIntegrations('home-1');
  assert.equal(listed[0].provider,'tuya');assert.equal(listed[0].keyVersion,'v2');assert.equal(listed[0].encryptedCredentials,undefined);assert.equal(listed[0].credential_auth_tag,undefined);
});
