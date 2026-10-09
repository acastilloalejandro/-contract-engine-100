import {VERSION,SCHEMA,OPTIMIZATIONS} from "./schema.js";
import {state,riskAssessment,validate,publicData,documentManifest,getLegalAssessment} from "./engine.js";
import {STAGES,stageFields,completionForStage,taskList} from "./workflow.js";

export const $=id=>document.getElementById(id);
export const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&gt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const filled=v=>v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&v.length===0);

function docMeta(d){return "<div class='doc-meta'><div><b>"+esc(d.name)+"</b><span>"+esc(d.status)+" · "+esc((d.hash||"").slice(0,16))+"…</span></div>"+(d.url?"<button type='button' class='link-btn' data-open='"+esc(d.id)+"'>Abrir</button>":"")+"</div>";}
function control(f){
  const v=state.data[f.id],id="f-"+f.id,mark=f.private?"<span class='field-note private'>PRIVADO</span>":f.restricted?"<span class='field-note restricted'>RESTRINGIDO</span>":"";
  let c="";
  if(f.computed){const on=v===true;c="<div class='computed-control'><span class='computed-dot "+(on?"on":"")+"'></span><b>"+(on?"Sí":"No")+"</b><span class='computed-tag'>Calculado por reglas</span></div>";}
  else if(f.type==="text"||f.type==="date"||f.type==="time")c="<input id='"+id+"' data-field='"+f.id+"' type='"+f.type+"' value='"+esc(v||"")+"'>";
  else if(f.type==="number")c="<input id='"+id+"' data-field='"+f.id+"' type='number' inputmode='decimal' min='0' step='0.01' value='"+esc(v??"")+"'>";
  else if(f.type==="textarea")c="<textarea id='"+id+"' data-field='"+f.id+"' rows='4'>"+esc(v||"")+"</textarea>";
  else if(f.type==="select")c="<select id='"+id+"' data-field='"+f.id+"'><option value=''>Seleccionar…</option>"+f.options.map(o=>"<option value='"+esc(o.value)+"' "+(v===o.value?"selected":"")+">"+esc(o.label)+"</option>").join("")+"</select>";
  else if(f.type==="radio")c="<div class='choice-grid'>"+f.options.map(o=>"<label class='choice'><input type='radio' name='"+id+"' data-field='"+f.id+"' value='"+esc(o.value)+"' "+(v===o.value?"checked":"")+"><span>"+esc(o.label)+"</span></label>").join("")+"</div>";
  else if(f.type==="multiselect")c="<div class='choice-grid'>"+f.options.map(o=>"<label class='choice'><input type='checkbox' data-multi='"+f.id+"' value='"+esc(o.value)+"' "+((Array.isArray(v)?v:[]).includes(o.value)?"checked":"")+"><span>"+esc(o.label)+"</span></label>").join("")+"</div>";
  else if(f.type==="checkbox")c="<label class='check-row'><input id='"+id+"' data-field='"+f.id+"' type='checkbox' "+(v===true?"checked":"")+"><span>"+esc(f.label)+"</span></label>";
  else if(f.type==="switch")c="<label class='switch-row'><input id='"+id+"' data-field='"+f.id+"' type='checkbox' "+(v===true?"checked":"")+"><span class='switch-track'><span></span></span><span>"+(v?"Sí":"No")+"</span></label>";
  else if(f.type==="files")c="<div class='upload-box'><input id='"+id+"' data-upload='"+f.id+"' type='file' accept='.pdf,.jpg,.jpeg,.png,.webp,.txt' multiple capture='environment'><label for='"+id+"'>Añadir documentos</label><div class='upload-meta'>"+(Array.isArray(v)?v.map(docMeta).join(""):"")+"</div></div>";
  return (f.type==="checkbox"?"":"<label class='field-label' for='"+id+"'>"+esc(f.label)+" "+(f.required?"<span class='req'>*</span>":"")+" "+mark+"</label>")+c+((["text","textarea","select","date","time","number"].includes(f.type))?"<button type='button' class='text-btn' data-read='"+esc(f.label+(filled(v)?": "+v:""))+"'>Escuchar</button>":"")+"<div id='"+id+"-error' class='field-error'></div>";
}
function profileCard(kind,label){
  const p=state.profiles?.[kind];
  return "<div class='profile-card'><div><span class='eyebrow'>PERFIL</span><h3>"+esc(label)+"</h3><p class='muted'>"+(p?"Guardado localmente":"Sin perfil guardado")+"</p></div><div class='button-row'><button class='secondary-btn' type='button' data-profile='"+kind+"' data-action='save'>Guardar</button>"+(p?"<button class='primary-btn' type='button' data-profile='"+kind+"' data-action='apply'>Usar</button>":"")+"</div></div>";
}
function legalCard(legal){
  const j=legal.jurisdiction||{},rt=legal.rentControl||{};
  const zone=j.tensionedZoneStatus==="verified"?"ZONA TENSIONADA VERIFICADA":j.tensionedZoneStatus==="not_listed"?"NO LISTADA EN EL REGISTRO LOCAL":"CONSULTA OFICIAL NECESARIA";
  return "<section class='panel legal-card'><div class='section-head'><div><span class='eyebrow'>JURISDICCIÓN · "+esc(legal.policyVersion)+"</span><h2>"+esc([j.municipality,j.province].filter(Boolean).join(", ")||"Pendiente")+"</h2></div><span class='pill "+(rt.applicable?"review":"normal")+"'>"+esc(zone)+"</span></div><div class='metric-grid'><div class='mini-card'><span>Comunidad</span><strong>"+esc(j.community||"—")+"</strong></div><div class='mini-card'><span>Límite renta</span><strong>"+(rt.maximumRent===null?"—":Number(rt.maximumRent).toLocaleString("es-ES",{style:"currency",currency:"EUR"}))+"</strong></div><div class='mini-card'><span>Revisión humana</span><strong>"+(legal.requiresHumanReview?"Sí":"No")+"</strong></div></div><p class='microcopy'>Reglas versionadas y trazables. Fuera del registro local, la aplicación no presume ausencia de zona tensionada.</p></section>";
}
function formMetrics(){
  const val=validate(),r=riskAssessment(),all=SCHEMA.filter(f=>(!f.actor||f.actor.includes(state.role))&&f.when(state.data));
  const required=all.filter(f=>f.required),done=required.filter(f=>{const v=state.data[f.id];return f.type==="checkbox"?v===true:f.type==="files"?Array.isArray(v)&&v.length>0:filled(v);}).length;
  const pct=required.length?Math.round(done/required.length*100):0;
  $("progressValue").textContent=pct+"%";$("progressText").textContent=done+" de "+required.length+" requisitos";$("progressBar").style.width=pct+"%";
  $("stateBadge").textContent=state.lifecycle||"DRAFT";$("riskPill").textContent=r.level;$("riskPill").className="pill "+r.level.toLowerCase();
  $("riskFlags").textContent=r.flags.length;$("riskScore").textContent=r.score;$("riskState").textContent=r.level;
  $("validationPill").textContent=val.errors.length+" errores";$("validationPill").className="pill "+(val.errors.length?"bad":"good");
  $("validationSummary").innerHTML=val.errors.slice(0,5).map(x=>"<div class='validation-item error'><b>"+esc(x.field)+"</b><span>"+esc(x.message)+"</span></div>").join("")+val.warnings.slice(0,4).map(x=>"<div class='validation-item warning'><b>"+esc(x.field)+"</b><span>"+esc(x.message)+"</span></div>").join("")+(!val.errors.length&&!val.warnings.length?"<div class='validation-item success'><b>Sin bloqueos</b><span>El expediente supera las validaciones actuales.</span></div>":"");
  const stage=currentStageFromState();const stageFs=stageFields(SCHEMA,state.data,state.role,stage.id),stagePct=completionForStage(stageFs,state.data);
  $("stageTitle").textContent=stage.label;$("stageSub").textContent=stagePct.done+" de "+stagePct.required+" requisitos de esta etapa";
  return{val,r,legal:val.legal,all,stageFs,stagePct};
}
const currentStageFromState=()=>STAGES.find(s=>s.id===Number(state.currentStage))||STAGES[0];
export function refreshFormMeta(){formMetrics();}
export function renderForm(){
  const {val,r,legal,stageFs,stagePct}=formMetrics(),stage=currentStageFromState();
  $("stageNav").innerHTML=STAGES.map(s=>"<button type='button' class='stage-chip "+(s.id===stage.id?"active ":"")+(Number(state.currentStage)>s.id?"done":"")+"' data-stage='"+s.id+"'><span>"+s.icon+"</span><b>"+esc(s.label)+"</b></button>").join("");
  const groups={};for(const f of stageFs)(groups[f.section]??=[]).push(f);
  let html="<div class='stage-intro'><div><span class='eyebrow'>ETAPA "+stage.icon+" DE 05</span><h2>"+esc(stage.label)+"</h2><p class='muted'>"+(stage.id===1?"Identifica el inmueble y el contexto jurídico.":stage.id===2?"Identifica las partes y el plazo.":stage.id===3?"Define renta, pagos, fianza y gastos.":stage.id===4?"Completa condiciones, uso, documentos y revisión.":"Prepara la versión exacta que se pretende firmar.")+"</p></div><span class='counter'>"+stagePct.pct+"%</span></div>";
  if(stage.id===2)html+=profileCard("landlord","Arrendador/a")+profileCard("tenant","Arrendatario/a");
  if(stage.id===1||stage.id===3)html+=legalCard(legal);
  for(const [name,list] of Object.entries(groups))html+="<section class='panel'><div class='section-head'><div><span class='eyebrow'>"+esc(name.toUpperCase())+"</span><h2>"+esc(name)+"</h2></div><span class='counter'>"+list.filter(f=>filled(state.data[f.id])).length+"/"+list.length+"</span></div>"+list.map(f=>"<div class='field-block' data-block='"+esc(f.id)+"'>"+control(f)+"</div>").join("")+"</section>";
  html+="<div class='wizard-actions'><button id='prevStageBtn' class='secondary-btn' type='button' "+(stage.id===1?"disabled":"")+">Anterior</button><button id='nextStageBtn' class='primary-btn' type='button'>"+(stage.id===5?"Revisar expediente":"Continuar")+"</button></div>";
  $("sections").innerHTML=html;
  $("protectedContent").innerHTML="<div class='summary-card'><div class='metric-grid'><div class='mini-card'><span>Nivel</span><strong>"+r.level+"</strong></div><div class='mini-card'><span>Señales</span><strong>"+r.flags.length+"</strong></div><div class='mini-card'><span>Puntuación</span><strong>"+r.score+"</strong></div></div>"+r.flags.map(f=>"<div class='risk-row'><span>"+esc(f.label)+"</span><b>"+esc(f.severity)+"</b></div>").join("")+"</div>";
  $("expertData").textContent=JSON.stringify({appVersion:VERSION,contractId:state.contractId,contractVersion:state.contractVersion,lifecycle:state.lifecycle,stage,legal,risk:r,validation:val,optimizationCount:OPTIMIZATIONS.length,fields:stageFs.map(f=>f.id),documents:documentManifest(),audit:state.audit.slice(-12)},null,2);
  $("prevStageBtn").onclick=()=>{if(stage.id>1){state.currentStage--;renderForm();window.scrollTo({top:0,behavior:"smooth"});}};
  $("nextStageBtn").onclick=()=>{if(stage.id<5){if(stagePct.required&&stagePct.pct<100){refreshFormMeta();document.querySelector("[data-block='"+CSS.escape(stageFs.find(f=>f.required&&!filled(state.data[f.id]))?.id||"")+"']")?.scrollIntoView({behavior:"smooth",block:"center"});return;}state.currentStage++;auditStage(stage.id+1);renderForm();window.scrollTo({top:0,behavior:"smooth"});}else document.querySelector("#reviewBtn")?.click();};
  updateViews();
}
function auditStage(n){try{localStorage.setItem("ce-stage",String(n))}catch{}}
export function renderReview(){
  const r=riskAssessment(),v=validate(),legal=v.legal,d=state.data;
  const rows=[["Contrato",state.contractId],["Versión",state.contractVersion],["Estado",state.lifecycle],["Inmueble",[d.municipality,d.province].filter(Boolean).join(", ")||"—"],["Renta",d.rentAmount?Number(d.rentAmount).toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—"],["Política jurídica",legal.policyVersion]];
  $("reviewSummary").innerHTML="<div class='summary-card'>"+rows.map(([k,x])=>"<div class='hash-row'><span>"+k+"</span><b class='break'>"+esc(x)+"</b></div>").join("")+"<div class='hash-row'><span>SHA-256</span><b class='break'>"+esc(state.hash||"Pendiente")+"</b></div><div class='notice'>El cálculo jurídico es informativo y está basado en política versionada; la consolidación oficial debe comprobarse antes de producción.</div></div>";
  $("reviewDocs").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>TAREAS</span><h2>Qué queda por resolver</h2></div></div>"+(taskList({validation:v,legal,fieldsById:SCHEMA}).map(t=>"<button class='task-row "+t.level+"' type='button' data-stage='"+t.stage+"'><span>"+esc(t.label)+"</span><b>Etapa "+t.stage+"</b></button>").join("")||"<p class='muted'>No hay tareas pendientes.</p>")+"</div>";
  $("reviewDiff").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>CLÁUSULAS</span><h2>Motor declarativo</h2></div><span class='counter'>"+state.clauses.length+"</span></div>"+state.clauses.map(c=>"<article class='clause-card'><div><b>"+esc(c.title)+"</b><span>"+esc((c.sourceRuleIds||[]).join(", ")||"Regla general")+"</span></div><p>"+esc(c.body)+"</p></article>").join("")+"</div>";
  $("signContent").innerHTML="<div class='summary-card'><div class='hash-row'><span>Contrato</span><b>"+esc(state.contractId)+"</b></div><div class='hash-row'><span>Versión</span><b>"+esc(state.contractVersion)+"</b></div><div class='hash-row'><span>Huella</span><b class='break'>"+esc(state.hash||"Pendiente")+"</b></div><div class='notice'>Esta pantalla solo prepara una solicitud de firma. No se simula identidad ni firma electrónica cualificada.</div></div>";
  const timeline=state.audit.slice(-20).reverse();
  $("stateTitle").textContent=state.lifecycle;$("stateSub").textContent="Contrato "+state.contractId+" · v"+state.contractVersion;
  $("stateCard").innerHTML="<div class='summary-card'><div class='section-head'><div><span class='eyebrow'>TIMELINE</span><h2>Actividad contractual</h2></div><span class='counter'>"+timeline.length+"</span></div>"+timeline.map(e=>"<div class='audit-row'><b>"+esc(e.action)+"</b><span>"+new Date(e.timestamp).toLocaleString("es-ES")+"</span></div>").join("")+(state.prepared?"<div class='button-row' style='margin-top:12px'><button id='qrBtn' class='secondary-btn' type='button'>Generar QR</button><button id='copyBtn' class='primary-btn' type='button'>Copiar verificación</button></div>":"")+"</div>";
  if(state.prepared){$("qrBtn").onclick=window.__createQR;$("copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(state.qrUrl);$("copyBtn").textContent="Copiado";}catch{alert(state.qrUrl);}};}
}
export function updateViews(){
  for(const [id,v] of [["formView","form"],["reviewView","review"],["protectedView","protected"],["signView","sign"],["stateView","state"]])$(id).classList.toggle("hidden",state.view!==v);
  document.querySelectorAll(".world-tab").forEach(b=>b.classList.toggle("active",b.dataset.nav===state.nav));
  if(state.view==="review"||state.view==="sign"||state.view==="state")renderReview();
}
