import test from 'node:test';
import assert from 'node:assert/strict';
import {library,buildExtended} from '../public/template-library.js';
import {TOPICS} from '../public/data.js';
import {localQuestion,coverage,rng,validateGenerated,duePlan,nextType} from '../public/generation.js';
import {initialState,normaliseState} from '../public/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
test('every added structure: 250 variants, valid marks, finite numbers and repeatable seeds',()=>{
 for(const entry of library){
  assert.ok(entry.topics.every(id=>TOPICS.some(t=>t.id===id)));
  const prompts=new Set();
  for(let i=0;i<250;i++){
   const q=buildExtended(entry,rng('case'+i));prompts.add(q.prompt);
   validateGenerated({...q,marks:q.steps.length,minutes:14,topicId:entry.topics[0],type:'calculation'},entry.topics[0],'calculation');
   for(const value of Object.values(q.answers))assert.ok(Number.isFinite(value),entry.id);
   assert.doesNotMatch(q.prompt+q.steps.join(' '),/NaN|undefined|Infinity/);
   assert.equal(q.prompt,buildExtended(entry,rng('case'+i)).prompt);
  }
  assert.ok(prompts.size>2,entry.id);
 }
});
test('every conceptual prompt and all topic structures are selectable and valid',()=>{
 for(const topic of TOPICS)for(const [type,count] of Object.entries(coverage(topic.id))){
  const ids=new Set();for(let v=0;v<count;v++){const q=localQuestion(topic.id,type,'variants',v);validateGenerated(q,topic.id,type);ids.add(q.templateId);}
  assert.equal(ids.size,count,topic.id+' '+type);
 }
});
test('all user subject groups have practice; unsupported selections are excluded',()=>{
 const s=initialState();s.settings.fmOptions=['FM1','FM2','FS1','FS2'];
 const topics=TOPICS.filter(t=>!t.option||s.settings.fmOptions.includes(t.option));s.unlocked=topics.map(t=>t.id);
 assert.equal(duePlan(s).length,topics.length);
 s.settings.questionTypes=['calculation'];assert.ok(duePlan(s).every(i=>coverage(i.topicId).calculation>0));
 assert.equal(nextType(s,TOPICS.find(t=>t.id==='p-endorsement')),null);
 assert.equal(normaliseState({...s,settings:{...s.settings,generationMode:'combined'}}).settings.generationMode,'builtin');
});
test('independent numerical identities for new models across 200 seeds',()=>{
 for(let i=0;i<200;i++)for(const e of library){
  const {parameters:p,answers:a}=buildExtended(e,rng('verify'+i));
  switch(e.id){
   case 'quadratic-design':near((p.a-a.h)**2+a.k,0);near((p.b-a.h)**2+a.k,0);break;
   case 'matrix-system':assert.ok(a.det>0);near((p.a*p.x+p.y)*p.d-(p.x+p.d*p.y),a.det*p.x);break;
   case 'projectile':near(p.uy*a.T-p.g*a.T**2/2,0);near(a.range/p.ux,a.T);break;
   case 'satellite':near(a.v*a.v/a.radius,p.G*p.M/a.radius**2);break;
   case 'charged-particle':near(p.m*a.v*a.v/(2*p.e*p.V),1);near(p.m*a.v/(a.radius*p.e*p.B),1);break;
   case 'combustion-analysis':near(a.co2+a.water,p.amount*a.Mr+(p.c+p.h/4)*p.amount*32);break;
   case 'buffer-calculation':assert.ok(a.after<a.pH);assert.ok(p.salt>p.added);break;
   case 'binomial-model':assert.ok(a.prob>=0&&a.prob<=1);assert.ok(a.variance<a.mean);break;
   case 'binomial-test':assert.ok(a.pval>=0&&a.pval<=1);break;
   case 'ultrasound':near(a.depth*2/p.speed,p.time*1e-6);assert.ok(a.fraction>0&&a.fraction<1);break;
   case 'calorimetry':near(-a.enthalpy*p.mol*1000,p.mass*p.c*p.rise);break;
  }
 }
});
