import {VERSION,MAX_FILE_BYTES,SCHEMA,RISK_MAP} from "./schema.js";

export const STORAGE_KEY="ce100:v5";
export const MAX_SNAPSHOTS=5;
const DOCUMENT_DB_NAME="ce100-documents-v1";
const DOCUMENT_STORE_NAME="documents";
const PRIVATE_DOCUMENT_FIELDS=new Set(["workerPassport","workerNationalID","residenceDocument"]);
export const state={
  view:"form",nav:"form",role:"worker",dark:false,storageKey:STORAGE_KEY,mode:"demo",userId:null,
  recordId:crypto.randomUUID?.()||String(Date.now()),
  data:{workerRole:"worker",contractLanguage:"es",liveIn:false,travelRequired:false,nda:false},
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

// Restricted and private values are deliberately excluded from the integrity
// payload: hashing predictable identity numbers can expose them to guessing.
export function integrityData(){
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

export const documentManifest=()=>state.docs.map(d=>({id:d.id,name:d.name,type:d.type,size:d.size,hash:d.hash,status:d.status,version:d.version}));

export async function sha256Text(value){
  if(!crypto.subtle) throw new Error("Web Crypto unavailable");
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function setStorageScope(subject){
  if(typeof subject!=="string"||!subject.trim()) throw new TypeError("A stable account identifier is required.");
  const scope=await sha256Text(subject.trim());
  state.storageKey=STORAGE_KEY+":user:"+scope.slice(0,32);
  return state.storageKey;
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

function openDocumentDB(){
  if(typeof indexedDB==="undefined") return Promise.reject(new Error("IndexedDB no disponible."));
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DOCUMENT_DB_NAME,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(DOCUMENT_STORE_NAME)) db.createObjectStore(DOCUMENT_STORE_NAME,{keyPath:"key"});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("No se pudo abrir el almacén documental."));
    request.onblocked=()=>reject(new Error("El almacén documental está bloqueado por otra pestaña."));
  });
}

function txDone(tx){
  return new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error("Error en el almacén documental."));
    tx.onabort=()=>reject(tx.error||new Error("Transacción documental cancelada."));
  });
}

function documentKey(id,scope=state.storageKey||STORAGE_KEY,recordId=state.recordId){
  return scope+"::"+recordId+"::"+id;
}

async function persistDocumentBlob(doc){
  const db=await openDocumentDB();
  try{
    const tx=db.transaction(DOCUMENT_STORE_NAME,"readwrite");
    const done=txDone(tx);
    tx.objectStore(DOCUMENT_STORE_NAME).put({
      key:documentKey(doc.id),id:doc.id,scope:state.storageKey||STORAGE_KEY,
      recordId:state.recordId,fieldId:doc.fieldId,name:doc.name,type:doc.type,
      size:doc.size,hash:doc.hash,status:doc.status,version:doc.version,blob:doc.file
    });
    await done;
    doc.persisted=true;
  }finally{db.close();}
}

async function loadDocumentBlobs(scope,recordId){
  const db=await openDocumentDB();
  try{
    const tx=db.transaction(DOCUMENT_STORE_NAME,"readonly");
    const done=txDone(tx);
    const request=tx.objectStore(DOCUMENT_STORE_NAME).getAll();
    const records=await new Promise((resolve,reject)=>{
      request.onsuccess=()=>resolve(request.result||[]);
      request.onerror=()=>reject(request.error||new Error("No se pudieron recuperar los documentos."));
    });
    await done;
    return records.filter(r=>r.scope===scope&&r.recordId===recordId&&r.blob).map(r=>({
      id:r.id,fieldId:r.fieldId,name:r.name,type:r.type,size:r.size,hash:r.hash,
      status:r.status,version:r.version,file:r.blob,url:URL.createObjectURL(r.blob),persisted:true
    }));
  }finally{db.close();}
}

export async function clearPersistedDocuments(scope=state.storageKey||STORAGE_KEY,recordId=state.recordId){
  if(typeof indexedDB==="undefined") return;
  const db=await openDocumentDB();
  try{
    const tx=db.transaction(DOCUMENT_STORE_NAME,"readwrite");
    const done=txDone(tx);
    const store=tx.objectStore(DOCUMENT_STORE_NAME);
    const request=store.getAll();
    request.onsuccess=()=>{
      for(const record of request.result||[])
        if(record.scope===scope&&record.recordId===recordId) store.delete(record.key);
    };
    await done;
  }finally{db.close();}
}

export function saveLocal(onDone){
  clearTimeout(state.saveTimer);
  state.saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(state.storageKey||STORAGE_KEY,JSON.stringify({
        version:VERSION,recordId:state.recordId,role:state.role,
        data:publicData(),documentCount:state.docs.length,
        documents:state.docs.filter(d=>d.persisted).map(d=>({
          id:d.id,fieldId:d.fieldId,name:d.name,type:d.type,size:d.size,hash:d.hash,
          status:d.status,version:d.version
        })),
        audit:state.audit.slice(-50),snapshots:state.snapshots,savedAt:new Date().toISOString()
      }));
      onDone?.("Borrador local guardado · "+new Date().toLocaleTimeString());
    }catch{onDone?.("No se pudo guardar el borrador local. Comprueba el almacenamiento del navegador.");}
  },350);
}

export async function restore(){
  let saved;
  try{saved=JSON.parse(localStorage.getItem(state.storageKey||STORAGE_KEY)||"null");}
  catch{return;}
  if(!saved) return;
  state.recordId=saved.recordId||state.recordId;
  state.role=saved.role||state.role;
  state.data={...state.data,...(saved.data||{})};
  state.audit=Array.isArray(saved.audit)?saved.audit:[];
  state.snapshots=Array.isArray(saved.snapshots)?saved.snapshots.slice(-MAX_SNAPSHOTS):[];
  try{
    state.docs=await loadDocumentBlobs(state.storageKey||STORAGE_KEY,state.recordId);
    const additional=[];
    for(const doc of state.docs){
      if(PRIVATE_DOCUMENT_FIELDS.has(doc.fieldId)) state.data[doc.fieldId]=doc;
      else if(doc.fieldId==="additionalDocuments") additional.push(doc);
    }
    // Do not keep metadata for attachments whose binary is no longer present.
    state.data.additionalDocuments=additional;
    for(const id of PRIVATE_DOCUMENT_FIELDS){
      if(state.data[id]?.id&&!state.docs.some(doc=>doc.id===state.data[id].id)) state.data[id]=null;
    }
    const storedIds=new Set(state.docs.map(doc=>doc.id));
    for(const meta of saved.documents||[])
      if(!storedIds.has(meta.id)) audit("documentRestoreMissing",{documentId:meta.id});
  }catch{
    state.docs=[];
    state.data.additionalDocuments=[];
    for(const id of PRIVATE_DOCUMENT_FIELDS) if(state.data[id]?.id) state.data[id]=null;
  }
}

export async function validateDocumentFile(file){
  if(!file||typeof file.slice!=="function"||!Number.isFinite(file.size)) return "El archivo no es válido.";
  if(file.size<=0) return "El archivo está vacío.";
  if(file.size>MAX_FILE_BYTES) return "El archivo supera el límite de 10 MB.";
  const name=String(file.name||"").normalize("NFC");
  if(!name||name.length>180||name.includes("/")||name.includes(String.fromCharCode(92))||[...name].some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===127)) return "El nombre del archivo no es válido.";
  const ext=(name.match(/\\.[^.]+$/)?.[0]||"").toLowerCase();
  const rules={
    ".pdf":{mime:"application/pdf",test:b=>b.length>=5&&b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46&&b[4]===0x2d},
    ".jpg":{mime:"image/jpeg",test:b=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
    ".jpeg":{mime:"image/jpeg",test:b=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
    ".png":{mime:"image/png",test:b=>b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===0x0d&&b[5]===0x0a&&b[6]===0x1a&&b[7]===0x0a},
    ".webp":{mime:"image/webp",test:b=>b.length>=12&&b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50}
  };
  const rule=rules[ext];
  if(!rule) return "Formato no admitido. Usa PDF, JPEG, PNG o WebP.";
  const declared=String(file.type||"").toLowerCase();
  if(declared&&declared!=="application/octet-stream"&&declared!==rule.mime) return "El tipo declarado no coincide con la extensión del archivo.";
  const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(!rule.test(header)) return "El contenido no coincide con el formato declarado.";
  return "";
}

export async function addDocuments(fileList,fieldId){
  const field=SCHEMA.find(f=>f.id===fieldId&&["file","files"].includes(f.type));
  if(!field) throw new TypeError("Campo documental no reconocido.");
  const failures=[];
  let accepted=0;
  for(const file of Array.from(fileList||[])){
    const problem=await validateDocumentFile(file);
    if(problem){failures.push(String(file.name||"Archivo")+": "+problem);continue;}
    const hash=await sha256File(file);
    if(state.docs.some(d=>d.hash===hash)){failures.push(String(file.name||"Archivo")+": ya está añadido.");continue;}
    const cleanName=String(file.name).normalize("NFC").split("/").join("_").split(String.fromCharCode(92)).join("_").split("").filter(ch=>ch.charCodeAt(0)>=32&&ch.charCodeAt(0)!==127).join("").slice(0,120);
    const doc={
      id:"DOC-"+(crypto.randomUUID?.()||Date.now()),fieldId,name:cleanName,
      type:file.type||"application/octet-stream",size:file.size,hash,status:"NEEDS_REVIEW",
      version:1,file,url:URL.createObjectURL(file),persisted:false
    };
    try{await persistDocumentBlob(doc);}
    catch{doc.status="SESSION_ONLY";failures.push(cleanName+": el almacenamiento persistente no está disponible; el archivo solo durará en esta sesión.");}
    state.docs.push(doc);
    if(PRIVATE_DOCUMENT_FIELDS.has(fieldId)) state.data[fieldId]=doc;
    else state.data.additionalDocuments=[...(state.data.additionalDocuments||[]),doc];
    audit("documentAdded",{documentId:doc.id,hash:doc.hash,persisted:doc.persisted});
    accepted++;
  }
  if(failures.length&&typeof alert==="function") alert(failures.join("\\n"));
  return {accepted,failures};
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
