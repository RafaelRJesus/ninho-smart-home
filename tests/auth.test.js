import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenService } from '../server/security/token-service.js';
import { MemoryIdentityStore } from '../server/infrastructure/memory-identity-store.js';
import { AuthService } from '../server/application/auth-service.js';

const setup=()=>{const identity=new MemoryIdentityStore();const tokens=new TokenService('a'.repeat(64));return {identity,tokens,auth:new AuthService({identity,tokens})}};

test('cadastro protege senha e emite sessão curta',async()=>{const {identity,tokens,auth}=setup();const result=await auth.register({email:'Pessoa@Exemplo.com',password:'senha-muito-segura',displayName:'Pessoa'});assert.equal(result.user.email,'pessoa@exemplo.com');assert.equal(result.expiresIn,900);assert.equal(tokens.verify(result.accessToken).sub,result.user.id);assert.equal(identity.users.get(result.user.id).password,undefined);assert.notEqual(identity.users.get(result.user.id).passwordHash,'senha-muito-segura')});

test('login inválido não revela qual campo falhou',async()=>{const {auth}=setup();await assert.rejects(()=>auth.login('x@x.com','incorreta'),error=>error.code==='INVALID_CREDENTIALS'&&error.status===401)});

test('refresh é rotativo e não pode ser reutilizado',async()=>{const {auth}=setup();const registered=await auth.register({email:'a@b.com',password:'senha-muito-segura',displayName:'A'});await auth.refresh(registered.refreshToken);await assert.rejects(()=>auth.refresh(registered.refreshToken),error=>error.code==='INVALID_SESSION')});

test('RBAC segrega residências, pisos e cômodos',async()=>{const {identity,auth}=setup();const owner=(await auth.register({email:'owner@x.com',password:'senha-muito-segura',displayName:'Owner'})).user;const stranger=(await auth.register({email:'other@x.com',password:'senha-muito-segura',displayName:'Other'})).user;const home=await identity.createHome({name:'Casa',ownerId:owner.id});assert.equal(await identity.getRole(home.id,owner.id),'owner');assert.equal(await identity.getRole(home.id,stranger.id),null);const floor=await identity.createFloor({homeId:home.id,name:'Térreo',position:0});assert.ok(floor);assert.equal(await identity.createFloor({homeId:home.id,name:'térreo',position:1}),null);assert.ok(await identity.createRoom({floorId:floor.id,name:'Sala',position:0}));assert.equal(await identity.createRoom({floorId:floor.id,name:'sala',position:1}),null)});
