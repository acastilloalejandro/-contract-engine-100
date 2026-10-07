import {VERSION,SCHEMA} from "./schema.js";
import {STAGES,currentStage} from "./workflow.js";
import {state,restore,restoreProfiles,saveLocal,audit,validate,riskAssessment,integrityData,publicData,documentManifest,sha256Text,addDocuments,releaseObjectUrls,createSignatureRequest,saveProfile,applyProfile,openNextContractVersion} from "./engine.js";
import {renderForm,renderReview,refreshFormMeta,updateViews,$,esc} from "./ui.js";

function speak(text){if(!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang=state.data.contractLanguage||"es-ES";u.rate=.95;speechSynthesis.speak(u);}
async function prepareReview(){
  const v=validate();
  if(!v.isValid){state.view="form";state.nav="form";renderForm();const f=v.errors[0]?.field;document.querySelector("[data-block='"+CSS.escape(f||"")+"']")?.scrollIntoView({behavior:"smooth",block:"center"});return;}
  const canonical=JSON.stringify({contractId:state.contractId,version:state.contractVersion,policyVersion:v.legal.policyVersion,data:integrityData(),documents:documentManifest()});
  let nextHash;try{nextHash=await sha256Text(canonical);}catch{alert("No se pudo calcular SHA-256 en este contexto seguro.");return;}
  if(state.hash&&state.hash!==nextHash)openNextContractVersion("minor");
  state.hash=nextHash;state.snapshots=[...state.snapshots,{version:state.contractVersion,data:publicData(),hash:state.hash,createdAt:new Date().toISOString()}].slice(-8);
  state.lifecycle="REVIEW";state.view="review";state.nav="review";audit("reviewStarted",{hash:state.hash,policyVersion:v.legal.policyVersion});saveLocal();renderReview();updateViews();window.scrollTo({top:0,behavior:"smooth"});
}
async function prepareSignature(){const ok=await createSignatureRequest();if(!ok){renderForm();updateViews();return;}saveLocal();renderReview();updateViews();}
async function checkAuthentication(){
  const secure=window.isSecureContext===true,supported=secure&&!!window.PublicKeyCredential&&!!navigator.credentials;
  $("authStatus").textContent=supported?"WebAuthn disponible como capacidad del navegador. Falta challenge/respuesta de servidor para autenticar realmente.":"WebAuthn no está disponible en este contexto. No se ha simulado autenticación.";
  audit(supported?"authenticationCapabilityDetected":"authenticationUnavailable",{secure,webAuthn:!!window.PublicKeyCredential});saveLocal();
}
async function createQR(){
  if(!state.prepared)return;
  const url=state.qrUrl;
  if(!window.QRCode){
    const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/easyqrcodejs@4.6.2/dist/easy.qrcode.min.js";script.async=true;document.head.append(script);
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;});
  }
  const modal=document.createElement("div");modal.className="modal";
  modal.innerHTML="<div class='modal-card'><div class='section-head'><div><span class='eyebrow'>QR</span><h2>Verificación</h2></div><button class='icon-btn' data-close type='button' aria-label='Cerrar'>×</button></div><div id='qrHost' class='qr-holder'></div><button class='primary-btn' data-copy type='button'>Copiar enlace</button><a class='secondary-btn' href='"+esc(url)+"' target='_blank' rel='noopener noreferrer'>Abrir verificación</a></div>";
  document.body.append(modal);
  new window.QRCode(modal.querySelector("#qrHost"),{text:url,width:220,height:220,correctLevel:window.QRCode.CorrectLevel.M,quietZone:12,quietZoneColor:"#fff",colorDark:"#111",colorLight:"#fff"});
  modal.querySelector("[data-close]").onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove();};
  modal.querySelector("[data-copy]").onclick=async()=>{try{await navigator.clipboard.writeText(url);modal.querySelector("[data-copy]").textContent="Copiado";}catch{alert(url);}};
}
function goStage(stage){
  const n=Math.min(5,Math.max(1,Number(stage)||1));state.currentStage=n;state.view="form";state.nav="form";audit("stageOpened",{stage:n,key:currentStage(n).key});saveLocal();renderForm();window.scrollTo({top:0,behavior:"smooth"});
}
function handleChange(e){
  const t=e.target;
  if(t.dataset.upload){addDocuments(t.files,t.dataset.upload).then(()=>{state.prepared=null;state.lifecycle="DRAFT";saveLocal();renderForm();});return;}
  const fieldId=t.dataset.field||t.dataset.multi;if(!fieldId)return;
  if(t.dataset.multi)state.data[t.dataset.multi]=[...document.querySelectorAll("[data-multi='"+CSS.escape(t.dataset.multi)+"']:checked")].map(x=>x.value);
  else state.data[fieldId]=t.type==="checkbox"?t.checked:t.value;
  if(fieldId==="actor")state.role=state.data.actor;
  state.prepared=null;state.lifecycle=state.lifecycle==="SIGNED"||state.lifecycle==="ACTIVE"?"DRAFT":state.lifecycle;
  audit("fieldChanged",{fieldId});
  saveLocal();
  const rerender=["actor","province","municipality","rentalPurpose","contractForm","landlordLargeHolder","landlordIsCompany","priorLeaseWithinFiveYears","referenceRent","largeHolder","tensionedZone"];
  if(rerender.includes(fieldId))renderForm();else refreshFormMeta();
}
function handleInput(e){
  const id=e.target.dataset.field;if(!id||["checkbox","radio"].includes(e.target.type))return;
  state.data[id]=e.target.value;state.prepared=null;state.lifecycle=state.lifecycle==="SIGNED"||state.lifecycle==="ACTIVE"?"DRAFT":state.lifecycle;saveLocal();refreshFormMeta();
}
function reset(){releaseObjectUrls();localStorage.removeItem("ce100:v6");location.reload();}
function bind(){
  $("themeBtn").onclick=()=>{state.dark=!state.dark;document.documentElement.classList.toggle("dark",state.dark);localStorage.setItem("ce-theme",state.dark?"dark":"light");};
  $("reviewBtn").onclick=prepareReview;$("reviewBtnBottom").onclick=prepareReview;
  $("docsBtn").onclick=()=>goStage(4);
  $("saveBtn").onclick=()=>saveLocal(msg=>$("saveState").textContent=msg);
  $("backFormBtn").onclick=()=>goStage(state.currentStage);
  $("prepareBtn").onclick=prepareSignature;
  $("authBtn").onclick=checkAuthentication;
  $("cancelSignBtn").onclick=()=>{state.view="review";state.nav="review";updateViews();};
  $("protectedBackBtn").onclick=()=>goStage(state.currentStage);
  $("newBtn").onclick=reset;
  document.querySelectorAll(".world-tab").forEach(b=>b.onclick=()=>{const n=b.dataset.nav;if(n==="form")goStage(state.currentStage);else if(n==="review")prepareReview();else if(n==="state"){state.view="state";state.nav="state";updateViews();}else goStage(4);});
  $("sections").addEventListener("input",handleInput);$("sections").addEventListener("change",handleChange);
  document.addEventListener("click",e=>{
    const read=e.target.closest("[data-read]");if(read)speak(read.dataset.read);
    const open=e.target.closest("[data-open]");if(open){const d=state.docs.find(x=>x.id===open.dataset.open);if(d?.url)window.open(d.url,"_blank","noopener,noreferrer");}
    const profile=e.target.closest("[data-profile]");if(profile){const kind=profile.dataset.profile;if(profile.dataset.action==="save")saveProfile(kind);if(profile.dataset.action==="apply"&&applyProfile(kind))renderForm();saveLocal();}
    const stage=e.target.closest("[data-stage]");if(stage)goStage(stage.dataset.stage);
  });
  window.__createQR=createQR;window.addEventListener("beforeunload",releaseObjectUrls);
  window.addEventListener("error",event=>{audit("runtimeError",{message:String(event.message||"unknown")});});
}
function init(){restore();restoreProfiles();state.dark=localStorage.getItem("ce-theme")==="dark";document.documentElement.classList.toggle("dark",state.dark);audit("appStarted",{version:VERSION});bind();renderForm();updateViews();}
init();
