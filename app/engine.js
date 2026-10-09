import {VERSION,MAX_FILE_BYTES,SCHEMA,RISK_MAP} from "./schema.js";
import {assessRentalContext,resolveJurisdiction,LEGAL_POLICY_VERSION} from "./legal-policy.js";
import {generateClauses} from "./clauses.js";
import {nextSemver} from "./workflow.js";

export const STORAGE_KEY="ce100:v6";
export const PROFILE_STORAGE_KEY="ce100:profiles:v1";
export const MAX_SNAPSHOTS=8;
export const state={
  view:"form",nav:"form",role:"tenant",dark:false,
  contractId:crypto.randomUUID?.()||String(Date.now()),contractVersion:"1.0.0",lifecycle:"DRAFT",currentStage:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  recordId:"",
  data:{actor:"tenant",rentalPurpose:"habitual",contractForm:"new",contractLanguage:"es",tensionedZone:false,largeHolder:false,landlordLargeHolder:"unsure",landlordIsCompany:false,touristUse:false,protectedHousing:false,newBuildOrMajorRehab:false,priorLeaseWithinFiveYears:"unknown",additionalGuaranteeMonths:0,rentIndex:"irav",depositMonths:1},
  legalAssessment:null,clauses:[],profiles:{tenant:null,landlord:null},
  docs:[],audit:[],snapshots:[],hash:"",prepared:null,qrUrl:"",saveTimer:null
};

export const filled=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&v.length===0);
export const visibleFields=()=>SCHEMA.filter(f=>(!f.actor||f.actor.includes(state.role))&&f.when(state.data));

function syncDerived(){
  const legal=assessRentalContext(state.data);
  if(legal.jurisdiction.tensionedZoneStatus==="verified")state.data.tensionedZone=true;
  else if(legal.jurisdiction.tensionedZoneStatus==="not_listed")state.data.tensionedZone=false;
  if(state.data.landlordLargeHolder==="yes")state.data.largeHolder=true;
  if(state.data.landlordLargeHolder==="no")state.data.largeHolder=false;
  state.legalAssessment=assessRentalContext(state.data);
  state.clauses=generateClauses(state.data,state.legalAssessment);
  return state.legalAssessment;
}
export const getLegalAssessment=()=>syncDerived();

export function riskAssessment(){
  const legal=syncDerived(),flags=[],d=state.data;
  for(const [id,label,weight] of RISK_MAP){
    if(id==="documentsComplete"&&!d.documentsComplete)flags.push({id,label,weight,severity:"elevated"});
    if(id==="rentComplianceEvidence"&&legal.rentControl.applicable&&!filled(d.rentComplianceEvidence))flags.push({id,label,weight,severity:"elevated"});
    if(id==="tensionedZone"&&legal.rentControl.applicable)flags.push({id,label,weight,severity:"review"});
    if(id==="largeHolder"&&legal.rentControl.largeHolder)flags.push({id,label,weight,severity:"review"});
    if(id==="priorLeaseWithinFiveYears"&&d.tensionedZone&&d.priorLeaseWithinFiveYears==="unknown")flags.push({id,label,weight,severity:"elevated"});
  }
  for(const w of legal.warnings)flags.push({id:w.field,label:w.message,weight:1,severity:"review"});
  const unique=[...new Map(flags.map(x=>[x.id,x])).values()];
  const score=unique.reduce((n,f)=>n+f.weight,0);
  return{flags:unique,score,level:score>=5?"HIGH":score>=2?"REVIEW":"NORMAL",legal};
}

export function validate(){
  const errors=[],warnings=[],d=state.data,legal=syncDerived();
  for(const f of visibleFields()){
    if(!f.required)continue;
    const v=d[f.id];
    const missing=f.type==="checkbox"?v!==true:f.type==="file"?!(v&&v.id):f.type==="files"?!(Array.isArray(v)&&v.length):!filled(v);
    if(missing)errors.push({field:f.id,message:"Falta: "+f.label+"."});
  }
  if(d.postalCode&&!/^\d{5}$/.test(String(d.postalCode).trim()))errors.push({field:"postalCode",message:"El código postal debe contener 5 dígitos."});
  if(Number(d.occupants||0)<1)errors.push({field:"occupants",message:"Debe existir al menos una persona ocupante."});
  if(d.startDate&&d.endDate&&d.endDate<d.startDate)errors.push({field:"endDate",message:"La fecha final es anterior a la fecha inicial."});
  if(d.rentalPurpose==="habitual"&&Number(d.agreedDurationYears||0)>0&&legal.minimumMandatoryYears&&Number(d.agreedDurationYears)<legal.minimumMandatoryYears)warnings.push({field:"agreedDurationYears",message:"La duración pactada puede quedar sujeta a prórrogas obligatorias; revisa la redacción contractual."});
  if(d.rentalPurpose==="habitual"&&d.habitualResidence!==true)errors.push({field:"habitualResidence",message:"Confirma el destino a residencia habitual."});
  if(Number(d.depositMonths)!==1)warnings.push({field:"depositMonths",message:"La fianza ordinaria de vivienda se configura como una mensualidad; revisa el supuesto especial."});
  if(Number(d.additionalGuaranteeMonths)<0)errors.push({field:"additionalGuaranteeMonths",message:"La garantía adicional no puede ser negativa."});
  if(Number(d.additionalGuaranteeMonths)>2)warnings.push({field:"additionalGuaranteeMonths",message:"La garantía adicional supera dos mensualidades en el supuesto general; requiere revisión jurídica."});
  if(Number(d.agencyFees||0)>0)errors.push({field:"agencyFees",message:"Los gastos de gestión inmobiliaria y formalización se imputan al arrendador en el régimen de vivienda sujeto a la LAU."});
  if(legal.rentControl.applicable){
    if(legal.rentControl.maximumRent===null)errors.push({field:"referenceRent",message:"No se ha podido calcular el límite de renta con la evidencia aportada."});
    if(legal.rentControl.rentWithinCap===false)errors.push({field:"rentAmount",message:"La renta declarada supera el límite calculado."});
    if(!filled(d.rentComplianceEvidence))errors.push({field:"rentComplianceEvidence",message:"Documenta la base del cumplimiento del régimen de limitación."});
  }
  for(const w of legal.warnings)if(!warnings.some(x=>x.field===w.field&&x.message===w.message))warnings.push(w);
  return{errors,warnings,isValid:errors.length===0,legal};
}

export function publicData(){const out={};for(const f of SCHEMA){const v=state.data[f.id];if(!filled(v)||f.private||f.restricted)continue;if(f.type==="file")out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};else if(f.type==="files")out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));else out[f.id]=v;}return out;}
export function integrityData(){const out={};for(const f of SCHEMA){const v=state.data[f.id];if(!filled(v)||f.private)continue;if(f.type==="file")out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};else if(f.type==="files")out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));else out[f.id]=v;}return out;}
export const documentManifest=()=>state.docs.map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));
export async function sha256Text(value){if(!crypto.subtle)throw new Error("Web Crypto unavailable");const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export async function sha256File(file){const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export function audit(action,meta={}){state.audit=[...state.audit,{eventId:crypto.randomUUID?.()||String(Date.now()),timestamp:new Date().toISOString(),actor:state.role,action,meta}].slice(-100);state.updatedAt=new Date().toISOString();}
export function saveLocal(onDone){
  clearTimeout(state.saveTimer);
  state.saveTimer=setTimeout(()=>{
    try{
      syncDerived();
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        appVersion:VERSION,policyVersion:LEGAL_POLICY_VERSION,
        contractId:state.contractId,recordId:state.contractId,contractVersion:state.contractVersion,
        lifecycle:state.lifecycle,currentStage:state.currentStage,createdAt:state.createdAt,updatedAt:state.updatedAt,
        role:state.role,data:publicData(),docs:documentManifest(),audit:state.audit.slice(-80),
        snapshots:state.snapshots.slice(-MAX_SNAPSHOTS),hash:state.hash,prepared:state.prepared,
        legalAssessment:state.legalAssessment,clauses:state.clauses,savedAt:new Date().toISOString()
      }));
      onDone?.("Guardado local · "+new Date().toLocaleTimeString());
    }catch{onDone?.("No se pudo guardar el borrador local.");}
  },250);
}
export function restore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(!saved)return;
    state.contractId=saved.contractId||saved.recordId||state.contractId;
    state.recordId=state.contractId;state.contractVersion=saved.contractVersion||"1.0.0";
    state.lifecycle=saved.lifecycle||"DRAFT";state.currentStage=Number(saved.currentStage)||1;
    state.createdAt=saved.createdAt||state.createdAt;state.updatedAt=saved.updatedAt||state.updatedAt;
    state.role=saved.role||state.role;state.data={...state.data,...(saved.data||{})};state.data.actor=state.role;
    state.hash=saved.hash||"";state.prepared=saved.prepared||null;
    state.audit=Array.isArray(saved.audit)?saved.audit:[];state.snapshots=Array.isArray(saved.snapshots)?saved.snapshots.slice(-MAX_SNAPSHOTS):[];
    state.legalAssessment=saved.legalAssessment||null;state.clauses=Array.isArray(saved.clauses)?saved.clauses:[];
  }catch{}
  syncDerived();
}
export async function addDocuments(fileList,fieldId){
  for(const file of[...fileList||[]]){
    if(file.size>MAX_FILE_BYTES){alert(file.name+": supera 10 MB.");continue;}
    const doc={id:"DOC-"+(crypto.randomUUID?.()||Date.now()),name:file.name,type:file.type||"application/octet-stream",size:file.size,hash:await sha256File(file),status:"NEEDS_REVIEW",version:1,file,url:URL.createObjectURL(file),fieldId};
    state.docs.push(doc);
    state.data[fieldId]=[...(Array.isArray(state.data[fieldId])?state.data[fieldId]:[]),doc];
    audit("documentAdded",{documentId:doc.id,fieldId,hash:doc.hash});
  }
}
export function releaseObjectUrls(){for(const d of state.docs){try{URL.revokeObjectURL(d.url)}catch{}}}
export function buildVerificationURL(){
  if(!state.prepared)return"";
  const base=location.href.replace(/index\.html.*$/,"");
  return base+"verify.html?id="+encodeURIComponent(state.prepared.contractId)+"&version="+encodeURIComponent(state.prepared.version)+"&hash="+encodeURIComponent(state.prepared.hash)+"&request="+encodeURIComponent(state.prepared.requestId)+"&policy="+encodeURIComponent(state.prepared.policyVersion);
}
export async function createSignatureRequest(){
  const v=validate();if(!v.isValid||!state.data.signatureMethod||!state.data.identityVerification)return false;
  if(!state.hash)state.hash=await sha256Text(JSON.stringify({contractId:state.contractId,version:state.contractVersion,policyVersion:LEGAL_POLICY_VERSION,data:integrityData(),documents:documentManifest()}));
  state.prepared={contractId:state.contractId,recordId:state.contractId,version:state.contractVersion,policyVersion:LEGAL_POLICY_VERSION,hash:state.hash,preparedAt:new Date().toISOString(),requestId:crypto.randomUUID?.()||String(Date.now())};
  state.lifecycle="PENDING_SIGNATURE";state.qrUrl=buildVerificationURL();
  audit("signaturePrepared",{requestId:state.prepared.requestId,hash:state.hash});state.view="sign";state.nav="review";return true;
}
export function saveProfile(kind){
  const snapshot={kind,savedAt:new Date().toISOString(),data:kind==="tenant"
    ?{tenantName:state.data.tenantName,tenantId:state.data.tenantId,tenantEmail:state.data.tenantEmail,tenantPhone:state.data.tenantPhone,tenantNationality:state.data.tenantNationality,occupants:state.data.occupants,minors:state.data.minors,pets:state.data.pets}
    :{landlordName:state.data.landlordName,landlordId:state.data.landlordId,landlordIsCompany:state.data.landlordIsCompany,landlordLargeHolder:state.data.landlordLargeHolder}};
  state.profiles[kind]=snapshot;
  const all=JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)||"{}");all[kind]=snapshot;localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(all));
  audit("profileSaved",{kind});return snapshot;
}
export function restoreProfiles(){try{state.profiles=JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)||"{}")}catch{state.profiles={tenant:null,landlord:null}}}
export function applyProfile(kind){
  const p=state.profiles[kind];if(!p?.data)return false;
  state.data={...state.data,...p.data};syncDerived();audit("profileApplied",{kind});return true;
}
export function openNextContractVersion(level="minor"){
  if(state.hash)state.contractVersion=nextSemver(state.contractVersion,level);
  state.hash="";state.prepared=null;state.lifecycle="DRAFT";audit("contractVersionOpened",{version:state.contractVersion});saveLocal();return state.contractVersion;
}
