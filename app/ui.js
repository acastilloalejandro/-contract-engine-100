import {VERSION,SCHEMA,OPTIMIZATIONS} from "./schema.js";
import {state,riskAssessment,validate,publicData,documentManifest} from "./engine.js";

export const $=id=>document.getElementById(id);
export const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const filled=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&v.length===0);

function docMeta(d){
  return "<div class='doc-meta'><b>"+esc(d.name)+"</b><span>"+esc(d.status)+" · "+esc((d.hash||"").slice(0,16))+"…</span>"+
    (d.url?"<button type='button' class='link-btn' data-open='"+esc(d.id)+"'>Abrir</button>":"")+"</div>";
}

function control(f){
  const v=state.data[f.id], id="f-"+f.id;
  let c="";
  const mark=f.private?"<span class='field-note private'>PRIVADO</span>":f.restricted?"<span class='field-note restricted'>RESTRINGIDO</span>":"";
  if(f.type==="text") c="<input id='"+id+"' data-field='"+f.id+"' type='text' value='"+esc(v||"")+"'>";
  if(f.type==="date"||f.type==="time") c="<input id='"+id+"' data-field='"+f.id+"' type='"+f.type+"' value='"+esc(v||"")+"'>";
  if(f.type==="number") c="<input id='"+id+"' data-field='"+f.id+"' type='number' inputmode='decimal' min='0' value='"+esc(v||"")+"'>";
  if(f.type==="textarea") c="<textarea id='"+id+"' data-field='"+f.id+"' rows='4'>"+esc(v||"")+"</textarea>";
  if(f.type==="select") c="<select id='"+id+"' data-field='"+f.id+"'><option value=''>Seleccionar…</option>"+f.options.map(o=>"<option value='"+esc(o.value)+"' "+(v===o.value?"selected":"")+">"+esc(o.label)+"</option>").join("")+"</select>";
  if(f.type==="radio") c="<div class='choice-grid'>"+f.options.map(o=>"<label class='choice'><input type='radio' name='"+id+"' data-field='"+f.id+"' value='"+esc(o.value)+"' "+(v===o.value?"checked":"")+"><span>"+esc(o.label)+"</span></label>").join("")+"</div>";
  if(f.type==="multiselect"){const a=Array.isArray(v)?v:[];c="<div class='choice-grid'>"+f.options.map(o=>"<label class='choice'><input type='checkbox' data-multi='"+f.id+"' value='"+esc(o.value)+"' "+(a.includes(o.value)?"checked":"")+"><span>"+esc(o.label)+"</span></label>").join("")+"</div>";}
  if(f.type==="checkbox") c="<label class='check-row'><input id='"+id+"' data-field='"+f.id+"' type='checkbox' "+(v===true?"checked":"")+"><span>"+esc(f.label)+"</span></label>";
  if(f.type==="switch") c="<label class='switch-row'><input id='"+id+"' data-field='"+f.id+"' type='checkbox' "+(v===true?"checked":"")+"><span class='switch-track'><span></span></span><span>"+(v?"Sí":"No")+"</span></label>";
  if(f.type==="file"||f.type==="files") c="<div class='upload-box'><input id='"+id+"' data-upload='"+f.id+"' type='file' accept='.pdf,.jpg,.jpeg,.png,.webp,.txt' "+(f.type==="files"?"multiple":"")+" capture='environment'><label for='"+id+"'>Añadir "+(f.type==="files"?"documentos":"documento")+"</label><div class='upload-meta'>"+(f.type==="file"&&v?docMeta(v):f.type==="files"&&Array.isArray(v)?v.map(docMeta).join(""):"")+"</div></div>";
  return (f.type==="checkbox"?"":"<label class='field-label' for='"+id+"'>"+esc(f.label)+" "+(f.required?"<span class='req'>*</span>":"")+" "+mark+"</label>")+
    c+(["text","textarea","select","date","time"].includes(f.type)?"<button type='button' class='text-btn' data-read='"+esc(f.label+(filled(v)?": "+v:""))+"'>Escuchar</button>":"")+
    "<div id='"+id+"-error' class='field-error'></div>";
}

export function renderForm(){
  const val=validate(),r=riskAssessment(),fs=SCHEMA.filter(f=>(!f.actor||f.actor.includes(state.role))&&f.when(state.data));
  const req=fs.filter(f=>f.required);
  const done=req.filter(f=>f.type==="checkbox"?state.data[f.id]===true:f.type==="file"?!!state.data[f.id]?.id:filled(state.data[f.id])).length;
  const pct=req.length?Math.round(done/req.length*100):0;
  $("progressValue").textContent=pct+"%";$("progressText").textContent=done+" de "+req.length+" requisitos";$("progressBar").style.width=pct+"%";
  $("stateBadge").textContent=state.prepared?"SIGNATURE_PREPARED":pct<100?"INCOMPLETE":val.isValid?"DRAFT":"REVIEW_REQUIRED";
  $("riskPill").textContent=r.level;$("riskPill").className="pill "+r.level.toLowerCase();$("riskFlags").textContent=r.flags.length;$("riskScore").textContent=r.score;$("riskState").textContent=r.level;
  $("validationPill").textContent=val.errors.length+" errores";$("validationPill").className="pill "+(val.errors.length?"bad":"good");
  $("validationSummary").innerHTML=val.errors.slice(0,4).map(x=>"<div class='validation-item error'><b>"+esc(x.field)+"</b><span>"+esc(x.message)+"</span></div>").join("")+
    val.warnings.slice(0,4).map(x=>"<div class='validation-item warning'><b>"+esc(x.field)+"</b><span>"+esc(x.message)+"</span></div>").join("")+
    (!val.errors.length&&!val.warnings.length?"<div class='validation-item success'><b>Todo correcto</b><span>El expediente supera las validaciones actuales.</span></div>":"");
  const groups={};for(const f of fs)(groups[f.section]??=[]).push(f);
  $("sections").innerHTML=Object.entries(groups).map(([name,list])=>"<section class='panel'><div class='section-head'><div><span class='eyebrow'>"+esc(name.toUpperCase())+"</span><h2>"+esc(name)+"</h2></div><span class='counter'>"+list.filter(f=>filled(state.data[f.id])).length+"/"+list.length+"</span></div>"+list.map(f=>"<div class='field-block' data-block='"+esc(f.id)+"'>"+control(f)+"</div>").join("")+"</section>").join("");
  $("protectedContent").innerHTML="<div class='summary-card'><div class='metric-grid'><div class='mini-card'><span>Nivel</span><strong>"+r.level+"</strong></div><div class='mini-card'><span>Señales</span><strong>"+r.flags.length+"</strong></div><div class='mini-card'><span>Puntuación</span><strong>"+r.score+"</strong></div></div>"+r.flags.map(f=>"<div class='risk-row'><span>"+esc(f.label)+"</span><b>"+esc(f.severity)+"</b></div>").join("")+"<div class='notice'>Este control protege al trabajador y requiere revisión humana. No es un diagnóstico jurídico.</div></div>";
  $("expertData").textContent=JSON.stringify({version:VERSION,role:state.role,risk:r,validation:val,optimizationCount:OPTIMIZATIONS.length,optimizations:OPTIMIZATIONS,fields:fs.map(f=>f.id),documents:documentManifest(),audit:state.audit.slice(-10)},null,2);
  updateViews();
}

export function renderReview(){
  const r=riskAssessment(),d=state.data;
  const summary=Object.entries({Expediente:state.recordId,Versión:VERSION,Trabajador:d.workerFullName||"—",Puesto:d.position||"—",Inicio:d.startDate||"—",Remuneración:d.salaryAmount?(d.salaryAmount+" "+(d.currency||"")):"—"}).map(([k,v])=>"<div class='hash-row'><span>"+esc(k)+"</span><b>"+esc(v)+"</b></div>").join("");
  $("reviewSummary").innerHTML="<div class='summary-card'>"+summary+"<div class='hash-row'><span>SHA-256</span><b class='break'>"+esc(state.hash||"Pendiente")+"</b></div></div><div class='summary-card'><div class='section-head'><div><span class='eyebrow'>PROTECCIÓN</span><h2>Señales</h2></div><span class='pill "+r.level.toLowerCase()+"'>"+r.level+"</span></div>"+r.flags.map(f=>"<div class='risk-row'><span>"+esc(f.label)+"</span><b>"+esc(f.severity)+"</b></div>").join("")+"</div>";
  $("reviewDocs").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>DOCUMENTOS</span><h2>Expediente documental</h2></div><span class='counter'>"+state.docs.length+"</span></div>"+(state.docs.length?state.docs.map(d=>"<div class='doc-row'><div><b>"+esc(d.name)+"</b><span>"+esc(d.status)+" · "+esc(d.hash.slice(0,16))+"…</span></div><button type='button' class='link-btn' data-open='"+esc(d.id)+"'>Abrir</button></div>").join(""):"<p class='muted'>No hay documentos.</p>")+"</div>";
  const a=state.snapshots.at(-2)?.data||{},b=state.snapshots.at(-1)?.data||{},keys=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));
  $("reviewDiff").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>VERSIONES</span><h2>Contract Diff</h2></div><span class='counter'>"+state.snapshots.length+"</span></div>"+(keys.length?keys.map(k=>"<div class='diff-row'><b>"+esc(k)+"</b><span>"+esc(JSON.stringify(a[k]??null))+"</span><span>"+esc(JSON.stringify(b[k]??null))+"</span></div>").join(""):"<p class='muted'>Sin diferencias o aún no hay dos versiones.</p>")+"</div>";
  $("signContent").innerHTML="<div class='summary-card'><div class='hash-row'><span>Expediente</span><b>"+esc(state.recordId)+"</b></div><div class='hash-row'><span>Versión</span><b>"+VERSION+"</b></div><div class='hash-row'><span>Huella</span><b class='break'>"+esc(state.hash)+"</b></div><div class='notice'>Esta versión solo prepara una solicitud de firma. No almacena biometría ni fabrica una firma electrónica cualificada.</div></div>";
  $("stateTitle").textContent=state.prepared?"SIGNATURE_PREPARED":"DRAFT";$("stateSub").textContent=state.prepared?"Solicitud de firma preparada.":"Expediente local y no firmado.";
  $("stateCard").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>AUDITORÍA</span><h2>Últimos eventos</h2></div><span class='counter'>"+state.audit.length+"</span></div>"+state.audit.slice(-10).reverse().map(e=>"<div class='audit-row'><b>"+esc(e.action)+"</b><span>"+new Date(e.timestamp).toLocaleString()+"</span></div>").join("")+(state.prepared?"<div class='button-row' style='margin-top:12px'><button id='qrBtn' class='secondary-btn' type='button'>Generar QR</button><button id='copyBtn' class='primary-btn' type='button'>Copiar verificación</button></div>":"")+"</div>";
  if(state.prepared){$("qrBtn").onclick=window.__createQR;$("copyBtn").onclick=async()=>{if(!state.qrUrl)await window.__createQR();else{try{await navigator.clipboard.writeText(state.qrUrl);$("copyBtn").textContent="Copiado";}catch{alert(state.qrUrl);}}};}
}

export function updateViews(){
  for(const [id,v] of [["formView","form"],["reviewView","review"],["protectedView","protected"],["signView","sign"],["stateView","state"]])$(id).classList.toggle("hidden",state.view!==v);
  document.querySelectorAll(".world-tab").forEach(b=>b.classList.toggle("active",(state.view==="form"&&b.dataset.nav==="form")||(state.view==="review"&&b.dataset.nav==="review")||(state.view==="state"&&b.dataset.nav==="state")));
  if(state.view==="review"||state.view==="sign"||state.view==="state")renderReview();
}
