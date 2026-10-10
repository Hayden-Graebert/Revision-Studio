// Template and event-flow tests use a small DOM double, not a visual browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as Model from '../public/model.js';
import * as Data from '../public/data.js';
import {StudyStore} from '../public/storage.js';
const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
async function harness(saved=new Map()){
 const app={innerHTML:''},toast={hidden:true},events={};
 const document={readyState:'complete',querySelector:s=>s==='#app'?app:s==='#toast'?toast:null,addEventListener:(event,fn)=>events[event]=fn,body:{classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}},createElement:()=>({click(){}})};
 const location={hash:'',pathname:'/',origin:'https://example.org'};
 const window={REVISION_CONFIG:{allowSignup:true,allowDemo:true},addEventListener(){},scrollTo(){}};
 const localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 // StudyStore was imported in the host realm, so provide its demo storage there.
 globalThis.localStorage=localStorage;
 const context={Model,Data,StudyStore,document,window,location,history:{replaceState(_a,_b,path){location.hash=path.startsWith('#')?path:'';}},localStorage,crypto,structuredClone,URL,Blob,Intl,console,setTimeout:()=>0,clearTimeout(){},setInterval(){},FormData:class{constructor(form){this.values=form.values;}get(k){return this.values[k]??null;}getAll(k){const v=this.values[k];return Array.isArray(v)?v:[];}}};
 const code=`(async()=>{const {SUBJECTS,TOPICS,QUESTIONS,OPTIONS}=Data;const {initialState,dayKey,dueQuestions,mistakes,performance,isTopicEligible,validOptions,safeUrl,validateQuestion,latestAttempts}=Model;${source}\nreturn {action,render,startSession,getState:()=>state,getSession:()=>session};})()`;
 const api=await vm.runInNewContext(code,context);
 return {...api,app,toast,events,location,saved,async submit(id,values){await events.submit({preventDefault(){},target:{id,values,querySelector:()=>({disabled:false})}});}};
}
test('login gate, demo onboarding, all screens and drill-down render',async()=>{
 const h=await harness();assert.match(h.app.innerHTML,/Sign in/);assert.doesNotMatch(h.app.innerHTML,/Your subjects<\/h2>/);
 await h.action('demo',{});assert.match(h.app.innerHTML,/LOCAL DEMO/);
 for(const view of ['dashboard','progress','progress/maths','topics/chemistry','topics/further','mistakes','papers','bank/maths','settings','session']){
  h.location.hash='#'+view;h.render();assert.match(h.app.innerHTML,/id="main"/);assert.doesNotMatch(h.app.innerHTML,/undefined|NaN/);
 }
 await h.action('chart',{dataset:{id:'physics'}});assert.equal(h.location.hash,'progress/physics');
});
test('unlock → daily question → lost marks → notebook → correct retry → cleared, and persistence',async()=>{
 const h=await harness();await h.action('demo',{});await h.action('toggle-topic',{dataset:{id:'m-proof'}});
 await h.action('start-daily',{});h.render();assert.match(h.app.innerHTML,/Reveal worked solution/);assert.doesNotMatch(h.app.innerHTML,/mark-scheme/);
 await h.action('reveal',{});assert.match(h.app.innerHTML,/Worked solution/);
 await h.submit('mark-form',{score:'1',confidence:'unsure',note:'Remember the general odd number.'});
 assert.equal(h.getState().attempts.length,1);h.location.hash='#mistakes';h.render();assert.match(h.app.innerHTML,/Remember the general odd number/);
 await h.action('review-all',{});await h.action('reveal',{});await h.submit('mark-form',{score:'2',confidence:'confident',note:''});
 assert.equal(Model.mistakes(h.getState(),Data.QUESTIONS).length,0);assert.equal(Model.dueQuestions(h.getState(),Data.TOPICS,Data.QUESTIONS).length,0);
 const reload=await harness(h.saved);await reload.action('demo',{});assert.equal(reload.getState().attempts.length,2);
});
test('user question text is escaped and can be practised',async()=>{
 const h=await harness();await h.action('demo',{});await h.submit('question-form',{topicId:'m-algebra',prompt:'<img src=x onerror=alert(1)>',solution:'Use <b>algebra</b>\nSecond step',minutes:'3'});
 assert.equal(h.getState().customQuestions.length,1);const q=h.getState().customQuestions[0];h.startSession([q],'Own questions');h.render();
 assert.match(h.app.innerHTML,/&lt;img/);assert.doesNotMatch(h.app.innerHTML,/<img src=x/);
});
test('paper saving, timer pause/resume, reload and score history',async()=>{
 const h=await harness();await h.action('demo',{});await h.submit('paper-form',{subjectId:'maths',title:'Practice paper',url:'https://example.org/paper.pdf',markUrl:'https://example.org/marks.pdf',duration:'120',max:'100'});
 const p=h.getState().papers[0];await h.action('start-paper',{dataset:{id:p.id}});assert.equal(h.getState().timer.running,true);
 await h.action('toggle-timer',{});assert.equal(h.getState().timer.running,false);
 const reload=await harness(h.saved);await reload.action('demo',{});assert.equal(reload.getState().timer.paperId,p.id);await reload.action('toggle-timer',{});assert.equal(reload.getState().timer.running,true);
 await reload.submit('paper-score-form',{score:'73',note:'Practise integration.'});assert.equal(reload.getState().timer,null);assert.equal(reload.getState().paperAttempts[0].score,73);assert.equal(reload.getState().attempts.length,0);
});
