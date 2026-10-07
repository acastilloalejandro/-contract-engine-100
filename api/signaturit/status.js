import {json} from "../_lib/http.js";
import {requireEnv} from "../_lib/http.js";

export default async function handler(req,res){
  if(req.method!=="GET") return json(res,405,{error:"method_not_allowed"});
  try{
    const id=String(req.query?.id||new URL(req.url,"http://localhost").searchParams.get("id")||"").trim();
    if(!id) return json(res,400,{error:"signature_id_required"});
    const base=process.env.SIGNATURIT_BASE_URL||"https://api.sandbox.signaturit.com/v3";
    const r=await fetch(base+"/signatures/"+encodeURIComponent(id)+".json",{headers:{Authorization:"Bearer "+requireEnv("SIGNATURIT_ACCESS_TOKEN"),accept:"application/json"}});
    const text=await r.text();let result;try{result=JSON.parse(text)}catch{result={raw:text}};
    if(!r.ok) return json(res,r.status,{error:"signaturit_status_failed",provider:result});
    return json(res,200,{provider:"signaturit",signatureId:id,result});
  }catch(error){return json(res,500,{error:"signature_status_failed",detail:error.message});}
}
