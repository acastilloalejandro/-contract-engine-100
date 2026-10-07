import {VERSION,SCHEMA} from "./schema.js";
import {
  state,restore,saveLocal,audit,validate,riskAssessment,integrityData,publicData,
  documentManifest,sha256Text,addDocuments,releaseObjectUrls,createSignatureRequest
} from "./engine.js";
import {renderForm,renderReview,refreshFormMeta,updateViews,$,esc} from "./ui.js";

function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(String(text));
  u.lang=state.data.contractLanguage||"es-ES";
  u.rate=.95;
  speechSynthesis.speak(u);
}

async function prepareReview(){
  const v=validate();
  if(!v.isValid){
    state.view="form";state.nav="form";renderForm();
    const f=v.errors[0]?.field;
    document.querySelector("[data-block='"+CSS.escape(f||"")+"']")?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  const r=riskAssessment();
  if(state.role==="tenant"&&r.level!=="NORMAL"){
    state.view="protected";state.nav="review";
    audit("protectiveGate",{level:r.level,score:r.score});
    saveLocal();renderForm();updateViews();return;
  }
  const canonical=JSON.stringify({
    recordId:state.recordId,version:VERSION,data:integrityData(),documents:documentManifest()
  });
  try{state.hash=await sha256Text(canonical);}
  catch{alert("No se pudo calcular la huella SHA-256 en este contexto seguro.");return;}
  state.snapshots=[...state.snapshots,{version:state.snapshots.length+1,data:publicData(),hash:state.hash,createdAt:new Date().toISOString()}].slice(-5);
  audit("reviewStarted",{hash:state.hash});
  state.view="review";state.nav="review";saveLocal();renderForm();updateViews();window.scrollTo({top:0,behavior:"smooth"});
}

async function prepareSignature(){
  const ok=await createSignatureRequest();
  if(!ok){renderForm();updateViews();return;}
  saveLocal();renderForm();updateViews();
}

async function checkAuthentication(){
  const secure=window.isSecureContext===true;
  const supported=secure&&!!window.PublicKeyCredential&&!!navigator.credentials;
  $("authStatus").textContent=supported
    ?"WebAuthn está disponible en este navegador. Falta challenge del servidor para autenticar realmente."
    :"WebAuthn no está disponible en este contexto. No se ha simulado autenticación.";
  audit(supported?"authenticationCapabilityDetected":"authenticationUnavailable",{secure,webAuthn:!!window.PublicKeyCredential});
  saveLocal();
}

async function createQR(){
  if(!state.prepared)return;
  const base=location.href.replace(/index\.html.*$/,"");
  const url=base+"verify.html?id="+encodeURIComponent(state.prepared.recordId)+
    "&version="+encodeURIComponent(state.prepared.version)+
    "&hash="+encodeURIComponent(state.prepared.hash)+
    "&request="+encodeURIComponent(state.prepared.requestId)+"&mode=static";
  state.qrUrl=url;
  if(!window.QRCode){
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/easyqrcodejs@4.6.2/dist/easy.qrcode.min.js";
    script.async=true;document.head.append(script);
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;});
  }
  const modal=document.createElement("div");
  modal.className="modal";
  modal.innerHTML="<div class='modal-card'><div class='section-head'><div><span class='eyebrow'>QR</span><h2>Verificación</h2></div><button class='icon-btn' data-close type='button' aria-label='Cerrar'>×</button></div><div id='qrHost' class='qr-holder'></div><button class='primary-btn' data-copy type='button'>Copiar enlace</button><a class='secosignatureMethodry-btn' href='"+esc(url)+"' target='_blank' rel='noopener noreferrer'>Abrir verificación</a></div>";
  document.body.append(modal);
  new window.QRCode(modal.querySelector("#qrHost"),{text:url,width:220,height:220,correctLevel:window.QRCode.CorrectLevel.M,quietZone:12,quietZoneColor:"#fff",colorDark:"#111",colorLight:"#fff"});
  modal.querySelector("[data-close]").onclick=()=>modal.remove();
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
  modal.querySelector("[data-copy]").onclick=async()=>{try{await navigator.clipboard.writeText(url);modal.querySelector("[data-copy]").textContent="Copiado";}catch{alert(url);}};
}

function handleChange(e){
  const t=e.target;
  if(t.dataset.upload){
    addDocuments(t.files,t.dataset.upload).then(()=>{state.prepared=null;saveLocal();renderForm();});
    return;
  }
  let fieldId=t.dataset.field||t.dataset.multi;
  if(t.dataset.multi){
    const id=t.dataset.multi;
    state.data[id]=[...document.querySelectorAll("[data-multi='"+CSS.escape(id)+"']:checked")].map(x=>x.value);
  }else if(t.dataset.field){
    const v=t.type==="checkbox"?t.checked:t.value;
    state.data[t.dataset.field]=v;
    if(t.dataset.field==="actor"&&["worker","employer","reviewer"].includes(v))state.role=v;
  }else return;
  state.prepared=null;
  audit("fieldChanged",{fieldId});
  saveLocal();
  const conditional=new Set(["actor","rentAmount","tensionedZone","largeHolder","signatureMethod","independentReview","wageDeductions"]);
  if(conditional.has(fieldId)) renderForm(); else refreshFormMeta();
}

function handleInput(e){
  const id=e.target.dataset.field;
  if(!id||["checkbox","radio"].includes(e.target.type))return;
  state.data[id]=e.target.value;
  state.prepared=null;
  saveLocal();
  refreshFormMeta();
}

function reset(){
  releaseObjectUrls();localStorage.removeItem("ce100:v5");location.reload();
}

function bind(){
  $("themeBtn").onclick=()=>{
    state.dark=!state.dark;
    document.documentElement.classList.toggle("dark",state.dark);
    localStorage.setItem("ce-theme",state.dark?"dark":"light");
  };
  $("reviewBtn").onclick=prepareReview;
  $("reviewBtnBottom").onclick=prepareReview;
  $("docsBtn").onclick=()=>document.querySelector("[data-block='additionalDocuments']")?.scrollIntoView({behavior:"smooth",block:"center"});
  $("saveBtn").onclick=()=>{saveLocal(msg=>$("saveState").textContent=msg);};
  $("backFormBtn").onclick=()=>{state.view="form";state.nav="form";renderForm();};
  $("prepareBtn").onclick=prepareSignature;
  $("protectedBackBtn").onclick=()=>{state.view="form";state.nav="form";renderForm();};
  $("authBtn").onclick=checkAuthentication;
  $("cancelSignBtn").onclick=()=>{state.view="review";state.nav="review";updateViews();};
  $("newBtn").onclick=reset;
  document.querySelectorAll(".world-tab").forEach(b=>b.onclick=()=>{
    const n=b.dataset.nav;
    if(n==="form"){state.view="form";state.nav="form";renderForm();}
    else if(n==="review"){state.nav="review";prepareReview();}
    else if(n==="state"){state.view="state";state.nav="state";renderForm();updateViews();}
    else {state.view="form";state.nav="docs";renderForm();document.querySelector("[data-block='additionalDocuments']")?.scrollIntoView({behavior:"smooth",block:"center"});}
  });
  $("sections").addEventListener("input",handleInput);
  $("sections").addEventListener("change",handleChange);

  document.addEventListener("click",e=>{
    const read=e.target.closest("[data-read]");if(read)speak(read.dataset.read);
    const open=e.target.closest("[data-open]");
    if(open){const d=state.docs.find(x=>x.id===open.dataset.open);if(d?.url)window.open(d.url,"_blank","noopener,noreferrer");}
  });
  window.addEventListener("beforeunload",releaseObjectUrls);
}

function init(){
  restore();
  state.dark=localStorage.getItem("ce-theme")==="dark";
  document.documentElement.classList.toggle("dark",state.dark);
  if(!crypto.subtle){
    $("saveState").textContent="Web Crypto no disponible: la generación de huellas está deshabilitada.";
  }
  audit("appStarted",{version:VERSION});
  bind();
  renderForm();
  updateViews();
}
init();
