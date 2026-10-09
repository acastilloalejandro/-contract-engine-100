import {VERSION,SCHEMA} from "./schema.js";
import {initializeAccessGate} from "./onboarding-ui.js";
import {
  state,restore,saveLocal,audit,validate,riskAssessment,integrityData,publicData,
  documentManifest,sha256Text,addDocuments,releaseObjectUrls,createSignatureRequest,setStorageScope,clearPersistedDocuments,STORAGE_KEY
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
  if(v.warnings.length){
    const warningText=v.warnings.map(w=>"• "+w.message).join("\n");
    const accepted=window.confirm("Hay advertencias que requieren tu revisión:\n\n"+warningText+"\n\nContinuar no implica validez jurídica ni firma electrónica. ¿Has revisado estas advertencias?");
    if(!accepted) return;
    audit("warningsAcknowledged",{fields:v.warnings.map(w=>w.field)});
  }
  const r=riskAssessment();
  if(r.level!=="NORMAL"){
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
    alert("El generador QR local no se ha cargado. Recarga la aplicación y vuelve a intentarlo.");
    return;
  }
  const modal=document.createElement("div");
  modal.className="modal";
  modal.innerHTML="<div class='modal-card'><div class='section-head'><div><span class='eyebrow'>QR</span><h2>Verificación</h2></div><button class='icon-btn' data-close type='button' aria-label='Cerrar'>×</button></div><div id='qrHost' class='qr-holder'></div><button class='primary-btn' data-copy type='button'>Copiar enlace</button><a class='secondary-btn' href='"+esc(url)+"' target='_blank' rel='noopener noreferrer'>Abrir verificación</a></div>";
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
    if(t.dataset.field==="workerRole"&&["worker","employer","reviewer"].includes(v))state.role=v;
  }else return;
  state.prepared=null;
  audit("fieldChanged",{fieldId});
  saveLocal();
  const conditional=new Set(["workerRole","compensation","liveIn","travelRequired","nda","interpreterRequired","wageDeductions"]);
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

function focusDocuments(){
  state.view="form";
  state.nav="docs";
  renderForm();
  const target=document.querySelector("[data-block='workerPassport']")||
    document.querySelector("[data-block='additionalDocuments']");
  target?.scrollIntoView({behavior:"smooth",block:"center"});
}

async function reset(){
  releaseObjectUrls();localStorage.removeItem(state.storageKey||STORAGE_KEY);try{await clearPersistedDocuments();}catch{}location.reload();
}

function bind(){
  $("themeBtn").onclick=()=>{
    state.dark=!state.dark;
    document.documentElement.classList.toggle("dark",state.dark);
    localStorage.setItem("ce-theme",state.dark?"dark":"light");
  };
  $("reviewBtn").onclick=prepareReview;
  $("reviewBtnBottom").onclick=prepareReview;
  $("docsBtn").onclick=focusDocuments;
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
    else focusDocuments();
  });
  $("sections").addEventListener("input",handleInput);
  $("sections").addEventListener("change",handleChange);

  document.addEventListener("click",e=>{
    const read=e.target.closest("[data-read]");if(read)speak(read.dataset.read);
    if(e.target.closest("#printContractBtn")){window.print();return;}
    const open=e.target.closest("[data-open]");
    if(open){const d=state.docs.find(x=>x.id===open.dataset.open);if(d?.url)window.open(d.url,"_blank","noopener,noreferrer");}
  });
  window.addEventListener("beforeunload",releaseObjectUrls);
}

async function registerOfflineShell(){
  if(!("serviceWorker" in navigator)||location.protocol!=="https:") return;
  try{await navigator.serviceWorker.register(new URL("../sw.js",import.meta.url));}
  catch{
    const status=$("saveState");
    if(status) status.textContent="Modo sin conexión no disponible en este navegador.";
  }
}

async function startContractApp({mode="demo",user=null}={}){
  void registerOfflineShell();
  state.mode=mode;
  state.userId=user?.id||user?.sub||user?.userId||user?.email||null;
  if(mode==="authenticated"){
    if(!state.userId) throw new Error("El servidor no devolvió un identificador de cuenta estable.");
    await setStorageScope(String(state.userId));
  }else{
    state.storageKey=STORAGE_KEY;
  }
  await restore();
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

initializeAccessGate({
  onEnterDemo:()=>startContractApp({mode:"demo"}),
  onEnterAuthenticated:user=>startContractApp({mode:"authenticated",user})
});
