import { SUBJECTS, TOPICS, QUESTIONS, OPTIONS } from './data.js';
import { initialState, dayKey, dueQuestions, mistakes, performance, isTopicEligible, validOptions, safeUrl, validateQuestion, latestAttempts, toggleFavourite, finishQuestion } from './model.js';
import { StudyStore } from './storage.js';
import {QUESTION_TYPES, localQuestion, supportedLocal, validateGenerated, duePlan, sessionPlan, nextType} from './generation.js';
const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sid = id => SUBJECTS.find(s=>s.id===id);
const tid = id => TOPICS.find(t=>t.id===id);
const btn = (label,action,extra='',kind='') => `<button class="btn ${kind}" data-action="${action}" ${extra}>${label}</button>`;
const link = (label,path,kind='') => `<a class="btn ${kind}" href="#${path}">${label}</a>`;
const empty = (title,copy,action='') => `<div class="empty"><div class="empty-symbol">◌</div><h3>${title}</h3><p>${copy}</p>${action}</div>`;
const subOptions = selected => SUBJECTS.map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${s.name}</option>`).join('');
const field = (name,label,type='text',extra='') => `<label class="field"><span>${label}</span><input type="${type}" name="${name}" ${extra}></label>`;
let state=initialState(), store, client, user, demo=false, busy=false, loading=false, loadError='', session=null, authMode='login', toastTimeout;
let recovery=location.hash.includes('type=recovery');
let config={}, generating=false, generationError='', generationNotice='', usageInfo=null, pendingQuestion=null;
const allQuestions=()=>[...new Map([...state.savedQuestions,...(state.session?.current?[state.session.current]:[])].map(q=>[q.id,q])).values()];
const due=()=>duePlan(state);
const wrong=()=>mistakes(state,allQuestions());
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=error?'error':'';el.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.hidden=true,error?16000:6000);}
function renderMath(){if(window.renderMathInElement)window.renderMathInElement($('#app'),{delimiters:[{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],throwOnError:false,trust:false});}
function route(){const parts=location.hash.replace(/^#/,'').split('/');return [parts[0]||'dashboard',parts[1]||''];}
function navigate(path){if(location.hash==='#'+path)render();else location.hash=path;}
async function mutate(change){
  if(busy)return false;busy=true;document.body.classList.add('busy');document.body.setAttribute('aria-busy','true');
  try{const next=structuredClone(state);change(next);await store.save(next);state=next;session=state.session;return true;}
  catch(e){if(e.conflict){state=await store.load();session=state.session;render();}toast(e.message||'Unable to save. Check your connection and try again.',true);return false;}
  finally{busy=false;document.body.classList.remove('busy');document.body.removeAttribute('aria-busy');}
}
function themeButton(){return `<button type="button" class="btn secondary compact theme-toggle" data-action="toggle-theme" aria-pressed="${window.revisionTheme?.isDark() || false}">Dark mode</button>`;}
function authPage(){
  const configured=!!config.supabaseUrl&&!!config.supabasePublishableKey;
  const update=authMode==='update', reset=authMode==='reset', signup=authMode==='signup';
  const title=update?'Choose a new password':reset?'Reset your password':signup?'Create your account':'Welcome to your desk.';
  $('#app').innerHTML=`<main class="auth-layout" id="main"><section class="auth-story"><div class="brand"><div class="logo-mark">r.</div><div>revision studio<small>A little, every day.</small></div></div><div><div class="eyebrow" style="color:#b6cc9c">YOUR PERSONAL A-LEVEL SPACE</div><h1>Keep yesterday’s<br>learning fresh.</h1><p>Four subjects. One clear plan.<br>Build understanding, one question at a time.</p><div class="orbit" aria-hidden="true"><span>∑</span></div><div class="auth-topics">${SUBJECTS.map(s=>`<span>${s.short} · ${s.board}</span>`).join('')}</div></div><div class="auth-footer">SMALL STEPS. DEEPER UNDERSTANDING.</div></section><section class="auth-form-wrap"><div class="auth-form">${themeButton()}<h2>${title}</h2><p>${update?'Use at least 12 characters.':reset?'We’ll send a recovery link to your email.':'Sign in to keep your questions and progress together.'}</p>${!configured?'<div class="notice">Account setup is needed. Follow START-HERE.md and add your Supabase project URL and public key to config.js. You can explore the separate local demo below.</div>':''}<form id="auth-form">${!update?field('email','Email address','email','required autocomplete="email" placeholder="you@example.com"'):''}${!reset?field('password',update?'New password':'Password','password',`required ${signup||update?'minlength="12"':''} autocomplete="${signup||update?'new-password':'current-password'}"`):''}<button class="btn" ${!configured?'disabled':''}>${update?'Save new password':reset?'Send reset link':signup?'Create account':'Sign in'} <span aria-hidden="true">→</span></button></form><div class="auth-links">${!update?`<button data-action="auth-mode" data-mode="${signup||reset?'login':'reset'}">${signup||reset?'Back to sign in':'Forgot password?'}</button>${!signup&&!reset&&config.allowSignup?'<button data-action="auth-mode" data-mode="signup">Create account</button>':''}`:''}</div>${config.allowDemo&&!update?'<hr><button class="btn secondary" data-action="demo">Explore local demo →</button><p class="small muted">Demo progress stays in this browser and is separate from your account.</p>':''}<p class="small muted" style="margin-top:28px">Edexcel Maths, Further Maths & Chemistry<br>OCR A Physics · Subjects already set up</p></div></section></main>`;
}
function shell(content,view){
 const nav=[['dashboard','◫','Overview'],['progress','▥','Performance'],['mistakes','↺','Error bank'],['papers','▤','Past papers'],['topics','⊞','Unlock topics'],['favourites','☆','Favourites'],['settings','⚙','Settings']];
 const date=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/London'}).format(new Date());
 $('#app').innerHTML=`<aside class="sidebar"><div class="brand"><div class="logo-mark">r.</div><div>revision studio<small>A little, every day.</small></div></div><nav aria-label="Main navigation">${nav.map(([id,icon,label])=>`<a class="nav-link ${view===id?'active':''}" href="#${id}" ${view===id?'aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}${id==='mistakes'&&wrong().length?`<span class="nav-count">${wrong().length}</span>`:''}</a>`).join('')}</nav><div class="side-note"><div class="eyebrow" style="color:#a4bc91">THE DAILY HABIT</div><p>Practice is progress.<br>Make a little room for it.</p></div><div class="side-user"><span title="${esc(user?.email||'Local demo')}">${esc(user?.email||'Local demo')}</span><button data-action="logout">Sign out</button></div></aside><div class="workspace"><header class="topbar"><div class="date">${date}</div><div class="mobile-brand brand"><div class="logo-mark">r.</div>revision studio</div><div class="topbar-actions">${themeButton()}<span><i class="status-dot"></i>${demo?'Local demo':'Account connected'}</span><button class="text-link" data-action="logout">Sign out</button></div></header>${demo?'<div class="notice demo">LOCAL DEMO · Changes stay in this browser. Sign in to use cloud saving.</div>':''}<main id="main" tabindex="-1">${content}</main></div>`;renderMath();tick();
}
function heading(kicker,title,description,action=''){return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;}
function chart(subjectId=''){
 const s=sid(subjectId);const items=s?TOPICS.filter(t=>t.subjectId===s.id&&isTopicEligible(t,state)):SUBJECTS;
 return `<div class="chart" aria-label="Marks earned over the last 30 calendar days">${items.map(item=>{const perf=performance(state,a=>s?a.topicId===item.id:a.subjectId===item.id);const subject=s||item;return `<button class="chart-row" style="--subject:${subject.color}" data-action="${s?'practice-topic':'chart'}" data-id="${item.id}" aria-label="${esc(item.name)}, ${perf.percent===null?'no attempts':perf.percent+' percent from '+perf.count+' attempts'}, ${s?'practise topic':'view topics'}"><span class="chart-title"><span>${esc(item.name)}</span><strong>${perf.percent===null?'—':perf.percent+'%'}</strong></span><span class="track"><span class="fill" style="width:${perf.percent||0}%"></span></span><small>${perf.count?`${perf.count} attempt${perf.count===1?'':'s'}`:'No attempts yet'}${s?' · Click to practise':' · View topics →'}</small></button>`}).join('')}<div class="chart-axis"><span>0%</span><span>50%</span><span>100%</span></div></div>`;
}
function dashboard(){
 const qs=due(), active=TOPICS.filter(t=>state.unlocked.includes(t.id)&&isTopicEligible(t,state));
 const today=state.attempts.filter(a=>dayKey(new Date(a.at))===dayKey()), selected=sessionPlan(state,qs),perf=performance(state,()=>true);
 return heading('YOUR DAILY PRACTICE','A little progress, every day.','Fresh practice, built around what you have learnt.',link('Manage topics ↗','topics','secondary'))+
 `<section class="hero"><div><div class="eyebrow">TODAY’S REVISION</div><h2>${state.session?'Your session is waiting.':qs.length?`${qs.length} topics ready to revisit.`:active.length?'You’re up to date.':'Let’s build your daily plan.'}</h2><p>${state.session?'Resume the exact question you left, with your session progress saved.':qs.length?`Start with up to ${state.settings.sessionSize} questions, mixing recall, explanations and longer problems. Weaker topics come first within each subject.`:'Unlock the topics you have studied, or revisit an error or favourite.'}</p>${state.session?btn('Resume session →','resume','','lime'):qs.length?btn('Start daily revision →','start-daily','','lime'):link('Choose topics →','topics','lime')}</div><div class="hero-decoration"><div><strong>${String(qs.length).padStart(2,'0')}</strong><span>TOPICS DUE</span></div></div></section>`+
 `<div class="stats"><div class="stat"><span class="stat-label">Completed today</span><strong>${today.length}</strong><small>questions</small></div><div class="stat"><span class="stat-label">Next session estimate</span><strong>${selected.reduce((n,q)=>n+q.minutes,0)}m</strong><small>plus marking</small></div><div class="stat"><span class="stat-label">Recent performance</span><strong>${perf.percent===null?'—':perf.percent+'%'}</strong><small>last 30 days</small></div></div>`+
 `<div class="grid"><section class="card"><div class="card-head"><div><h2>Your subjects</h2><p>Only unlocked topics enter your daily plan.</p></div></div>${SUBJECTS.map(s=>{const count=qs.filter(q=>tid(q.topicId).subjectId===s.id).length;return `<div class="subject-row"><div class="symbol" style="--subject:${s.color}">${s.symbol}</div><div class="subject-info"><strong>${s.name}</strong><small>${s.board} · ${s.code}</small></div>${count?btn(count+' due →','start-subject',`data-id="${s.id}"`,'secondary compact'):link('Topics','topics/'+s.id,'secondary compact')}</div>`;}).join('')}</section><section class="card"><div class="card-head"><div><h2>How you’re doing</h2><p>Click a subject to explore its topics.</p></div></div>${chart()}</section></div>`+
 `<div class="lower-grid"><section class="card mini-card"><div><div class="eyebrow">LEARN FROM ERRORS</div><h2>Error bank</h2><p>Exact questions and solutions kept until you earn full marks.</p><a class="text-link" href="#mistakes">Review errors →</a></div><span class="mini-number">${wrong().length}</span></section><section class="card mini-card"><div><div class="eyebrow">KEEP THE GOOD ONES</div><h2>Favourites</h2><p>Star a question to revisit it any time.</p><a class="text-link" href="#favourites">Open favourites →</a></div><span class="mini-number">${state.favouriteIds.length}</span></section></div>`+
 `<section class="card" style="margin-top:24px"><h2>Your question mix</h2><div class="type-cards">${Object.entries(QUESTION_TYPES).map(([key,t])=>`<div><span class="pill ${state.settings.questionTypes.includes(key)?'good':''}">${state.settings.questionTypes.includes(key)?'Enabled':'Off'}</span><h3>${t.label}</h3><p class="small muted">${t.range} · around ${t.minutes} minutes</p></div>`).join('')}</div><a class="text-link" href="#settings">Adjust types and session length →</a></section>`;
}
function progressPage(id){const s=sid(id);return heading('PERFORMANCE',s?s.name:'See your understanding grow.','Marks earned ÷ marks available across attempts in the last 30 London calendar days.',s?link('← All subjects','progress','secondary'):'')+`<section class="card">${chart(s?.id)}<div class="notice">These scores describe your practice, not a predicted exam grade. Unattempted topics show “—”, not 0%. Repeat attempts count; past-paper totals are tracked separately.</div></section>`;}
function subjectTabs(view,selected){return `<div class="tabs" role="group" aria-label="Choose subject">${SUBJECTS.map(s=>`<a class="tab ${s.id===selected?'selected':''}" href="#${view}/${s.id}" style="text-decoration:none">${s.short}</a>`).join('')}</div>`;}
function topicsPage(id){
 const selected=sid(id)?.id||'maths',topics=TOPICS.filter(t=>t.subjectId===selected),groups=[...new Set(topics.map(t=>t.group))];
 return heading('YOUR SYLLABUS','Unlock what you’ve learnt.','Your selection controls daily practice. Generation covers broad topics, not every specification statement.')+subjectTabs('topics',selected)+`<section class="card"><div class="card-head"><h2>${sid(selected).name}</h2>${btn('Unlock eligible topics','unlock-subject',`data-id="${selected}"`,'secondary compact')}</div>${selected==='further'?'<div class="notice">Core Pure is always available. Choose all the optional modules you study in <a href="#settings">Settings</a>.</div>':''}${groups.map(g=>`<section class="topic-group"><h3>${esc(g)}</h3>${topics.filter(t=>t.group===g).map(t=>{const eligible=isTopicEligible(t,state),types=Object.keys(QUESTION_TYPES).filter(k=>supportedLocal(t.id,k));return `<div class="topic-row"><div><strong>${esc(t.name)}</strong><small>${!eligible?'Optional module not selected':state.unlocked.includes(t.id)?'Active for revision':'Not yet unlocked'}</small><small>Built-in: ${types.map(k=>QUESTION_TYPES[k].label.toLowerCase()).join(', ')||'none yet'} · Other practice needs AI</small></div><button class="switch" role="switch" aria-checked="${state.unlocked.includes(t.id)&&eligible}" aria-label="Unlock ${esc(t.name)}" data-action="toggle-topic" data-id="${t.id}" ${eligible?'':'disabled'}></button></div>`;}).join('')}</section>`).join('')}<div class="notice">Built-in calculations vary their data; built-in conceptual questions have limited variants. AI can generate additional practice across these broad topics, but is not a guarantee of complete syllabus coverage. Written practical questions do not replace laboratory work.</div></section>`;
}
function favouriteButton(q){const on=state.favouriteIds.includes(q.id);return btn(on?'★ Favourited':'☆ Favourite','favourite',`data-id="${esc(q.id)}" aria-pressed="${on}" aria-label="${on?'Remove from':'Add to'} favourites"`,'secondary compact');}
function savedCards(qs,errors=false){const latest=latestAttempts(state);return qs.map(q=>{const a=latest.get(q.id);return `<article class="list-card"><div class="meta"><span class="pill">${esc(sid(tid(q.topicId)?.subjectId)?.short||'Practice')}</span><span class="pill">${esc(QUESTION_TYPES[q.type]?.label||'Saved practice')}</span><span class="pill">${q.marks} marks</span>${errors?`<span class="pill warn">${a?.score}/${a?.max} last time</span>`:''}</div><h3 class="saved-prompt">${esc(q.prompt)}</h3>${a?.note?`<p class="muted break-word">Your note: ${esc(a.note)}</p>`:''}<div class="actions">${btn('Practise →','practice-question',`data-id="${esc(q.id)}"`,'secondary compact')}${favouriteButton(q)}</div></article>`;}).join('');}
function mistakesPage(){const qs=wrong();return heading('ERROR BANK','Give it another go.',`${qs.length} questions to revisit. A full-mark retry clears the error; favourites stay saved.`,qs.length?btn('Review all →','review-all'):'')+(qs.length?savedCards(qs,true):empty('A clean page.','Questions with lost marks will appear here.',link('Go to daily revision','dashboard')));}
function favouritesPage(){const qs=state.savedQuestions.filter(q=>state.favouriteIds.includes(q.id));return heading('FAVOURITES','Worth another look.',`${qs.length} saved questions. Your exact questions and solutions stay here until you remove the star.`,qs.length?btn('Practise favourites →','review-favourites'):'')+(qs.length?savedCards(qs):empty('Save a useful question.','Select the star during any session to keep it here.',link('Back to overview','dashboard')));}
async function startSession(items,label,review=false){
 if(state.session){navigate('session');toast('Resume or end your current session before starting another.');await loadNext();return;}
 if(!items.length){toast('No topics or saved questions are ready for this session.');return;}
 const plan=review?items.map(q=>({questionId:q.id,topicId:q.topicId,type:q.type||'recall',seed:crypto.randomUUID()})):sessionPlan(state,items).map(i=>({...i,seed:crypto.randomUUID()}));
 const next={id:crypto.randomUUID(),plan,index:0,current:null,revealed:false,label,review,results:[],skipped:0};
 if(await mutate(s=>{s.session=next;s.lastSession=null;})){generationError='';generationNotice='';navigate('session');await loadNext();}
}
function fingerprint(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16);}
async function loadNext(forceLocal=false,overrideType=''){
 if(generating||!state.session||state.session.current)return;
 const identity=state.session.id,owner=user?.id||'demo';let item=state.session.plan[state.session.index];
 if(overrideType){if(!QUESTION_TYPES[overrideType])return;if(!await mutate(s=>s.session.plan[s.session.index].type=overrideType))return;item=state.session.plan[state.session.index];}
 generating=true;generationError='';generationNotice='';render();
 try{
  let q;
  if(pendingQuestion?.sessionId===identity&&pendingQuestion?.seed===item.seed&&pendingQuestion?.type===item.type){q=pendingQuestion.question;}
  else if(item.questionId){q=state.savedQuestions.find(q=>q.id===item.questionId);if(!q)throw new Error('This saved question was removed. Skip it to continue.');}
  else{
   const local=()=>{let result=null;for(let i=0;i<6;i++){result=localQuestion(item.topicId,item.type,item.seed+(i?'-'+i:''));if(!result||!state.attempts.slice(-100).some(a=>a.fingerprint===fingerprint(result.prompt)))break;}return result;};
   const prior=state.attempts.filter(a=>a.topicId===item.topicId&&a.type===item.type&&!a.review).length;
   const useLocal=forceLocal||demo||state.settings.generationMode==='builtin'||(item.type==='calculation'&&supportedLocal(item.topicId,item.type)&&prior%3!==2);
   if(useLocal){q=local();if(!q)throw new Error('There is no built-in question for this topic and type yet. Enable combined generation, choose another available type below, or skip this topic.');}
   else{
    try{
     const {data,error}=await client.auth.getSession();if(error||!data.session)throw new Error('Please sign in again to generate a question.');
     const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({topicId:item.topicId,type:item.type,seed:item.seed,difficulty:state.settings.difficulty}),signal:AbortSignal.timeout(115000)});
     let result;try{result=await response.json();}catch{throw new Error('AI generation is not deployed yet. Follow GENERATION-SETUP.md.');}
     if(!response.ok)throw new Error(result.error||'AI generation is unavailable.');
     q=validateGenerated(result.question,item.topicId,item.type);usageInfo=result.usage;
     if(state.attempts.slice(-100).some(a=>a.fingerprint===fingerprint(q.prompt)))throw new Error('The AI repeated a recent question. Try another.');
    }catch(error){q=local();if(!q)throw error;generationNotice=(error.message||'AI is unavailable.')+' A built-in question of the same type is shown instead.';}
   }
  }
  if(state.session?.id!==identity||(user?.id||'demo')!==owner)return;
  if(q.engine==='concept')generationNotice+=(generationNotice?' ':'')+'Built-in conceptual practice has a finite set of variants.';
  pendingQuestion={sessionId:identity,seed:item.seed,type:item.type,question:q};
  if(await mutate(s=>{s.session.current=structuredClone(q);s.session.notice=generationNotice;}))pendingQuestion=null;
  else generationError='The question could not be saved. Retry to save this same question without generating another.';
 }catch(error){generationError=error.message||'Unable to prepare a question.';}
 finally{generating=false;render();}
}
function questionPage(){
 session=state.session;
 if(!session){const results=state.lastSession?.results;if(results)return heading('SESSION COMPLETE','That’s a little more learnt.','Your marks are saved; only errors and favourites retain question text.')+`<section class="card">${empty(`${results.reduce((n,a)=>n+a.score,0)}/${results.reduce((n,a)=>n+a.max,0)} marks`,`${results.length} questions completed · ${state.lastSession.skipped||0} skipped`,link('Back to overview →','dashboard')+' '+link('Review errors','mistakes','secondary'))}</section>`;return empty('Ready when you are.','Start a daily session or open a saved question.',link('Back to overview','dashboard'));}
 const item=session.plan[session.index],q=session.current;
 const top=`<div class="question-top"><a class="text-link" href="#dashboard">← Save & leave</a><span class="small muted">${esc(session.label)} · ${session.index+1} of ${session.plan.length}</span></div><div class="progress-line"><span style="width:${session.index/session.plan.length*100}%"></span></div>`;
 if(!q)return `<div class="question-layout">${top}<section class="card" aria-live="polite"><h2>${generating?'Preparing your question…':'Ready for your next question'}</h2><p>${esc(tid(item.topicId)?.name)} · ${esc(QUESTION_TYPES[item.type]?.label)}</p><p class="muted">${generating?'Generating and checking a question can take up to two minutes. You can leave this page; your plan is saved.':'Choose an action below to continue.'}</p>${generationError?`<div class="notice error">${esc(generationError)}</div>`:''}<div class="actions">${!generating?btn('Generate / retry','generate')+Object.keys(QUESTION_TYPES).filter(type=>supportedLocal(item.topicId,type)).map(type=>btn('Built-in: '+QUESTION_TYPES[type].label,'generate-local',`data-type="${type}"`,'secondary')).join('')+btn('Skip topic','skip','','ghost'):''}${btn('End session','end-session','','ghost')}</div></section></div>`;
 return `<div class="question-layout">${top}<section class="question-paper"><div class="actions"><span class="pill">${esc(sid(tid(q.topicId).subjectId).short)}</span><span class="pill">${esc(QUESTION_TYPES[q.type]?.label||'Saved practice')}</span><span class="pill">${q.marks} marks · ≈ ${q.minutes} min</span>${favouriteButton(q)}</div><p class="eyebrow" style="margin-top:22px">${esc(tid(q.topicId).name)}</p>${session.notice?`<div class="notice">${esc(session.notice)}</div>`:''}<div class="question-text">${esc(q.prompt)}</div><div class="workspace-hint">${q.type==='explanation'?'Write a connected explanation with clear causal links.':q.type==='recall'?'Try to recall the answer before looking at the solution.':'Work on paper. Show your method, units and assumptions.'}</div>${!session.revealed?btn('Reveal worked solution ↓','reveal'):`<section class="mark-scheme"><h3>${q.type==='explanation'?'Example answer':'Worked solution'}</h3>${q.modelAnswer?`<p class="worked-answer">${esc(q.modelAnswer)}</p>`:''}<h3>Marking points</h3><p class="small muted">One mark per point; accept equivalent valid answers. These are practice marking points, not an official exam-board mark scheme${q.type==='explanation'?' or a levels-based assessment':''}.</p><ol>${q.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></section><form id="mark-form"><div class="mark-grid"><label class="field"><span>Marks earned</span><select name="score" required><option value="">Choose your mark</option>${Array.from({length:q.marks+1},(_,i)=>`<option value="${i}">${i} / ${q.marks}</option>`).join('')}</select></label><label class="field"><span>How did it feel?</span><select name="confidence"><option value="unsure">Not confident yet</option><option value="okay" selected>Getting there</option><option value="confident">Confident</option></select></label></div><label class="field"><span>A note for next time (optional)</span><textarea name="note" maxlength="2000"></textarea></label><button class="btn">Save result & ${session.index+1===session.plan.length?'finish':'continue'} →</button></form>`}<p class="small muted" style="margin-top:24px">${esc(q.source)} · Self-marked practice${q.engine==='ai'?' · AI review can miss errors':''}</p><div class="actions">${btn('Skip without scoring','skip','','ghost compact')}${btn('Question looks wrong — discard','reject','','ghost compact')}${btn('End session','end-session','','ghost compact')}</div></section></div>`;
}
function remaining(timer=state.timer){return timer?Math.max(0,timer.running?Math.ceil((timer.endsAt-Date.now())/1000):timer.remaining):0;}
function tick(){const el=$('#paper-clock');if(!el||!state.timer)return;const left=remaining();el.textContent=`${String(Math.floor(left/3600)).padStart(2,'0')}:${String(Math.floor(left/60)%60).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;const status=$('#timer-status');if(status)status.textContent=left===0?'Time is up. Finish marking when you’re ready.':state.timer.running?'Timer running · You can open the paper in another tab.':'Timer paused.';}
function paperTimer(){const p=state.papers.find(p=>p.id===state.timer?.paperId);if(!p)return '';return `<section class="card" style="margin-bottom:24px"><div class="eyebrow">CURRENT PAPER</div><h2 style="margin-top:12px">${esc(p.title)}</h2><div id="paper-clock" class="timer" role="timer"></div><p id="timer-status" class="small muted"></p><div class="actions"><a class="btn secondary" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">Open paper ↗</a>${p.markUrl?`<a class="btn secondary" href="${esc(safeUrl(p.markUrl))}" target="_blank" rel="noopener noreferrer">Mark scheme ↗</a>`:''}${btn(state.timer.running?'Pause timer':'Resume timer','toggle-timer','','secondary')}</div><details><summary>Finish and record your score</summary><form id="paper-score-form" style="margin-top:18px"><div class="form-grid">${field('score',`Marks earned (out of ${p.max})`,'number',`required min="0" max="${p.max}" step="1"`)}${field('note','Reflection (optional)','text','maxlength="2000"')}</div><button class="btn">Save paper result</button></form></details></section>`;}
function papersPage(){return heading('PAST-PAPER PRACTICE','Bring it all together.','Find a paper, set aside some time and see what sticks.')+paperTimer()+`<div class="paper-grid">${SUBJECTS.map(s=>`<section class="card"><div class="subject-row" style="padding-top:0"><div class="symbol" style="--subject:${s.color}">${s.symbol}</div><div class="subject-info"><strong>${s.name}</strong><small>${s.board} · ${s.code}</small></div></div><p class="small muted">Use the official resource page to find available question papers and mark schemes.</p><a class="text-link" href="${s.url}" target="_blank" rel="noopener noreferrer">Browse official papers ↗</a></section>`).join('')}</div><section class="card" style="margin-top:24px"><div class="card-head"><div><h2>Your saved papers</h2><p>Save direct HTTPS links to the paper and mark scheme.</p></div></div>${state.papers.length?state.papers.map(p=>`<div class="topic-row"><div><strong>${esc(p.title)}</strong><small>${sid(p.subjectId).short} · ${p.duration} minutes · ${p.max} marks</small></div>${btn('Start →','start-paper',`data-id="${p.id}" ${state.timer?'disabled':''}`,'secondary compact')}</div>`).join(''):empty('Your paper shelf is ready.','Add your first paper below. Official PDFs stay on their publishers’ websites.')}<details ${state.papers.length?'':'open'}><summary>Add a past paper</summary><form id="paper-form" style="margin-top:22px"><div class="form-grid">${field('title','Paper title','text','required maxlength="180" placeholder="e.g. June 2024 · Pure Mathematics 1"')}<label class="field"><span>Subject</span><select name="subjectId">${subOptions()}</select></label>${field('url','Question paper URL','url','required placeholder="https://…"')}${field('markUrl','Mark-scheme URL (optional)','url','placeholder="https://…"')}${field('duration','Duration in minutes','number','required value="120" min="1" max="360" step="1"')}${field('max','Maximum marks','number','required value="100" min="1" max="500" step="1"')}</div><button class="btn">Save paper</button></form></details></section><section class="card" style="margin-top:24px"><h2>Paper history</h2>${state.paperAttempts.length?`<div class="table-wrap"><table><thead><tr><th>Paper</th><th>Date</th><th>Score</th><th>Reflection</th></tr></thead><tbody>${[...state.paperAttempts].reverse().map(a=>`<tr><td>${esc(state.papers.find(p=>p.id===a.paperId)?.title||a.title)}</td><td>${dayKey(new Date(a.at))}</td><td>${a.score}/${a.max} (${Math.round(a.score/a.max*100)}%)</td><td class="break-word">${esc(a.note)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted small">Completed papers will appear here. Paper totals do not change topic scores.</p>'}</section>`;}
function bankPage(){return favouritesPage();}
function settingsPage(){return heading('YOUR PREFERENCES','A routine that works for you.','Choose the questions you want to practise.')+`<div class="grid"><section class="card"><form id="settings-form"><h2>Question types</h2><p class="small muted">Selected types rotate across topics and sessions. Maths and Further Maths give problem solving extra weight.</p>${Object.entries(QUESTION_TYPES).map(([id,t])=>`<label class="check-label"><input type="checkbox" name="questionTypes" value="${id}" ${state.settings.questionTypes.includes(id)?'checked':''}>${t.label} · ${t.range}</label>`).join('')}<label class="field"><span>Questions per session</span><select name="sessionSize">${[4,6,8,12,16].map(n=>`<option value="${n}" ${state.settings.sessionSize===n?'selected':''}>${n}</option>`).join('')}</select></label><label class="field"><span>Question source</span><select name="generationMode"><option value="combined" ${state.settings.generationMode==='combined'?'selected':''}>Combined — calculated templates + AI</option><option value="builtin" ${state.settings.generationMode==='builtin'?'selected':''}>Built-in only — no AI charges, limited coverage</option></select></label><label class="field"><span>AI difficulty</span><select name="difficulty"><option value="standard" ${state.settings.difficulty==='standard'?'selected':''}>Standard A-level</option><option value="stretch" ${state.settings.difficulty==='stretch'?'selected':''}>Stretch — unfamiliar applications</option></select><small>Applies to AI questions. Built-in problems keep their designed difficulty.</small></label><label class="field"><span>Topic interval</span><select name="cadence"><option value="1" ${state.settings.cadence===1?'selected':''}>Every day</option><option value="2" ${state.settings.cadence===2?'selected':''}>Every two days</option></select><small>Measured from the most recent scored attempt, using London calendar days. Skips do not mark a topic complete.</small></label><hr><h2>Further Maths modules</h2><p class="small muted">Select every module you study. Core Pure is always available; these are revision choices, not exam entries.</p>${Object.entries(OPTIONS).map(([id,label])=>`<label class="check-label"><input type="checkbox" name="fmOptions" value="${id}" ${state.settings.fmOptions.includes(id)?'checked':''}>${label}</label>`).join('')}<button class="btn">Save preferences</button></form></section><div><section class="card"><h2>AI usage</h2><p class="small muted">Built-in questions do not use the API. Each AI request includes generation and a separate review. Failed or rejected requests count towards the daily allowance.</p>${usageInfo?`<p>${usageInfo.requests} / ${usageInfo.limit||'configured daily limit'} requests · ${esc(usageInfo.day)}</p><p class="small muted">${usageInfo.input??usageInfo.input_tokens??0} input tokens · ${usageInfo.output??usageInfo.output_tokens??0} output tokens ${usageInfo.input!==undefined?'in the last request':'recorded today'}.</p>`:'<p class="small muted">No usage loaded yet.</p>'}${btn('Refresh today’s usage','usage','','secondary')}<p class="small muted">Token counts help track usage; check your API billing dashboard for actual charges. Failed network calls may have incomplete token reporting.</p></section><section class="card" style="margin-top:24px"><h2>What is kept?</h2><p class="small muted">The active question is saved temporarily for resuming. After marking, only errors and starred questions retain their text and solutions. Marks, topic, type and dates remain for your charts.</p><p class="small muted">Questions you previously uploaded are preserved as favourites. AI output is separately reviewed, but can still contain mistakes. Discard a suspect question without scoring it.</p></section><section class="card" style="margin-top:24px"><h2>Keep a copy</h2><p class="small muted">Export saved questions, progress and the active session.</p>${btn('Download data backup ↓','export','','secondary')}</section></div></div>`;}

function render(){
 if(recovery){authMode='update';authPage();return;}
 if(!user&&!demo){authPage();return;}
 if(loading){$('#app').innerHTML='<main class="boot"><div class="logo-mark">r.</div><p>Loading your saved progress…</p></main>';return;}
 if(loadError){$('#app').innerHTML=`<main class="boot"><h2>We couldn’t load your progress.</h2><p class="muted">${esc(loadError)}</p><p>Check the Supabase connection and run supabase.sql before trying again.</p><div class="actions">${btn('Try again','reload')}${btn('Sign out','logout','','secondary')}</div></main>`;return;}
 const [view,id]=route();let content;
 switch(view){case'progress':content=progressPage(id);break;case'topics':content=topicsPage(id);break;case'mistakes':content=mistakesPage();break;case'papers':content=papersPage();break;case'bank':case'favourites':content=favouritesPage();break;case'settings':content=settingsPage();break;case'session':content=questionPage();break;default:content=dashboard();}
 shell(content,view);
}
async function loadAccount(){if(loading)return;loading=true;loadError='';render();try{store=new StudyStore(client,user?.id,demo);state=await store.load();session=state.session;}catch(e){loadError=e.message||'Connection unavailable.';}finally{loading=false;render();}}
function download(name,value){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function action(name,el){
 switch(name){
  case'toggle-theme':window.revisionTheme?.toggle();el.setAttribute('aria-pressed',String(window.revisionTheme?.isDark() || false));break;
  case'auth-mode':authMode=el.dataset.mode;authPage();break;
  case'demo':demo=true;user=null;session=null;recovery=false;history.replaceState(null,'','#dashboard');await loadAccount();break;
  case'logout':if(!demo&&client){const {error}=await client.auth.signOut();if(error)throw error;}demo=false;user=null;state=initialState();session=null;store=null;usageInfo=null;pendingQuestion=null;recovery=false;authMode='login';history.replaceState(null,'',location.pathname);render();break;
  case'reload':await loadAccount();break;
  case'start-daily':await startSession(due(),'Daily revision');break;
  case'start-subject':await startSession(due().filter(q=>tid(q.topicId).subjectId===el.dataset.id),sid(el.dataset.id).short);break;
  case'chart':navigate('progress/'+el.dataset.id);break;
  case'toggle-topic':if(await mutate(s=>{s.unlocked=s.unlocked.includes(el.dataset.id)?s.unlocked.filter(id=>id!==el.dataset.id):[...s.unlocked,el.dataset.id];}))render();break;
  case'unlock-subject':if(await mutate(s=>{s.unlocked=[...new Set([...s.unlocked,...TOPICS.filter(t=>t.subjectId===el.dataset.id&&isTopicEligible(t,s)).map(t=>t.id)])];})){render();toast('Topics unlocked. Your daily plan is ready.');}break;
  case'practice-topic':if(!state.unlocked.includes(el.dataset.id)||!isTopicEligible(tid(el.dataset.id),state)){toast('Unlock this topic first to add it to your revision.');navigate('topics/'+tid(el.dataset.id).subjectId);break;}await startSession([{topicId:el.dataset.id,type:nextType(state,tid(el.dataset.id))}],tid(el.dataset.id).name);break;
  case'practice-question':{const q=allQuestions().find(q=>q.id===el.dataset.id);if(q)await startSession([q],'Saved question',true);break;}
  case'review-all':await startSession(wrong(),'Error review',true);break;
  case'review-favourites':await startSession(state.savedQuestions.filter(q=>state.favouriteIds.includes(q.id)),'Favourites',true);break;
  case'reveal':if(state.session?.current&&await mutate(s=>s.session.revealed=true)){render();$('.mark-scheme')?.scrollIntoView({block:'nearest'});}break;
  case'favourite':{const q=allQuestions().find(q=>q.id===el.dataset.id);if(q&&await mutate(s=>toggleFavourite(s,q))){if(route()[0]==='session'&&el.setAttribute){const on=state.favouriteIds.includes(q.id);el.setAttribute('aria-pressed',String(on));el.setAttribute('aria-label',(on?'Remove from':'Add to')+' favourites');el.textContent=on?'★ Favourited':'☆ Favourite';}else render();}break;}
  case'resume':navigate('session');await loadNext();break;
  case'generate':await loadNext();break;
  case'generate-local':await loadNext(true,el.dataset.type);break;
  case'skip':case'reject':{
   if(!state.session||generating)break;
   if(await mutate(s=>{
    if(s.session.current){if(name==='reject'){const id=s.session.current.id;s.favouriteIds=s.favouriteIds.filter(x=>x!==id);s.savedQuestions=s.savedQuestions.filter(q=>q.id!==id);}finishQuestion(s);}
    else {s.session.index++;s.session.skipped++;if(s.session.index>=s.session.plan.length){s.lastSession={results:s.session.results,skipped:s.session.skipped};s.session=null;}}
   })){render();await loadNext();}break;
  }
  case'end-session':if(await mutate(s=>{s.lastSession={results:s.session?.results||[],skipped:s.session?.skipped||0};s.session=null;})){render();}break;
  case'usage':{
   if(demo){toast('Demo uses built-in practice only.');break;}
   const {data,error}=await client.from('generation_usage').select('day,requests,input_tokens,output_tokens').eq('user_id',user.id).eq('day',dayKey()).maybeSingle();
   if(error)throw new Error('Usage could not load. Check that generation-migration.sql has been run.');usageInfo=data||{day:dayKey(),requests:0,input_tokens:0,output_tokens:0};render();break;
  }
  case'start-paper':if(state.timer){toast('Finish your current paper first.');break;}if(await mutate(s=>{const p=s.papers.find(p=>p.id===el.dataset.id);s.timer={paperId:p.id,remaining:p.duration*60,endsAt:Date.now()+p.duration*60000,running:true};})){render();window.scrollTo(0,0);}break;
  case'toggle-timer':if(await mutate(s=>{if(s.timer.running){s.timer.remaining=remaining(s.timer);s.timer.running=false;}else{s.timer.endsAt=Date.now()+s.timer.remaining*1000;s.timer.running=true;}}))render();break;
  case'export':download('revision-studio-backup-'+dayKey()+'.json',{exportedAt:new Date().toISOString(),...state});toast('Backup downloaded.');break;
 }
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||busy||el.disabled)return;action(el.dataset.action,el).catch(e=>toast(e.message||'Something went wrong.',true));});
document.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const form=e.target,fd=new FormData(form);const value=name=>String(fd.get(name)||'').trim();
 try{
  if(form.id==='auth-form'){
   if(!client)throw new Error('Configure Supabase first. See START-HERE.md.');const submit=form.querySelector('button');submit.disabled=true;
   try{let result;const email=value('email'),password=String(fd.get('password')||'');const redirectTo=location.origin+location.pathname;
    if(authMode==='reset'){result=await client.auth.resetPasswordForEmail(email,{redirectTo});if(result.error)throw result.error;toast('If the address has an account, a reset link will be sent.');}
    else if(authMode==='update'){result=await client.auth.updateUser({password});if(result.error)throw result.error;recovery=false;authMode='login';user=result.data.user;history.replaceState(null,'','#dashboard');toast('Password updated.');await loadAccount();}
    else if(authMode==='signup'){result=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});if(result.error)throw result.error;if(result.data.session){user=result.data.user;await loadAccount();}else{authMode='login';render();toast('Check your inbox to confirm your email, then sign in.');}}
    else{result=await client.auth.signInWithPassword({email,password});if(result.error)throw result.error;user=result.data.user;demo=false;await loadAccount();}
   }finally{submit.disabled=false;}return;
  }
  if(form.id==='mark-form'){
   const current=state.session;if(!current?.revealed||!current.current)return;
   const q=current.current,score=Number(value('score'));
   if(value('score')===''||!Number.isInteger(score)||score<0||score>q.marks)throw new Error('Choose a valid mark.');
   const attempt={id:crypto.randomUUID(),questionId:q.id,topicId:q.topicId,subjectId:tid(q.topicId).subjectId,type:q.type||'legacy',engine:q.engine||'legacy',fingerprint:fingerprint(q.prompt),review:current.review,score,max:q.marks,confidence:value('confidence'),note:value('note'),at:new Date().toISOString()};
   if(await mutate(s=>finishQuestion(s,attempt))){render();window.scrollTo(0,0);await loadNext();}return;
  }
  if(form.id==='settings-form'){
   const fmOptions=fd.getAll('fmOptions'),questionTypes=fd.getAll('questionTypes');
   if(!validOptions(fmOptions))throw new Error('Choose valid Further Maths modules.');
   if(!questionTypes.length||questionTypes.some(t=>!Object.hasOwn(QUESTION_TYPES,t)))throw new Error('Select at least one question type.');
   const sessionSize=Number(value('sessionSize')),cadence=Number(value('cadence')),generationMode=value('generationMode'),difficulty=value('difficulty');
   if(![4,6,8,12,16].includes(sessionSize)||![1,2].includes(cadence)||!['combined','builtin'].includes(generationMode)||!['standard','stretch'].includes(difficulty))throw new Error('Choose valid preferences.');
   if(await mutate(s=>{s.settings={...s.settings,cadence,fmOptions,questionTypes,sessionSize,generationMode,difficulty};})){render();toast('Preferences saved. Changes apply to new sessions.');}return;
  }
  if(form.id==='paper-form'){
   const p={id:crypto.randomUUID(),subjectId:value('subjectId'),title:value('title'),url:safeUrl(value('url')),markUrl:safeUrl(value('markUrl')),duration:Number(value('duration')),max:Number(value('max'))};
   if(!p.url||(value('markUrl')&&!p.markUrl))throw new Error('Use a valid HTTPS address for each paper link.');
   if(!sid(p.subjectId)||!p.title||p.title.length>180||!Number.isInteger(p.duration)||p.duration<1||p.duration>360||!Number.isInteger(p.max)||p.max<1||p.max>500)throw new Error('Check the title, duration and marks.');
   if(await mutate(s=>s.papers.push(p))){render();toast('Paper saved to your shelf.');}return;
  }
  if(form.id==='paper-score-form'){
   if(!state.timer)return;const p=state.papers.find(p=>p.id===state.timer.paperId),score=Number(value('score'));if(value('score')===''||!Number.isInteger(score)||score<0||score>p.max)throw new Error('Enter a valid paper mark.');
   if(await mutate(s=>{s.paperAttempts.push({id:crypto.randomUUID(),paperId:p.id,title:p.title,subjectId:p.subjectId,score,max:p.max,note:value('note'),at:new Date().toISOString()});s.timer=null;})){render();toast('Paper result saved.');}return;
  }
 }catch(e){toast(e.message||'Could not complete that action.',true);}
});
window.addEventListener('hashchange',()=>{if(!loading){render();window.scrollTo(0,0);}});
window.addEventListener('online',()=>toast('Connection restored. You can retry any unsaved action.'));
window.addEventListener('offline',()=>toast('You’re offline. Account changes need a connection; unsaved forms stay on screen.',true));
setInterval(tick,1000);
// Wait for the deferred Supabase and KaTeX scripts before initialising.
if(document.readyState!=='complete')await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
config=window.REVISION_CONFIG || {};
try{
 if(config.supabaseUrl&&config.supabasePublishableKey){
  if(!window.supabase)throw new Error('The sign-in library could not load. Check your connection and refresh.');
  if(!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl))throw new Error('Use the HTTPS Project URL from Supabase in config.js.');
  if(config.supabasePublishableKey.startsWith('sb_secret_'))throw new Error('A secret key must never be used in config.js. Replace it with the public publishable key and rotate the exposed secret.');
  client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
  client.auth.onAuthStateChange((event,sessionData)=>{
   if(event==='PASSWORD_RECOVERY'){recovery=true;user=sessionData?.user;setTimeout(render,0);}
   if(event==='SIGNED_OUT'&&!demo){user=null;state=initialState();session=null;store=null;setTimeout(render,0);}
   // Avoid async Supabase calls inside this callback (auth holds its lock).
   if(event==='SIGNED_IN'&&sessionData?.user&&user?.id!==sessionData.user.id){user=sessionData.user;demo=false;setTimeout(()=>loadAccount(),0);}
  });
  const {data,error}=await client.auth.getSession();if(error)throw error;user=data.session?.user;
  if(user&&!recovery){if(location.hash.includes('access_token'))history.replaceState(null,'','#dashboard');await loadAccount();}else render();
 }else render();
}catch(e){render();toast(e.message,true);}
