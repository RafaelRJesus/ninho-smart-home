const secretPattern=/authorization|cookie|token|secret|password|pin|api[_-]?key/i;
export const redact=value=>Object.fromEntries(Object.entries(value||{}).map(([key,item])=>[key,secretPattern.test(key)?'[REDACTED]':item]));

export class Metrics {
  constructor(){this.startedAt=Date.now();this.requests=0;this.errors=0;this.latencyMs=0;this.byStatus=new Map();}
  middleware(){return(req,res,next)=>{const start=performance.now();res.on('finish',()=>{const elapsed=performance.now()-start;this.requests++;this.latencyMs+=elapsed;if(res.statusCode>=500)this.errors++;this.byStatus.set(res.statusCode,(this.byStatus.get(res.statusCode)||0)+1);const entry={level:res.statusCode>=500?'error':'info',event:'http.request',method:req.method,path:req.route?.path||req.path,status:res.statusCode,durationMs:Number(elapsed.toFixed(2)),correlationId:req.correlationId};if(process.env.NODE_ENV!=='test')process.stdout.write(`${JSON.stringify(entry)}\n`);});next();};}
  snapshot(){return{uptimeSeconds:Math.floor((Date.now()-this.startedAt)/1000),requests:this.requests,errors:this.errors,errorRate:this.requests?this.errors/this.requests:0,averageLatencyMs:this.requests?Number((this.latencyMs/this.requests).toFixed(2)):0,statuses:Object.fromEntries(this.byStatus)};}
}

export function metricsAuthorization(req,res,next){const expected=process.env.METRICS_TOKEN;if(!expected||req.get('authorization')===`Bearer ${expected}`)return next();res.status(401).json({code:'UNAUTHORIZED',message:'Token de métricas inválido.',correlationId:req.correlationId});}
