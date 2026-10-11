import {TOPICS, SUBJECTS} from './data.js';
import {dayKey, daysBetween, isTopicEligible, performance} from './model.js';
import {makeTemplate, templateTopics} from './templates.js';
import {localConcepts} from './concepts.js';
export const QUESTION_TYPES = {
 recall:{label:'Knowledge recall',range:'1–2 marks',min:1,max:2,minutes:2},
 explanation:{label:'Written explanation',range:'4–6 marks',min:4,max:6,minutes:7},
 calculation:{label:'Problem solving',range:'7–12 marks',min:7,max:12,minutes:14}
};
export function rng(seed) { let h=2166136261; for(const c of String(seed)) h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}; }
export function supportedLocal(topicId,type) {return type==='calculation'?templateTopics.includes(topicId):!!localConcepts[topicId]?.[type]?.length;}
export function localQuestion(topicId,type,seed) {
 const random=rng(seed);let q;
 if(type==='calculation')q=makeTemplate(topicId,random);
 else {const pool=localConcepts[topicId]?.[type];if(pool?.length){const item=pool[Math.floor(random()*pool.length)];q={...item,steps:[...item.steps],source:'Built-in concept practice · limited variants',engine:'concept'};}}
 if(!q)return null;
 q={...q,id:'gen-'+seed,topicId,type,marks:q.steps.length,minutes:QUESTION_TYPES[type].minutes,generatedAt:new Date().toISOString()};
 validateGenerated(q,topicId,type);return q;
}
export function validateGenerated(q,topicId,type) {
 const t=QUESTION_TYPES[type];
 if(!t||!TOPICS.some(x=>x.id===topicId)||q.topicId!==topicId||q.type!==type)throw new Error('Question does not match the requested topic and type.');
 if(typeof q.prompt!=='string'||q.prompt.trim().length<10||q.prompt.length>10000)throw new Error('Invalid question text.');
 if(!Number.isInteger(q.marks)||q.marks<t.min||q.marks>t.max||!Array.isArray(q.steps)||q.steps.length!==q.marks||q.steps.some(s=>typeof s!=='string'||!s.trim()||s.length>2500))throw new Error('Invalid marking points or mark range.');
 if(!Number.isInteger(q.minutes)||q.minutes<1||q.minutes>40)throw new Error('Invalid question time.');
 if(q.modelAnswer!==undefined&&(typeof q.modelAnswer!=='string'||q.modelAnswer.length>10000))throw new Error('Invalid worked answer.');
 if(type==='explanation'&&(!q.modelAnswer?.trim()||q.modelAnswer.trim().length<30))throw new Error('A written explanation needs a complete example answer.');
 if(type==='calculation'){const parts=[...q.prompt.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1]));if(parts.length<2||parts.reduce((a,b)=>a+b,0)!==q.marks)throw new Error('Problem-solving part marks must add up to the question total.');}
 return q;
}
export function nextType(state,topic,offset=0) {
 const enabled=state.settings.questionTypes?.length?state.settings.questionTypes:Object.keys(QUESTION_TYPES);
 const cycle=topic.subjectId==='maths'||topic.subjectId==='further'?['calculation','calculation','explanation','recall']:['recall','explanation','calculation'];
 const choices=cycle.filter(t=>enabled.includes(t));
 const count=state.attempts.filter(a=>a.topicId===topic.id&&!a.review).length;
 // Spread initial questions across types as well as rotating each topic over time.
 const spread=TOPICS.findIndex(t=>t.id===topic.id);
 return choices[(count+spread+offset)%choices.length];
}
export function duePlan(state,today=dayKey()) {
 return TOPICS.filter(t=>state.unlocked.includes(t.id)&&isTopicEligible(t,state)).filter(t=>{
  const last=state.attempts.filter(a=>a.topicId===t.id).map(a=>dayKey(new Date(a.at))).sort().at(-1);
  return !last||daysBetween(last,today)>=state.settings.cadence;
 }).map(t=>({topicId:t.id,type:nextType(state,t),minutes:QUESTION_TYPES[nextType(state,t)].minutes})).sort((a,b)=>{
  const pa=performance(state,x=>x.topicId===a.topicId).percent,pb=performance(state,x=>x.topicId===b.topicId).percent;
  return (pa??-1)-(pb??-1);
 });
}
export function sessionPlan(state,items) {
 const limit=state.settings.sessionSize||8,bySubject=SUBJECTS.map(s=>items.filter(i=>TOPICS.find(t=>t.id===i.topicId)?.subjectId===s.id));
 const result=[];
 while(result.length<limit&&bySubject.some(a=>a.length))for(const list of bySubject){if(list.length&&result.length<limit)result.push(list.shift());}
 return result;
}
