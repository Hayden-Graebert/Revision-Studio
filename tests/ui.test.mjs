// Template and event-flow tests use a small DOM double, not a visual browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as Model from '../public/model.js';
import * as Data from '../public/data.js';
import * as Generation from '../public/generation.js';
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
 const context={Model,Data,Generation,StudyStore,document,window,location,history:{replaceState(_a,_b,path){location.hash=path.startsWith('#')?path:'';}},localStorage,crypto,structuredClone,URL,Blob,Intl,console,setTimeout:()=>0,clearTimeout(){},setInterval(){},FormData:class{constructor(form){this.values=form.values;}get(k){return this.values[k]??null;}getAll(k){const v=this.values[k];return Array.isArray(v)?v:[];}}};
 const code=`(async()=>{const {SUBJECTS,TOPICS,QUESTIONS,OPTIONS}=Data;const {initialState,dayKey,dueQuestions,mistakes,performance,isTopicEligible,validOptions,safeUrl,validateQuestion,latestAttempts,toggleFavourite,finishQuestion}=Model;const {QUESTION_TYPES, localQuestion, supportedLocal, validateGenerated, duePlan, sessionPlan, nextType}=Generation;${source}\nreturn {action,render,startSession,getState:()=>state,getSession:()=>session};})()`;
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
test('generated session resumes; errors clear on retry and favourites retain exact questions',async()=>{
 const h=await harness();await h.action('demo',{});await h.action('toggle-topic',{dataset:{id:'p-material'}});
 await h.startSession([{topicId:'p-material',type:'calculation'}],'Daily revision');h.render();
 const q=h.getState().session.current;assert.equal(q.type,'calculation');assert.match(h.app.innerHTML,/Reveal worked solution/);assert.doesNotMatch(h.app.innerHTML,/class="mark-scheme"/);
 const reload=await harness(h.saved);await reload.action('demo',{});assert.equal(reload.getState().session.current.prompt,q.prompt);
 await reload.action('favourite',{dataset:{id:q.id}});await reload.action('reveal',{});await reload.submit('mark-form',{score:'1',confidence:'unsure',note:'Unit conversion'});
 assert.equal(reload.getState().session,null);assert.equal(reload.getState().savedQuestions.length,1);assert.equal(Model.mistakes(reload.getState(),reload.getState().savedQuestions).length,1);
 await reload.action('review-all',{});assert.equal(reload.getState().session.current.prompt,q.prompt);await reload.action('reveal',{});await reload.submit('mark-form',{score:String(q.marks),confidence:'confident',note:''});
 assert.equal(Model.mistakes(reload.getState(),reload.getState().savedQuestions).length,0);assert.equal(reload.getState().savedQuestions.length,1);
 await reload.action('favourite',{dataset:{id:q.id}});assert.equal(reload.getState().savedQuestions.length,0);assert.equal(reload.getState().attempts.length,2);
});
test('full-mark unstarred question is discarded while attempt metadata remains',async()=>{
 const h=await harness();await h.action('demo',{});await h.startSession([{topicId:'p-material',type:'recall'}],'Practice');const q=h.getState().session.current;
 await h.action('reveal',{});await h.submit('mark-form',{score:String(q.marks),confidence:'okay',note:''});
 assert.equal(h.getState().savedQuestions.length,0);assert.equal(h.getState().session,null);assert.equal(h.getState().attempts[0].type,'recall');assert.equal(JSON.stringify(h.getState()).includes(q.prompt),false);
});
test('unsupported local type stays unscored and can be skipped',async()=>{
 const h=await harness();await h.action('demo',{});await h.startSession([{topicId:'m-proof',type:'calculation'}],'Practice');h.render();
 assert.match(h.app.innerHTML,/no built-in question/);assert.equal(h.getState().attempts.length,0);await h.action('skip',{});assert.equal(h.getState().session,null);assert.equal(h.getState().lastSession.skipped,1);
});
test('saved question text is escaped; old custom questions migrate into favourites',async()=>{
 const raw={schema:1,customQuestions:[{id:'custom-old',topicId:'m-algebra',prompt:'<img src=x onerror=alert(1)>',steps:['Answer'],marks:1,minutes:2}],attempts:[]};
 const saved=new Map([['revision-studio-demo-v1',JSON.stringify(raw)]]);const h=await harness(saved);await h.action('demo',{});await h.action('practice-question',{dataset:{id:'custom-old'}});h.render();
 assert.match(h.app.innerHTML,/&lt;img/);assert.doesNotMatch(h.app.innerHTML,/<img src=x/);assert.equal(h.getState().favouriteIds[0],'custom-old');
});
test('settings accept all four optional modules and selected question types',async()=>{
 const h=await harness();await h.action('demo',{});await h.submit('settings-form',{fmOptions:['FM1','FM2','FS1','FS2'],questionTypes:['explanation'],sessionSize:'4',cadence:'2',generationMode:'builtin',difficulty:'stretch'});
 assert.equal(h.getState().settings.fmOptions.length,4);assert.deepEqual([...h.getState().settings.questionTypes],['explanation']);
});
test('paper saving, timer pause/resume, reload and score history',async()=>{
 const h=await harness();await h.action('demo',{});await h.submit('paper-form',{subjectId:'maths',title:'Practice paper',url:'https://example.org/paper.pdf',markUrl:'https://example.org/marks.pdf',duration:'120',max:'100'});
 const p=h.getState().papers[0];await h.action('start-paper',{dataset:{id:p.id}});assert.equal(h.getState().timer.running,true);
 await h.action('toggle-timer',{});assert.equal(h.getState().timer.running,false);
 const reload=await harness(h.saved);await reload.action('demo',{});assert.equal(reload.getState().timer.paperId,p.id);await reload.action('toggle-timer',{});assert.equal(reload.getState().timer.running,true);
 await reload.submit('paper-score-form',{score:'73',note:'Practise integration.'});assert.equal(reload.getState().timer,null);assert.equal(reload.getState().paperAttempts[0].score,73);assert.equal(reload.getState().attempts.length,0);
});
