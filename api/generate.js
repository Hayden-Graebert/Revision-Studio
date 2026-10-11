import {generateReviewed,ApiError} from '../server/generator.js';
import {TOPICS} from '../public/data.js';
import {QUESTION_TYPES} from '../public/generation.js';
export function createHandler({env=process.env,fetcher=fetch,generate=generateReviewed}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  let usage={input:0,output:0},reserved=false,userId,day;
  const json=(status,data)=>res.status(status).json(data);
  const rpc=async(name,body)=>{
   const r=await fetcher(`${env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify(body)});
   if(!r.ok)throw new ApiError(503,'AI usage protection is unavailable. Run the generation SQL migration and check the server settings.');
   return r.json();
  };
  try{
   if(req.method!=='POST'){res.setHeader('Allow','POST');return json(405,{error:'Use POST.'});}
   for(const key of ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','ALLOWED_USER_ID'])if(!env[key])throw new ApiError(503,'AI generation is not configured yet. Follow GENERATION-SETUP.md; built-in practice remains available.');
   const auth=req.headers.authorization;
   if(typeof auth!=='string'||!/^Bearer \S+$/.test(auth))throw new ApiError(401,'Sign in to generate AI questions.');
   const authResponse=await fetcher(`${env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
   if(!authResponse.ok)throw new ApiError(401,'Your sign-in expired. Sign in again.');
   const user=await authResponse.json();userId=user.id;
   if(!userId||userId!==env.ALLOWED_USER_ID)throw new ApiError(403,'AI generation is enabled only for the configured account.');
   let body=req.body;
   if(typeof body==='string'){if(body.length>2000)throw new ApiError(413,'Request too large.');try{body=JSON.parse(body);}catch{throw new ApiError(400,'Invalid request.');}}
   if(!body||JSON.stringify(body).length>2000||!TOPICS.some(t=>t.id===body.topicId)||!Object.hasOwn(QUESTION_TYPES,body.type)||typeof body.seed!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(body.seed)||!['standard','stretch'].includes(body.difficulty||'standard'))throw new ApiError(400,'Choose a valid topic, type and difficulty.');
   // Always apply a bounded server-side allowance, even if the client is modified.
   const limit=Math.min(100,Math.max(1,Number.parseInt(env.AI_DAILY_LIMIT||'30',10)||30));
   const budget=await rpc('reserve_generation',{p_user_id:userId,p_limit:limit});
   if(!budget.allowed)throw new ApiError(429,budget.reason==='cooldown'?'Please wait a few seconds before generating again.':'Today’s AI request allowance is used. Built-in questions are still available.');
   reserved=true;day=budget.day;
   const question=await generate({topicId:body.topicId,type:body.type,seed:body.seed,difficulty:body.difficulty||'standard'},env,fetcher,u=>{usage.input+=Number(u.input_tokens)||0;usage.output+=Number(u.output_tokens)||0;});
   // Account for usage before replying, but a telemetry failure must not discard a valid question.
   let usageRecorded=true;try{await rpc('record_generation_usage',{p_user_id:userId,p_day:day,p_input:usage.input,p_output:usage.output});}catch{usageRecorded=false;}
   reserved=false;
   return json(200,{question,usage:{...usage,requests:budget.requests,limit,day,recorded:usageRecorded}});
  }catch(e){
   if(reserved)try{await rpc('record_generation_usage',{p_user_id:userId,p_day:day,p_input:usage.input,p_output:usage.output});}catch{}
   return json(e.status||503,{error:e instanceof ApiError?e.message:'Generation timed out or was unavailable. Your existing progress is safe; try built-in practice.'});
  }
 };
}
export default createHandler();
