import {requireEnv} from "./http.js";

const BASE=()=>process.env.AUTHID_BASE_URL||"https://id.authid.ai";
let tokenCache=null;

async function accessToken(){
  if(tokenCache&&tokenCache.expiresAt>Date.now()+30_000) return tokenCache.token;
  const id=requireEnv("AUTHID_API_KEY_ID");
  const value=requireEnv("AUTHID_API_KEY_VALUE");
  const basic=Buffer.from(id+":"+value).toString("base64");
  const r=await fetch(BASE()+"/IDCompleteBackendEngine/IdentityService/v1/auth/token",{
    method:"POST",
    headers:{accept:"application/json",Authorization:"Basic "+basic}
  });
  if(!r.ok) throw new Error("authID token request failed: "+r.status);
  const data=await r.json();
  const token=data.AccessToken||data.access_token;
  if(!token) throw new Error("authID did not return an access token");
  tokenCache={token,expiresAt:Date.now()+Math.max(60_000,Number(data.ExpiresIn||data.expires_in||300)*1000)};
  return token;
}

export async function authidRequest(path,options={}){
  const token=await accessToken();
  const headers={...(options.headers||{}),Authorization:"Bearer "+token,accept:"application/json"};
  const r=await fetch(BASE()+path,{...options,headers});
  const text=await r.text();
  let body;
  try{body=JSON.parse(text)}catch{body={raw:text}};
  if(!r.ok) throw new Error("authID request failed: "+r.status+" "+JSON.stringify(body));
  return body;
}

export function normalizeAuthIdResult(result){
  const d=result?.Payload?.Data||result?.Data||result||{};
  const live=d.LivenessDetectionResult?.IsLive??d.LivenessDetectionResult?.isLive;
  const matched=d.Matched;
  const expired=typeof d.Document?.Data?.DateOfExpiry==="string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.Document.Data.DateOfExpiry) &&
    new Date(d.Document.Data.DateOfExpiry+"T23:59:59Z")<new Date();
  const rejected=matched===false||live===false||
    d.Document?.Data?.selfieInjectionAttackDetectionResult==="FAIL"||
    d.Document?.Data?.documentInjectionAttackDetectionResult==="FAIL"||
    d.Document?.Data?.BarcodeSecurity==="FAIL"||
    expired;
  const review=d.Document?.Data?.mismatchMrzOcr===true||d.Document?.Data?.padResult==="FAIL"||
    d.Document?.Data?.documentInjectionAttackDetectionResult==="FAIL";
  return {
    status:rejected?"failed":review?"review":"verified",
    checks:{
      documentAuthenticity:d.Document?.Data?.BarcodeSecurity==="FAIL"?"fail":review?"review":"pass",
      dataConsistency:d.Document?.Data?.mismatchMrzOcr===true?"fail":"pass",
      liveness:live===false?"fail":live===true?"pass":"not-run"
    },
    provider:"authID",
    checkedAt:new Date().toISOString(),
    source:result
  };
}
