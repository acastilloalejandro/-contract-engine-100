import {VERSION,MAX_FILE_BYTES,SCHEMA,RISK_MAP} from "./schema.js";

export const STORAGE_KEY="ce100:v5";
export const MAX_SNAPSHOTS=5;
export const state={
  view:"form",nav:"form",role:"worker",dark:false,
  recordId:crypto.randomUUID?.()||String(Date.now()),
  data:{workerRole:"worker",country:"SA",city:"Jeddah",jurisdiction:"Jeddah, Saudi Arabia",compensation:"paid",currency:"SAR",contractLanguage:"es",liveIn:false,travelRequired:false,nda:false},
  docs:[],audit:[],snapshots:[],hash:"",prepared:null,qrUrl:"",saveTimer:null
};

export const filled=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&v.length===0);
export const visibleFields=()=>SCHEMA.filter(f=>(!f.actor||f.actor.includes(state.role))&&f.when(state.data));

export function riskAssessment(){
  const flags=[];
  for(const [id,label,weight] of RISK_MAP){
    const v=state.data[id];
    if(v==="yes") flags.push({id,label,weight,severity:weight>=3?"critical":"elevated"});
    else if(v==="no"&&["workerDocumentAccess","workerCanLeaveSite","workerHasPhoneAccess","workerCanContactFamily"].includes(id))
      flags.push({id,label,weight,severity:weight>=3?"critical":"elevated"});
    else if(v==="limited"||v==="unsure") flags.push({id,label,weight:1,severity:"review"});
  }
  const score=flags.reduce((n,f)=>n+f.weight,0);
  return {flags,score,level:flags.some(f=>f.severity==="critical")||score>=5?"HIGH":score>=2?"REVIEW":"NORMAL"};
}

export function validate(){
  const errors=[],warnings=[],d=state.data;
  for(const f of visibleFields()){
    if(!f.required) continue;
    const v=d[f.id];
    if(f.type==="checkbox" ? v!==true : f.type==="file" ? !(v&&v.id) : !filled(v))
      errors.push({field:f.id,message:"Falta: "+f.label+"."});
  }
  if(d.endDate&&d.startDate&&d.endDate<d.startDate) errors.push({field:"endDate",message:"La fecha de finalización es anterior al inicio."});
  if(d.startTime&&d.endTime&&d.endTime<=d.startTime) warnings.push({field:"endTime",message:"Comprueba una jornada que pueda cruzar medianoche."});
  if(Array.isArray(d.workingDays)&&d.weeklyRestDay&&d.workingDays.includes(d.weeklyRestDay))
    errors.push({field:"weeklyRestDay",message:"El día de descanso no puede coincidir con un día de trabajo."});
  if(Number(d.wageDeductions||0)>0&&!filled(d.deductionExplanation))
    errors.push({field:"deductionExplanation",message:"Explica las deducciones registradas."});
  if(Number(d.recruitmentFee||0)>0) warnings.push({field:"recruitmentFee",message:"Revisa independientemente cualquier coste de contratación asumido por el trabajador."});
  if(state.role==="worker"){
    if(d.workerUnderstandsContract!==true) errors.push({field:"workerUnderstandsContract",message:"Debe existir comprensión o asistencia lingüística independiente."});
    if(d.workerIndependentCopy!==true) errors.push({field:"workerIndependentCopy",message:"Debe existir una copia independiente accesible."});
    if(d.readCompensation!==true) warnings.push({field:"readCompensation",message:"Revisa la remuneración antes de preparar la firma."});
    if(d.readSchedule!==true) warnings.push({field:"readSchedule",message:"Revisa la jornada y el descanso antes de preparar la firma."});
    if(d.interpreterRequired===true&&!filled(d.workerPreferredLanguage))
      errors.push({field:"workerPreferredLanguage",message:"Selecciona el idioma de asistencia."});
  }
  if(!state.docs.length) warnings.push({field:"documents",message:"No hay documentos cargados."});
  return {errors,warnings,isValid:errors.length===0};
}

export function publicData(){
  const out={};
  for(const f of SCHEMA){
    const v=state.data[f.id];
    if(!filled(v)||f.private||f.restricted) continue;
    if(f.type==="file") out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};
    else if(f.type==="files") out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));
    else out[f.id]=v;
  }
  return out;
}

export function integrityData(){
  const out={};
  for(const f of SCHEMA){
    const v=state.data[f.id];
    if(!filled(v)||f.private) continue;
    if(f.type==="file") out[f.id]={id:v.id,name:v.name,type:v.type,size:v.size,hash:v.hash,status:v.status,version:v.version};
    else if(f.type==="files") out[f.id]=(v||[]).map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));
    else out[f.id]=v;
  }
  return out;
}

export const documentManifest=()=>state.docs.map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));

export async function sha256Text(value){
  if(!crypto.subtle) throw new Error("Web Crypto unavailable");
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function sha256File(file){
  const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export function audit(action,meta={}){
  state.audit=[...state.audit,{
    eventId:crypto.randomUUID?.()||String(Date.now()),
    timestamp:new Date().toISOString(),actor:state.role,action,meta
  }].slice(-100);
}

export function saveLocal(onDone){
  clearTimeout(state.saveTimer);
  state.saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        version:VERSION,recordId:state.recordId,role:state.role,
        data:publicData(),docs:documentManifest(),audit:state.audit.slice(-50),
        snapshots:state.snapshots,savedAt:new Date().toISOString()
      }));
      onDone?.("Guardado local · "+new Date().toLocaleTimeString());
    }catch{onDone?.("No se pudo guardar el borrador local.");}
  },350);
}

export function restore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!saved) return;
    state.recordId=saved.recordId||state.recordId;
    state.role=saved.role||state.role;
    state.data={...state.data,...(saved.data||{})};
    state.audit=Array.isArray(saved.audit)?saved.audit:[];
    state.snapshots=Array.isArray(saved.snapshots)?saved.snapshots.slice(-MAX_SNAPSHOTS):[];
  }catch{}
}

export async function addDocuments(fileList,fieldId){
  for(const file of [...fileList||[]]){
    if(file.size>MAX_FILE_BYTES){alert(file.name+": supera 10 MB.");continue;}
    const doc={
      id:"DOC-"+(crypto.randomUUID?.()||Date.now()),
      name:file.name,type:file.type||"application/octet-stream",size:file.size,
      hash:await sha256File(file),status:"NEEDS_REVIEW",version:1,
      file,url:URL.createObjectURL(file)
    };
    state.docs.push(doc);
    if(["workerPassport","workerNationalID","residenceDocument"].includes(fieldId)) state.data[fieldId]=doc;
    else state.data.additionalDocuments=[...(state.data.additionalDocuments||[]),doc];
    audit("documentAdded",{documentId:doc.id,hash:doc.hash});
  }
}

export function releaseObjectUrls(){
  for(const d of state.docs){try{URL.revokeObjectURL(d.url)}catch{}}
}

export function buildVerificationURL(){
  if(!state.prepared) return "";
  const base=location.href.replace(/index\.html.*$/,"");
  return base+"verify.html?id="+encodeURIComponent(state.prepared.recordId)+
    "&version="+encodeURIComponent(state.prepared.version)+
    "&hash="+encodeURIComponent(state.prepared.hash)+
    "&request="+encodeURIComponent(state.prepared.requestId)+"&mode=static";
}

export async function createSignatureRequest(){
  const validation=validate();
  if(!validation.isValid) return false;
  if(state.role==="worker"&&(riskAssessment().level!=="NORMAL"||state.data.independentReviewRequested===true)){
    state.view="protected";state.nav="review";audit("protectiveGate",{level:riskAssessment().level});return false;
  }
  if(!state.data.consentIdentity||!state.data.consentDocuments||!state.data.consentContract){
    alert("Faltan confirmaciones requeridas.");return false;
  }
  if(!state.hash){
    const canonical=JSON.stringify({recordId:state.recordId,version:VERSION,data:integrityData(),documents:documentManifest()});
    state.hash=await sha256Text(canonical);
  }
  state.prepared={
    recordId:state.recordId,version:VERSION,hash:state.hash,
    preparedAt:new Date().toISOString(),
    requestId:crypto.randomUUID?.()||String(Date.now())
  };
  state.qrUrl=buildVerificationURL();
  audit("signaturePrepared",{requestId:state.prepared.requestId,hash:state.hash});
  state.view="sign";state.nav="review";
  return true;
}
