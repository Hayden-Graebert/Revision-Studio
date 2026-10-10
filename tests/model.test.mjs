import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,QUESTIONS} from '../public/data.js';
import {initialState,dayKey,daysBetween,dueQuestions,mistakes,performance,validOptions,safeUrl,validateQuestion} from '../public/model.js';
const date='2026-10-10';
const attempt=(q,score,at='2026-10-10T12:00:00Z')=>({questionId:q.id,topicId:q.topicId,subjectId:TOPICS.find(t=>t.id===q.topicId).subjectId,score,max:q.marks,at});
test('all 80 topics have a valid original starter; unique identifiers and references',()=>{
 assert.equal(TOPICS.length,80);assert.equal(QUESTIONS.length,88);
 assert.equal(new Set(TOPICS.map(t=>t.id)).size,TOPICS.length);
 assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length);
 for(const q of QUESTIONS)assert.equal(validateQuestion(q,TOPICS),true);
 for(const t of TOPICS)assert.ok(QUESTIONS.some(q=>q.topicId===t.id),t.id);
});
test('new account has no assumed unlocked topics or fabricated results',()=>{const s=initialState();assert.equal(dueQuestions(s,TOPICS,QUESTIONS,date).length,0);assert.equal(performance(s,()=>true).percent,null);});
test('daily cadence selects one question per unlocked topic, removes attempted topic, then rotates',()=>{
 const s=initialState();s.unlocked=['m-diff','p-material'];
 const due=dueQuestions(s,TOPICS,QUESTIONS,date);assert.equal(due.length,2);
 const q=due.find(q=>q.topicId==='m-diff');s.attempts.push(attempt(q,0));
 assert.equal(dueQuestions(s,TOPICS,QUESTIONS,date).length,1);
 const tomorrow=dueQuestions(s,TOPICS,QUESTIONS,'2026-10-11');assert.equal(tomorrow.length,2);assert.notEqual(tomorrow.find(q=>q.topicId==='m-diff').id,q.id);
 // Missing many days never creates duplicate backlog.
 assert.equal(dueQuestions(s,TOPICS,QUESTIONS,'2027-01-01').length,2);
});
test('two-day cadence, relocking and optional paper eligibility',()=>{
 const s=initialState();s.settings.cadence=2;s.unlocked=['m-diff','f-fm1'];
 const q=QUESTIONS.find(q=>q.topicId==='m-diff');s.attempts.push(attempt(q,q.marks));
 assert.equal(dueQuestions(s,TOPICS,QUESTIONS,'2026-10-11').length,0);
 assert.equal(dueQuestions(s,TOPICS,QUESTIONS,'2026-10-12').length,1);
 s.settings.fmOptions=['FM1','FS1'];assert.equal(dueQuestions(s,TOPICS,QUESTIONS,'2026-10-12').length,2);
 s.unlocked=[];assert.equal(dueQuestions(s,TOPICS,QUESTIONS,'2026-10-12').length,0);
});
test('London date boundaries and daylight saving do not shift cadence',()=>{
 assert.equal(dayKey(new Date('2026-10-10T23:30:00Z')),'2026-10-11');
 assert.equal(dayKey(new Date('2026-12-10T23:30:00Z')),'2026-12-10');
 assert.equal(daysBetween('2026-10-24','2026-10-26'),2);
});
test('mistake collection uses latest score, full marks clear it, later mistakes reopen it',()=>{
 const s=initialState(),q=QUESTIONS[0];s.attempts.push(attempt(q,1));assert.equal(mistakes(s,QUESTIONS).length,1);
 s.attempts.push(attempt(q,q.marks,'2026-10-11T12:00:00Z'));assert.equal(mistakes(s,QUESTIONS).length,0);
 s.attempts.push(attempt(q,0,'2026-10-12T12:00:00Z'));assert.equal(mistakes(s,QUESTIONS).length,1);
});
test('chart uses earned marks / available marks for 30 calendar days and subject filters',()=>{
 const s=initialState();s.attempts=[{subjectId:'maths',topicId:'m-diff',score:1,max:2,at:'2026-10-10T11:00:00Z'},{subjectId:'maths',topicId:'m-int',score:3,max:3,at:'2026-09-11T11:00:00Z'},{subjectId:'maths',score:0,max:20,at:'2026-09-10T11:00:00Z'}];
 assert.deepEqual(performance(s,a=>a.subjectId==='maths',new Date('2026-10-10T12:00:00Z')),{count:2,percent:80});
 assert.equal(performance(s,a=>a.subjectId==='physics').percent,null);
});
test('only permitted Further Maths pairs are accepted',()=>{
 for(const p of [[],['FM1','FS1'],['FP1','FP2'],['D2','D1']])assert.ok(validOptions(p));
 for(const p of [['FM1'],['FM1','FS2'],['FM1','FM1'],['X1','Y1'],['FP1','FS1','FM1']])assert.equal(validOptions(p),false);
});
test('external paper links reject script/data/insecure schemes',()=>{
 for(const u of ['javascript:alert(1)','data:text/html,bad','http://example.org','/local.pdf'])assert.equal(safeUrl(u),'');
 assert.equal(safeUrl('https://example.org/a.pdf'),'https://example.org/a.pdf');
});
test('question imports reject bad references, empty steps and unreasonable times',()=>{
 const good={...QUESTIONS[0]};assert.throws(()=>validateQuestion({...good,topicId:'bad'},TOPICS));assert.throws(()=>validateQuestion({...good,steps:['']},TOPICS));assert.throws(()=>validateQuestion({...good,minutes:0},TOPICS));assert.throws(()=>validateQuestion({...good,marks:30},TOPICS));
});
