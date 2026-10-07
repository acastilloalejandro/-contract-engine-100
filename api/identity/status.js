import {json,readJson} from "../_lib/http.js";
import {authidRequest,normalizeAuthIdResult} from "../_lib/authid.js";

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  try{
    const body=await readJson(req);
    const operationId=String(body.operationId||"").trim();
    if(!operationId) return json(res,400,{error:"operationId_required"});
    const result=await authidRequest("/IDCompleteBackendEngine/IdentityService/v1/operations/"+encodeURIComponent(operationId));
    return json(res,200,{operationId,...normalizeAuthIdResult(result)});
  }catch(error){
    return json(res,500,{error:"identity_status_failed",detail:error.message});
  }
}
