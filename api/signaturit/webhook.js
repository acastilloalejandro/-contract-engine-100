import {json,readJson} from "../_lib/http.js";

const ALLOWED_IP="34.241.96.22";
const map={
  document_opened:"opened",
  document_signed:"signed",
  document_completed:"completed",
  document_declined:"declined",
  document_expired:"expired",
  document_canceled:"cancelled",
  audit_trail_completed:"audit_ready",
  photo_id_added:"identity_document_attached"
};

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  const forwarded=String(req.headers["x-forwarded-for"]||"").split(",")[0].trim();
  if(process.env.NODE_ENV==="production"&&forwarded&&forwarded!==ALLOWED_IP)
    return json(res,403,{error:"webhook_source_not_allowed"});
  try{
    const event=await readJson(req);
    const type=event.type||event.event_type;
    return json(res,200,{accepted:true,type,status:map[type]||"unmapped",receivedAt:new Date().toISOString()});
  }catch(error){return json(res,400,{error:"invalid_webhook",detail:error.message});}
}
