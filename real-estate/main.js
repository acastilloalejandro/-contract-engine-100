import {fields, phases, isActive, validateRealEstateDraft, computeIndicativeEURPerBTC, MODULE_ID, MODULE_VERSION} from "./schema.js";

const $=id=>document.getElementById(id);
const form=$("contractForm"),host=$("fields"),result=$("result"),status=$("status");
const controls=new Map(),wrappers=new Map();
const labels={
 segunda_mano:"Segunda mano",obra_nueva:"Obra nueva",onchain:"Bitcoin on-chain (sin ejecutar)",
 tercero_regulado:"Proveedor externo (no conectado)",multisig:"Multifirma con tercero (no conectada)",
 bitcoin_mainnet:"Bitcoin mainnet (solo documentación)",
 ninguna:"Sin arras",penitenciales:"Penitenciales",confirmatorias:"Confirmatorias",penales:"Penales",
 andalucia:"Andalucía",aragon:"Aragón",asturias:"Asturias",baleares:"Illes Balears",canarias:"Canarias",
 cantabria:"Cantabria",castilla_la_mancha:"Castilla-La Mancha",castilla_leon:"Castilla y León",
 cataluna:"Cataluña",comunidad_valenciana:"Comunitat Valenciana",extremadura:"Extremadura",
 galicia:"Galicia",madrid:"Comunidad de Madrid",murcia:"Región de Murcia",navarra:"Navarra",
 pais_vasco:"País Vasco",la_rioja:"La Rioja",ceuta:"Ceuta",melilla:"Melilla"
};
const help={
 cadastralReference:"Formato de 20 caracteres. La titularidad y la existencia no están comprobadas.",
 btcAmount:"Hasta ocho decimales. No introduzcas direcciones de cartera ni claves.",
 priceEUR:"Precio de referencia pactado; no representa tasación.",
 rateSource:"Indica cómo se documentaría la cotización. La app no consulta cotizaciones.",
 rateTimestamp:"Escribe expresamente el horario UTC acordado.",
 quoteExpiresAt:"Opcional; no representa una orden ni bloquea una cotización.",
 arrasAmountEUR:"Importe propuesto, sujeto a asesoramiento jurídico.",
 paymentMethod:"Ninguna opción inicia ni autoriza una transferencia.",
 terms:"No incluyas documentación personal ni datos reales en esta demo."
};
let current=0,exportText="",exportHash="";
function collect(){
 const raw=Object.fromEntries(fields.map(f=>[f.id,f.type==="checkbox"?controls.get(f.id).checked:controls.get(f.id).value.trim()]));
 return Object.fromEntries(Object.entries(raw).filter(([id])=>isActive(fields.find(f=>f.id===id),raw)));
}
function clearErrors(){
 for(const field of fields){
  const el=controls.get(field.id);el.removeAttribute("aria-invalid");
  const node=$("error-"+field.id);node.textContent="";
 }
}
function showErrors(errors,onlyCurrent=false){
 let first=null;
 for(const [id,message] of Object.entries(errors)){
  if(onlyCurrent&&!phases[current].ids.includes(id))continue;
  const control=controls.get(id),error=$("error-"+id);
  if(!control||!error)continue;
  error.textContent=message;control.setAttribute("aria-invalid","true");first??=control;
 }
 first?.focus();return first===null;
}
function clearResult(){
 result.hidden=true;exportText="";exportHash="";$("recordState").textContent="Borrador modificado";
}
function render(){
 const phase=phases[current],input=collect();
 $("stepHeading").textContent=phase.title;$("stepDescription").textContent=phase.caption;
 $("stepCounter").textContent="PASO "+String(current+1).padStart(2,"0")+" DE "+String(phases.length).padStart(2,"0");
 $("stepIcon").textContent=String(current+1).padStart(2,"0");
 $("previous").disabled=current===0;
 $("next").hidden=current===phases.length-1;$("submit").hidden=current!==phases.length-1;
 const pct=Math.round((current+1)/phases.length*100);
 $("progressValue").textContent=pct+"%";$("progressBar").style.width=pct+"%";
 $("progressNote").textContent="Paso "+(current+1)+" de "+phases.length;
 for(const field of fields){
  const on=phase.ids.includes(field.id)&&isActive(field,input);
  wrappers.get(field.id).hidden=!on;
  controls.get(field.id).disabled=!on;
 }
 const steps=$("steps");steps.replaceChildren();
 for(const [i,item] of phases.entries()){
  const button=document.createElement("button");button.type="button";
  button.className=(i===current?"active":i<current?"done":"");
  button.disabled=i>current;
  if(i===current)button.setAttribute("aria-current","step");
  const number=document.createElement("span");number.className="step-number";number.textContent=i<current?"✓":String(i+1);
  button.append(number,document.createTextNode(item.title));
  button.addEventListener("click",()=>{if(i<current){current=i;clearErrors();status.textContent="";render();}});
  steps.append(button);
 }
}
function validateCurrent(){
 clearErrors();const validation=validateRealEstateDraft(collect());
 return showErrors(validation.errors,true);
}
for(const field of fields){
 const wrap=document.createElement("div");wrap.className="field"+(field.type==="textarea"||field.type==="checkbox"?" wide":"")+(field.type==="checkbox"?" check":"");
 const label=document.createElement("label");label.htmlFor=field.id;
 label.textContent=field.label;
 if(field.required){const a=document.createElement("span");a.textContent=" *";a.className="required";label.append(a);}
 let control;
 if(field.type==="select"){
  control=document.createElement("select");const blank=document.createElement("option");blank.value="";blank.textContent="Seleccionar una opción";control.append(blank);
  for(const value of field.values){const opt=document.createElement("option");opt.value=value;opt.textContent=labels[value]||value;control.append(opt);}
 }else if(field.type==="textarea"){control=document.createElement("textarea");control.rows=4;}
 else{control=document.createElement("input");control.type=field.type==="decimal"?"text":field.type||"text";if(field.type==="decimal")control.inputMode="decimal";}
 control.id=field.id;control.name=field.id;control.autocomplete=field.autocomplete||"off";
 control.required=Boolean(field.required);if(field.maxLength)control.maxLength=field.maxLength;
 if(field.type==="checkbox")wrap.append(control,label);else wrap.append(label,control);
 if(help[field.id]){const p=document.createElement("span");p.className="field-help";p.id="help-"+field.id;p.textContent=help[field.id];wrap.append(p);}
 const error=document.createElement("span");error.className="field-error";error.id="error-"+field.id;error.setAttribute("aria-live","polite");wrap.append(error);
 control.setAttribute("aria-describedby",(help[field.id]?"help-"+field.id+" ":"")+error.id);
 if(field.defaultValue)control.value=field.defaultValue;
 controls.set(field.id,control);wrappers.set(field.id,wrap);host.append(wrap);
}
form.addEventListener("input",()=>{clearResult();clearErrors();render();});
form.addEventListener("change",()=>{clearResult();clearErrors();render();});
$("next").addEventListener("click",()=>{
 if(!validateCurrent()){status.textContent="Revisa los datos indicados antes de continuar.";return;}
 current++;status.textContent="";render();$("stepHeading").scrollIntoView({behavior:"auto",block:"center"});
});
$("previous").addEventListener("click",()=>{
 if(current>0){current--;status.textContent="";clearErrors();render();}
});
form.addEventListener("reset",()=>{
 current=0;exportText="";exportHash="";result.hidden=true;status.textContent="";
 $("recordState").textContent="Borrador local";queueMicrotask(()=>{controls.get("btcNetwork").value="bitcoin_mainnet";clearErrors();render();});
});
function addNarrative(title,text){
 const box=document.createElement("div"),heading=document.createElement("h3"),p=document.createElement("p");
 heading.textContent=title;p.textContent=text;box.append(heading,p);$("narrative").append(box);
}
form.addEventListener("submit",async event=>{
 event.preventDefault();const input=collect();const checked=validateRealEstateDraft(input);clearErrors();
 if(!checked.valid){
  const target=fields.find(f=>checked.errors[f.id]);
  current=Math.max(0,phases.findIndex(p=>p.ids.includes(target?.id)));
  render();showErrors(checked.errors);status.textContent="Hay errores que debes resolver.";return;
 }
 if(!globalThis.crypto?.subtle){status.textContent="Necesitas HTTPS para calcular la huella SHA-256.";return;}
 const payload={
  module:MODULE_ID,version:MODULE_VERSION,jurisdiction:"ES",status:"DRAFT_UNVERIFIED",
  generatedAt:new Date().toISOString(),data:input,
  warnings:["No implica autorización ni ejecución de pago","Identidad, titularidad y cargas no comprobadas","Firma, notaría y fiscalidad pendientes"]
 };
 exportText=JSON.stringify(payload,null,2);
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(exportText));
 exportHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 $("digest").textContent="SHA-256 del JSON exportado: "+exportHash;
 $("preview").textContent=exportText;$("narrative").replaceChildren();
 const indicative=computeIndicativeEURPerBTC(input.priceEUR,input.btcAmount);
 addNarrative("Partes",input.seller+" · "+input.buyer);
 addNarrative("Inmueble",input.propertyAddress+" · Ref. catastral: "+input.cadastralReference);
 addNarrative("Valor documentado",input.priceEUR+" EUR · "+input.btcAmount+" BTC");
 addNarrative("Cotización implícita","≈ "+(indicative||"No disponible")+" EUR/BTC. Calculada a partir de importes introducidos, no cotización de mercado.");
 addNarrative("Referencia de cotización",input.rateSource+" · "+input.rateTimestamp+" UTC");
 addNarrative("Método propuesto",labels[input.paymentMethod]||"No especificado");
 addNarrative("Situación","Sin verificación, firma, cargo bancario, custodia ni transferencia blockchain.");
 result.hidden=false;$("recordState").textContent="Borrador sin verificar";
 status.textContent="Borrador local generado. Requiere revisión profesional.";
 result.scrollIntoView({behavior:"auto",block:"start"});
});
$("download").addEventListener("click",()=>{
 if(!exportText)return;
 const blob=new Blob([exportText],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="bithome-borrador-"+MODULE_VERSION+".json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$("print").addEventListener("click",()=>{if(exportText)window.print();});
render();

// The PWA shell is public/static. Its caches must never contain personal drafts or API replies.
if ("serviceWorker" in navigator && location.protocol === "https:") {
 navigator.serviceWorker.register("../sw.js", {scope:"../"}).catch(()=>{});
}
