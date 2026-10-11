import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,QUESTIONS} from '../public/data.js';
import {initialState,normaliseState,toggleFavourite,finishQuestion,dayKey} from '../public/model.js';
import {localQuestion,supportedLocal,validateGenerated,duePlan,nextType,sessionPlan,QUESTION_TYPES} from '../public/generation.js';
import {templateTopics} from '../public/templates.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
test('every local type obeys marks bounds; 100 seeds per supported topic stay finite',()=>{
 for(const topic of TOPICS)for(const type of Object.keys(QUESTION_TYPES))if(supportedLocal(topic.id,type))for(let i=0;i<100;i++){
  const q=localQuestion(topic.id,type,'seed-'+i);validateGenerated(q,topic.id,type);assert.doesNotMatch(q.prompt+q.steps.join(' '),/NaN|undefined|Infinity/);
  for(const value of Object.values(q.answers||{}))assert.ok(Number.isFinite(value));
  if(type==='calculation'){const marks=[...q.prompt.matchAll(/\[(\d+)\]/g)].reduce((n,m)=>n+Number(m[1]),0);assert.equal(marks,q.marks);}
 }
});
test('physical invariants and independent numerical checks across 200 variants',()=>{
 for(let i=0;i<200;i++){
  const motion=localQuestion('p-motion','calculation','v'+i),{u,a,t,b}=motion.parameters,x=motion.answers;
  near(x.s,(u+x.v)*t/2);near(x.d,x.v*x.stop/2);near(x.v-b*x.stop,0);
  const col=localQuestion('f-fm1','calculation','v'+i),p=col.parameters,z=col.answers;
  near(p.m1*z.v1+p.m2*z.v2,p.m1*p.u);near(z.v2-z.v1,p.e*p.u);assert.ok(z.loss>=0);
  const force=localQuestion('p-force','calculation','v'+i);near(force.answers.netWork,force.answers.deltaKE);
  const titration=localQuestion('c-5','calculation','v'+i);assert.ok(titration.answers.purity>0&&titration.answers.purity<=100);
  near(titration.answers.carbonate*2/10,titration.parameters.c*titration.parameters.titre/1000);
  const acid=localQuestion('c-12','calculation','v'+i);assert.ok(acid.answers.pH2>acid.answers.pH);assert.ok(acid.answers.h2/(acid.parameters.c/acid.parameters.factor)<.05);
  const stats=localQuestion('f-fs2','calculation','v'+i);near(stats.answers.variance,stats.answers.EX2-stats.answers.E**2);
  const circuit=localQuestion('p-circuit','calculation','v'+i);near(circuit.answers.useful+circuit.answers.loss,circuit.parameters.emf*circuit.answers.I);
 }
});
test('seeds reproduce template data; fresh seeds create variety',()=>{
 for(const topic of templateTopics){const first=localQuestion(topic,'calculation','a');assert.equal(first.prompt,localQuestion(topic,'calculation','a').prompt);assert.ok(new Set(Array.from({length:10},(_,i)=>localQuestion(topic,'calculation','seed'+i).prompt)).size>1);}
});
test('scheduler balances subjects, respects locks, cadence and chosen types',()=>{
 const s=initialState();s.unlocked=['m-diff','p-material','c-12','f-fm1'];s.settings.fmOptions=['FM1'];s.settings.questionTypes=['explanation'];
 const plan=duePlan(s);assert.equal(plan.length,4);assert.ok(plan.every(i=>i.type==='explanation'));assert.equal(sessionPlan(s,plan).length,4);
 s.attempts.push({topicId:'c-12',at:new Date().toISOString(),score:1,max:2});assert.equal(duePlan(s).length,3);
 s.settings.fmOptions=[];assert.equal(duePlan(s).length,2);
});
test('science type cycles cover all types; maths favours calculations',()=>{
 const science=TOPICS.find(t=>t.id==='p-material'),maths=TOPICS.find(t=>t.id==='m-diff'),s=initialState();
 assert.equal(new Set([0,1,2].map(i=>nextType(s,science,i))).size,3);
 assert.equal([0,1,2,3].map(i=>nextType(s,maths,i)).filter(t=>t==='calculation').length,2);
});
test('migration retains old errors and custom questions without retaining correct starters',()=>{
 const old={schema:1,attempts:[{questionId:'m01',score:1,max:2,at:'2026-10-10T12:00:00Z'},{questionId:'m02',score:2,max:2,at:'2026-10-10T12:00:00Z'}],customQuestions:[{...QUESTIONS[0],id:'custom-1'}]};
 const s=normaliseState(old);assert.deepEqual(s.savedQuestions.map(q=>q.id),['custom-1','m01']);assert.deepEqual(s.favouriteIds,['custom-1']);assert.equal(s.schema,2);assert.deepEqual(normaliseState(s),s);
});
test('retention respects independent error and favourite status',()=>{
 const s=initialState(),q=localQuestion('p-material','recall','retention');toggleFavourite(s,q);
 s.session={plan:[{}],index:0,current:q,results:[]};finishQuestion(s,{questionId:q.id,score:0,max:q.marks,at:'2026-10-11T12:00:00Z'});
 toggleFavourite(s,q);assert.equal(s.savedQuestions.length,1);
 s.session={plan:[{}],index:0,current:q,results:[]};finishQuestion(s,{questionId:q.id,score:q.marks,max:q.marks,at:'2026-10-11T13:00:00Z'});assert.equal(s.savedQuestions.length,0);assert.equal(s.session,null);
});
