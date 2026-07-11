import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

export async function connectPostgres(url=process.env.DATABASE_URL){
  if(!url)return null;
  const pool=new pg.Pool({connectionString:url,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false},max:Number(process.env.DATABASE_POOL_SIZE||5),idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
  await pool.query('SELECT 1');
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const name='0001_initial.sql';const applied=await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name]);
  if(!applied.rowCount){const sql=await fs.readFile(path.resolve('database/migrations',name),'utf8');const client=await pool.connect();try{await client.query(sql);await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);}finally{client.release();}}
  return pool;
}
