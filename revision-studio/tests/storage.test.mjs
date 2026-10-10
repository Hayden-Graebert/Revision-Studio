import test from 'node:test';
import assert from 'node:assert/strict';
import {StudyStore} from '../public/storage.js';
import {initialState} from '../public/model.js';
function fakeClient(){
 let row=null;
 return {get row(){return row;},from(){return {
  async upsert(value){row??=structuredClone(value);return {error:null};},
  select(){return {eq(){return {async single(){return {data:structuredClone(row),error:null};}};}};},
  update(value){const filters={};const query={eq(k,v){filters[k]=v;return query;},async select(){if(filters.user_id!==row.user_id||filters.revision!==row.revision)return {data:[],error:null};row={...row,...structuredClone(value)};return {data:[{revision:row.revision}],error:null};}};return query;}
 };}};
}
test('account writes persist; simultaneous stale device cannot overwrite the newer revision',async()=>{
 const client=fakeClient(),a=new StudyStore(client,'user-a'),b=new StudyStore(client,'user-a');
 const sa=await a.load(),sb=await b.load();sa.unlocked=['m-diff'];await a.save(sa);
 sb.unlocked=['p-material'];await assert.rejects(b.save(sb),e=>e.conflict===true);
 assert.deepEqual(client.row.data.unlocked,['m-diff']);
 const fresh=await b.load();fresh.unlocked.push('p-material');await b.save(fresh);
 assert.deepEqual((await a.load()).unlocked,['m-diff','p-material']);
});
test('backend error is surfaced; no false success',async()=>{const store=new StudyStore({from(){return {update(){return {eq(){return {eq(){return {async select(){return {error:new Error('network unavailable')}}}}}}}}}}},'u');await assert.rejects(store.save(initialState()),/network unavailable/);});
