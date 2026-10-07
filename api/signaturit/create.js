import {json,readJson,requireEnv} from "../_lib/http.js";

const base=()=>process.env.SIGNATURIT_BASE_URL||"https://api.sandbox.signaturit.com/v3";

function dataUrlToBlob(value){
  const m=String(value||"").match(/^data:([^;]+);base64,(.+)$/);
  if(!m) throw new Error("document must be a base64 data URL");
  return new Blob([Buffer.from(m[2],"base64")],{type:m[1]});
}

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  try{
    const body=await readJson(req);
    if(!body.recipient?.email||!body.recipient?.name||!body.document?.dataUrl)
      return json(res,400,{error:"recipient_and_document_required"});
    const form=new FormData();
    form.append("recipients[0][name]",String(body.recipient.name));
    form.append("recipients[0][email]",String(body.recipient.email));
    form.append("files[0]",dataUrlToBlob(body.document.dataUrl),String(body.document.name||"contract.pdf"));
    form.append("subject",String(body.subject||"Contract Engine signature request"));
    form.append("body",String(body.body||"Please review and sign the document."));
    if(body.recordId) form.append("data[record_id]",String(body.recordId));
    if(body.hash) form.append("data[document_hash]",String(body.hash));
    const r=await fetch(base()+"/signatures.json",{
      method:"POST",
      headers:{Authorization:"Bearer "+requireEnv("SIGNATURIT_ACCESS_TOKEN")},
      body:form
    });
    const text=await r.text();
    let result;try{result=JSON.parse(text)}catch{result={raw:text}};
    if(!r.ok) return json(res,r.status,{error:"signaturit_create_failed",provider:result});
    const signatureId=result.id;
    const documentId=result.documents?.[0]?.id;
    return json(res,200,{provider:"signaturit",status:"sent",signatureId,documentId,providerResponse:result});
  }catch(error){
    return json(res,500,{error:"signature_create_failed",detail:error.message});
  }
}
