import {initialState, normaliseState} from './model.js';
export class StudyStore {
  constructor(client,userId,demo=false){this.client=client;this.userId=userId;this.demo=demo;this.revision=0;}
  async load(){
    if(this.demo){const raw=localStorage.getItem('revision-studio-demo-v1');return raw?normaliseState(JSON.parse(raw)):initialState();}
    const {error:initError}=await this.client.from('revision_state').upsert({user_id:this.userId,data:initialState(),revision:0},{onConflict:'user_id',ignoreDuplicates:true});
    if(initError)throw initError;
    const {data,error}=await this.client.from('revision_state').select('data,revision').eq('user_id',this.userId).single();
    if(error)throw error;
    this.revision=data.revision;return normaliseState(data.data);
  }
  async save(state){
    if(this.demo){localStorage.setItem('revision-studio-demo-v1',JSON.stringify(state));return;}
    const {data,error}=await this.client.from('revision_state').update({data:state,revision:this.revision+1,updated_at:new Date().toISOString()}).eq('user_id',this.userId).eq('revision',this.revision).select('revision');
    if(error)throw error;
    if(!data?.length){const e=new Error('Your data changed in another tab or device. The latest version has been loaded. Please repeat this action.');e.conflict=true;throw e;}
    this.revision=data[0].revision;
  }
}
