import {VERSION,MAX_FILE_BYTES,SCHEMA,RISK_MAP} from "./schema.js";

export const STORAGE_KEY="ce100:v6";
export const MAX_SNAPSHOTS=8;
export const state={
  view:"form",nav:"form",role:"tenant",dark:false,
  recordId:crypto.randomUUID?.()||String(Date.now()),
  data:{actor:"tenant",rentalPurpose:"habitual",contractForm:"new",contractLanguage:"es",tensionedZone:false,largeHolder:false,landlordLargeHolder:"unsure",landlordIsCompany:false,touristUse:false,additionalGuaranteeMonths:0,rentIndex:"irav",depositMonths:1},
  docs:[],audit:[],snapshots:[],hash:"",prepared:null,qrUrl:"",saveTimer:null
};

export const filled=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&v.length===0);
export const visibleFields=()=>SCHEMA.filter(f=>(!f.actor||f.actor.includes(state.role))&&f.when(state.data));

export function riskAssessment(){
  const flags=[],d=state.data;
  for(const [id,label,weight] of RISK_MAP){
    const v=d[id];
    if(id==="tensionedZone"&&v===true)flags.push({id,label,weight,severity:"review"});
    else if(id==="largeHolder"&&v===true)flags.push({id,label,weight,severity:"review"});
    else if(id==="documentsComplete"&&!v)flags.push({id,label,weight,severity:"elevated"});
    else if(id==="rentComplianceEvidence"&&d.tensionedZone===true&&!filled(v))flags.push({id,label,weight,severity:"elevated"});
  }
  const score=flags.reduce((n,f)=>n+f.weight,0);
  return{flags,score,level:score>=4?"HIGH":score>=2?"REVIEW":"NORMAL"};
}

export function validate(){
  const errors=[],warnings=[],d=state.data;
  for(const f of visibleFields()){
    if(!f.required)continue;
    const v=d[f.id];
    if(f.type==="checkbox"?v!==true:f.type==="file"?!(v&&v.id):!filled(v))errors.push({field:f.id,message:"Falta: "+f.label+"."});
  }
  if(d.startDate&&d.endDate&&d.endDate<d.startDate)errors.push({field:"endDate",message:"La fecha final es anterior a la fecha inicial."});
  if(Number(d.occupants||0)<1)errors.push({field:"occupants",message:"Debe existir al menos una persona ocupante."});
  if(Number(d.depositMonths)!==1)warnings.push({field:"depositMonths",message:"La fianza legal ordinaria de vivienda es una mensualidad; revisa el supuesto aplicable."});
  if(Number(d.additionalGuaranteeMonths)<0)errors.push({field:"additionalGuaranteeMonths",message:"La garantía adicional no puede ser negativa."});
  if(Number(d.additionalGuaranteeMonths)>2)errors.push({field:"additionalGuaranteeMonths",message:"La garantía adicional supera dos mensualidades en el supuesto general sujeto al límite legal."});
  if(Number(d.agencyFees||0)>0)errors.push({field:"agencyFees",message:"La gestión inmobiliaria y la formalización del contrato no deben repercutirse al arrendatario."});
  if(d.tensionedZone===true&&!filled(d.rentComplianceEvidence))errors.push({field:"rentComplianceEvidence",message:"Documenta la base y evidencia utilizada para la limitación de renta."});
  if(d.tensionedZone===true&&d.largeHolder===true&&!filled(d.referenceRent))warnings.push({field:"referenceRent",message:"Comprueba el índice o sistema de referencia aplicable."});
  if(d.touristUse===true&&d.rentalPurpose==="habitual")errors.push({field:"touristUse",message:"El uso turístico entra en conflicto con la finalidad de vivienda habitual declarada."});
  if(d.rentalPurpose==="habitual"&&d.habitualResidence!==true)errors.push({field:"habitualResidence",message:"Confirma el destino a residencia habitual."});
  if(state.role==="tenant"){if(d.tenantComprehension!==true)errors.push({field:"tenantComprehension",message:"Confirma comprensión o asistencia."});if(d.tenantIndependentCopy!==true)errors.push({field:"tenantIndependentCopy",message:"Confirma que dispones de copia independiente."});}
  return{errors,warnings,isValid:errors.length===0};
}

export function publicData(){const out={};for(const f of SCHEMA){const v=state.data[f.id];if(!filled(v)||f.private||f.restricted)continue;if(f.type==="file")out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};else if(f.type==="files")out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));else out[f.id]=v;}return out;}
export function integrityData(){const out={};for(const f of SCHEMA){const v=state.data[f.id];if(!filled(v)||f.private)continue;if(f.type==="file")out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};else if(f.type==="files")out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));else out[f.id]=v;}return out;}
export const documentManifest=()=>state.docs.map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));
export async function sha256Text(value){if(!crypto.subtle)throw new Error("Web Crypto unavailable");const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export async function sha256File(file){const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export function audit(action,meta={}){state.audit=[...state.audit,{eventId:crypto.randomUUID?.()||String(Date.now()),timestamp:new Date().toISOString(),actor:state.role,action,meta}].slice(-100);}
export function saveLocal(onDone){clearTimeout(state.saveTimer);state.saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:VERSION,recordId:state.recordId,role:state.role,data:publicData(),docs:documentManifest(),audit:state.audit.slice(-50),snapshots:state.snapshots,savedAt:new Date().toISOString()}));onDone?.("Guardado local · "+new Date().toLocaleTimeString());}catch{onDone?.("No se pudo guardar el borrador local.");}},350);}
export function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(!saved)return;state.recordId=saved.recordId||state.recordId;state.role=saved.role||state.role;state.data={...state.data,...(saved.data||{})};state.data.actor=state.role;state.audit=Array.isArray(saved.audit)?saved.audit:[];state.snapshots=Array.isArray(saved.snapshots)?saved.snapshots.slice(-MAX_SNAPSHOTS):[];}catch{}}
export async function addDocuments(fileList,fieldId){for(const file of[...fileList||[]]){if(file.size>MAX_FILE_BYTES){alert(file.name+": supera 10 MB.");continue;}const doc={id:"DOC-"+(crypto.randomUUID?.()||Date.now()),name:file.name,type:file.type||"application/octet-stream",size:file.size,hash:await sha256File(file),status:"NEEDS_REVIEW",version:1,file,url:URL.createObjectURL(file)};state.docs.push(doc);state.data.additionalDocuments=[...(state.data.additionalDocuments||[]),doc];audit("documentAdded",{documentId:doc.id,hash:doc.hash});}}
export function releaseObjectUrls(){for(const d of state.docs){try{URL.revokeObjectURL(d.url)}catch{}}}
export function buildVerificationURL(){if(!state.prepared)return"";const base=location.href.replace(/index\.html.*$/,"");return base+"verify.html?id="+encodeURIComponent(state.prepared.recordId)+"&version="+encodeURIComponent(state.prepared.version)+"&hash="+encodeURIComponent(state.prepared.hash)+"&request="+encodeURIComponent(state.prepared.requestId)+"&mode=static";}
export async function createSignatureRequest(){const v=validate();if(!v.isValid)return false;if(state.role==="tenant"&&riskAssessment().level==="HIGH"){state.view="protected";state.nav="review";audit("protectiveGate",{level:"HIGH"});return false;}if(!state.data.signatureMethod||!state.data.identityVerification)return false;if(!state.hash){state.hash=await sha256Text(JSON.stringify({recordId:state.recordId,version:VERSION,data:integrityData(),documents:documentManifest()}));}state.prepared={recordId:state.recordId,version:VERSION,hash:state.hash,preparedAt:new Date().toISOString(),requestId:crypto.randomUUID?.()||String(Date.now())};state.qrUrl=buildVerificationURL();audit("signaturePrepared",{requestId:state.prepared.requestId,hash:state.hash});state.view="sign";state.nav="review";return true;}
