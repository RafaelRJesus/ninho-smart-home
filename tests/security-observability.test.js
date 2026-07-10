import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { rateLimit, securityHeaders } from '../server/security/hardening.js';
import { Metrics, redact } from '../server/core/observability.js';

test('mascara campos sensíveis em dados estruturados',()=>{
  assert.deepEqual(redact({user:'rafael',authorization:'Bearer secret',apiKey:'abc'}),{user:'rafael',authorization:'[REDACTED]',apiKey:'[REDACTED]'});
});

test('adiciona cabeçalhos de segurança e limita abuso',async()=>{
  const app=express();app.use(securityHeaders);app.use(rateLimit({windowMs:60000,max:1}));app.get('/test',(_,res)=>res.json({ok:true}));
  const first=await request(app).get('/test');const blocked=await request(app).get('/test');
  assert.equal(first.headers['x-content-type-options'],'nosniff');assert.match(first.headers['content-security-policy'],/frame-ancestors 'none'/);assert.equal(blocked.status,429);
});

test('métricas calculam disponibilidade e latência sem dados de requisição',async()=>{
  const metrics=new Metrics();const app=express();app.use(metrics.middleware());app.get('/ok',(_,res)=>res.json({ok:true}));app.get('/fail',(_,res)=>res.status(500).end());
  await request(app).get('/ok');await request(app).get('/fail');const snapshot=metrics.snapshot();
  assert.equal(snapshot.requests,2);assert.equal(snapshot.errors,1);assert.equal(snapshot.errorRate,.5);assert.ok(snapshot.averageLatencyMs>=0);
});
