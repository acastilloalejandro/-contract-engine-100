import {json,readJson,requireEnv} from "../_lib/http.js";
import {authidRequest} from "../_lib/authid.js";

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  try{
    const body=await readJson(req);
    const accountNumber=String(body.accountNumber||"").trim();
    if(!accountNumber) return json(res,400,{error:"accountNumber_required"});
    const result=await authidRequest("/IDCompleteBackendEngine/IdentityService/v1/operations",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        AccountNumber:accountNumber,
        Payload:{DocumentTypes:body.documentTypes||["5"]},
        Codeword:"",
        Name:"GetForeignIDDocument",
        Timeout:3600,
        TransportType:0,
        Tag:String(body.recordId||"")
      })
    });
    const operationId=result.OperationId||result.operationId;
    const secret=result.OneTimeSecret||result.oneTimeSecret;
    if(!operationId||!secret) return json(res,502,{error:"identity_provider_invalid_response"});
    const base=process.env.AUTHID_UI_BASE_URL||"https://id.authid.ai/";
    return json(res,200,{provider:"authID",status:"pending",operationId,oneTimeSecret:secret,uiUrl:base+"?i="+encodeURIComponent(operationId)+"&s="+encodeURIComponent(secret)});
  }catch(error){
    return json(res,500,{error:"identity_start_failed",detail:error.message});
  }
}
