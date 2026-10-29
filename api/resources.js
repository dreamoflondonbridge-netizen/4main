import {validateInput,searchResources} from '../lib/search.mjs';
const cache=new Map();const limits=new Map();let active=0;
export default async function handler(req,res){
 const origin=req.headers.origin;const permitted=process.env.ALLOWED_ORIGIN;
 if(origin&&permitted&&origin!==permitted){res.statusCode=403;return res.end()}
 if(origin&&permitted){res.setHeader('Access-Control-Allow-Origin',permitted);res.setHeader('Vary','Origin')}
 res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS'){res.statusCode=204;return res.end()}
 const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data))};
 if(req.method!=='POST')return send(405,{error:'POST 요청만 사용할 수 있어요.'});
 let input;try{let raw=req.body;if(raw===undefined){let s='';for await(const c of req){s+=c;if(Buffer.byteLength(s)>4096)return send(413,{error:'입력 내용이 너무 길어요.'})}raw=JSON.parse(s)}if(typeof raw==='string')raw=JSON.parse(raw);input=validateInput(raw)}catch{return send(400,{error:'주제·목적·글 유형을 다시 확인해 주세요.'})}
 const k=JSON.stringify(input);const now=Date.now();const hit=cache.get(k);if(hit&&hit.until>now)return send(200,{resources:hit.resources,cached:true});
 if(!process.env.WRITING_AI_KEY)return send(503,{error:'AI 자료 검색 연결을 준비 중이에요. 지금은 예시 자료로 연습할 수 있어요.'});
 const ip=req.socket?.remoteAddress||'shared';let limit=limits.get(ip);if(!limit||now>limit.until){limit={count:0,until:now+60000};limits.set(ip,limit)}
 if(limit.count>=6||active>=3)return send(429,{error:'검색 요청이 많아요. 잠시 후 다시 시도해 주세요.'});limit.count++;active++;
 try{const resources=await searchResources(input,{key:process.env.WRITING_AI_KEY,model:process.env.WRITING_AI_MODEL||'gpt-4.1-mini'});if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(k,{resources,until:now+3600000});if(limits.size>500)for(const [id,l]of limits)if(l.until<now)limits.delete(id);return send(200,{resources})}
 catch(e){const messages={AUTH:'AI 검색 연결을 확인 중이에요. 선생님께 알려 주세요.',QUOTA:'현재 검색 사용 한도에 도달했어요. 선생님께 알려 주세요.',RESULT:'출처를 확인할 수 있는 자료가 부족해요. 주제를 조금 더 구체적으로 바꿔 보세요.'};return send(502,{error:messages[e.message]||'자료를 찾지 못했어요. 잠시 후 다시 시도해 주세요.'})}finally{active--}
}
