import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV='test';
process.env.TUYA_ACCESS_ID='';
process.env.TUYA_ACCESS_SECRET='';
const {app}=await import('../server/index.js');
const agent=request.agent(app);
const registration=await agent.post('/api/v1/auth/register').send({email:'api-tests@ninho.local',password:'senha-de-teste-segura',displayName:'Teste API'});
after(()=>{});

test('health público e API v1 protegida respondem',async()=>{
  const health=await request(app).get('/api/health');
  const protectedRoute=await request(app).get('/api/v1/homes');
  assert.equal(health.body.ok,true);assert.equal(protectedRoute.status,401);assert.equal(protectedRoute.body.code,'AUTHENTICATION_REQUIRED');
});

test('versão pública identifica release, ambiente e build sem expor configuração',async()=>{
  const response=await request(app).get('/api/version');
  assert.equal(response.status,200);
  assert.match(response.body.version,/^\d+\.\d+\.\d+$/);
  assert.equal(response.body.environment,'test');
  assert.ok(['name','version','environment','commit','builtAt'].every(key=>Object.hasOwn(response.body,key)));
  assert.equal(response.body.AUTH_SECRET,undefined);
});

test('sessão usa cookies HttpOnly e não devolve token ao JavaScript',()=>{
  assert.equal(registration.body.accessToken,undefined);
  const cookies=registration.headers['set-cookie'];
  assert.ok(cookies.some(value=>value.startsWith('ninho_access=')&&value.includes('HttpOnly')));
  assert.ok(cookies.some(value=>value.startsWith('ninho_refresh=')&&value.includes('HttpOnly')));
});

test('cofre persiste apenas credencial cifrada e respeita RBAC',async()=>{
  const home=await agent.post('/api/v1/homes').send({name:'Casa do cofre'});
  const saved=await agent.put(`/api/v1/homes/${home.body.id}/integrations/tuya/credentials`).send({credentials:{accessId:'id-confidencial',accessSecret:'segredo-que-nao-pode-vazar',region:'us'}});
  assert.equal(saved.status,200);assert.equal(saved.body.provider,'tuya');assert.equal(saved.body.accessSecret,undefined);
  const listed=await agent.get(`/api/v1/homes/${home.body.id}/integrations`);
  assert.equal(listed.body[0].status,'configured');assert.equal(JSON.stringify(listed.body).includes('segredo-que-nao-pode-vazar'),false);
});

test('rotas legadas foram removidas após a janela de compatibilidade',async()=>{
  for(const path of ['/api/devices','/api/rooms','/api/scenes','/api/automations','/api/energy','/api/assistant'])assert.equal((await agent.get(path)).status,404,path);
});

test('recuperação responde de forma indistinguível para e-mail existente ou ausente',async()=>{
  const known=await request(app).post('/api/v1/auth/password/forgot').send({email:'api-tests@ninho.local'});
  const unknown=await request(app).post('/api/v1/auth/password/forgot').send({email:'ausente@ninho.local'});
  assert.equal(known.status,202);assert.equal(unknown.status,202);assert.equal(known.body.message,unknown.body.message);
});
