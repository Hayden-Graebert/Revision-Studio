import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/generate.js';
import {generateReviewed} from '../server/generator.js';
const env={OPENAI_API_KEY:'test-only',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'secret-test',ALLOWED_USER_ID:'user-1'};
const body={topicId:'p-material',type:'recall',seed:'test-seed'};
const draft={prompt:'Define tensile stress and tensile strain.',steps:['Tensile stress is force divided by cross-sectional area.','Tensile strain is extension divided by original length.'],modelAnswer:'Stress = F/A; strain = extension/original length.',marks:2,minutes:2,objective:'Define stress and strain.'};
function res(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.data=v;return this;}};}
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data});
const completion=value=>response({status:'completed',usage:{input_tokens:100,output_tokens:50},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
test('API validates authentication and owner before spending',async()=>{
 let calls=0;const handler=createHandler({env,fetcher:async()=>{calls++;return response({id:'other-user'});},generate:async()=>{throw Error('Must not generate');}});
 let r=res();await handler({method:'POST',headers:{},body},r);assert.equal(r.code,401);assert.equal(calls,0);
 r=res();await handler({method:'POST',headers:{authorization:'Bearer x'},body},r);assert.equal(r.code,403);assert.equal(calls,1);
});
test('unconfigured, invalid body, quota exhaustion and unavailable protection fail closed',async()=>{
 let r=res();await createHandler({env:{}})({method:'POST',headers:{},body},r);assert.equal(r.code,503);
 for(const scenario of ['invalid','limit','unavailable']){
  const handler=createHandler({env,fetcher:async url=>url.endsWith('/user')?response({id:'user-1'}):scenario==='unavailable'?response({},500):response({allowed:false,reason:'daily_limit'}),generate:async()=>{throw Error('Must not generate');}});
  r=res();await handler({method:'POST',headers:{authorization:'Bearer x'},body:scenario==='invalid'?{...body,type:'constructor'}:body},r);assert.equal(r.code,scenario==='invalid'?400:scenario==='limit'?429:503);
 }
});
test('generation and review use schemas; rejected or malformed questions never pass',async()=>{
 let calls=[];
 const fetcher=async(_url,options)=>{calls.push(JSON.parse(options.body));return completion(calls.length===1?draft:{approved:true,reason:'Valid.'});};
 const q=await generateReviewed(body,env,fetcher);assert.equal(q.type,'recall');assert.equal(q.engine,'ai');assert.equal(calls.length,2);assert.ok(calls.every(c=>c.store===false&&c.text.format.strict===true));assert.equal(calls[0].max_output_tokens,3500);
 let index=0;await assert.rejects(()=>generateReviewed(body,env,async()=>completion(++index===1?draft:{approved:false,reason:'Incorrect.'})),/did not pass review/);
 await assert.rejects(()=>generateReviewed(body,env,async()=>completion({...draft,marks:6})),/format or marks/);
 await assert.rejects(()=>generateReviewed(body,env,async()=>response({status:'incomplete',output:[]})),/incomplete/);
});
test('endpoint reserves allowance before AI and records both calls token usage',async()=>{
 const calls=[];let ai=0;
 const fetcher=async(url,opts)=>{
  calls.push(url);
  if(url.endsWith('/user'))return response({id:'user-1'});
  if(url.endsWith('/reserve_generation')){assert.equal(JSON.parse(opts.body).p_limit,30);return response({allowed:true,requests:1,day:'2026-10-11'});}
  if(url.endsWith('/record_generation_usage')){assert.equal(JSON.parse(opts.body).p_input,200);return response({recorded:true});}
  return completion(++ai===1?draft:{approved:true,reason:'Valid.'});
 };
 const r=res();await createHandler({env,fetcher})({method:'POST',headers:{authorization:'Bearer x'},body},r);
 assert.equal(r.code,200);assert.equal(r.data.usage.output,100);assert.equal(calls[1].endsWith('/reserve_generation'),true);assert.equal(r.headers['Cache-Control'],'no-store');
 assert.equal(JSON.stringify(r.data).includes(env.OPENAI_API_KEY),false);
});
test('provider failures consume a reserved request and return no draft or secrets',async()=>{
 const calls=[];const fetcher=async url=>{calls.push(url);if(url.endsWith('/user'))return response({id:'user-1'});if(url.endsWith('/reserve_generation'))return response({allowed:true,requests:1,day:'2026-10-11'});if(url.endsWith('/record_generation_usage'))return response({recorded:true});return response({error:'sensitive internal message'},500);};
 const r=res();await createHandler({env,fetcher})({method:'POST',headers:{authorization:'Bearer x'},body},r);assert.equal(r.code,502);assert.equal(r.data.question,undefined);assert.equal(JSON.stringify(r.data).includes('sensitive'),false);assert.ok(calls.some(u=>u.endsWith('/record_generation_usage')));
});
