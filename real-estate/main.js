import {fields,validateRealEstateDraft,MODULE_ID,MODULE_VERSION} from "./schema.js";
const phases=[{title:"Partes",ids:["seller","buyer"]},{title:"Inmueble",ids:["propertyAddress","cadastralReference","propertyType"]},{title:"Precio y Bitcoin",ids:["priceEUR","btcAmount","rateSource","rateTimestamp","paymentMethod"]},{title:"Condiciones",ids:["notary","closingDate","terms"]},{title:"Revisión",ids:["legalReview"]}];
const form=document.querySelector("#contractForm"),host=document.querySelector("#fields"),result=document.querySelector("#result"),status=document.querySelector("#status");
let current=0,exportText="";
const controls=new Map();
const readable={segunda_mano:"Segunda mano",obra_nueva:"Obra nueva",onchain:"Transacción Bitcoin on-chain (sin ejecutar)",tercero_regulado:"Proveedor externo (pendiente de integrar)",multisig:"Multifirma con tercero (pendiente de integrar)"};
for(const field of fields){
 const wrap=document.createElement("div");wrap.className="field"+(["textarea","checkbox"].includes(field.type)?" wide":"")+(field.type==="checkbox"?" check":"");wrap.dataset.fieldWrap=field.id;
 const label=document.createElement("label");label.htmlFor=field.id;label.textContent=field.label+(field.required?" *":"");
 let control;
 if(field.type==="select"){control=document.createElement("select");const blank=document.createElement("option");blank.value="";blank.textContent="Seleccionar";control.append(blank);for(const value of field.values){const option=document.createElement("option");option.value=value;option.textContent=readable[value]||value;control.append(option);}}
 else if(field.type==="textarea")control=document.createElement("textarea");
 else {control=document.createElement("input");control.type=field.type==="decimal"?"text":field.type==="checkbox"?"checkbox":field.type||"text";if(field.type==="decimal")control.inputMode="decimal";}
 control.id=field.id;control.name=field.id;control.required=!!field.required;control.autocomplete="off";controls.set(field.id,control);
 if(field.type==="checkbox")wrap.append(control,label);else wrap.append(label,control);
 const error=document.createElement("span");error.className="error";error.id="error-"+field.id;wrap.append(error);host.append(wrap);
}
const data=()=>Object.fromEntries(fields.map(f=>[f.id,f.type==="checkbox"?controls.get(f.id).checked:controls.get(f.id).value.trim()]));
const clearErrors=()=>document.querySelectorAll(".error").forEach(e=>e.textContent="");
function render(){
 const phase=phases[current];document.querySelector("#stepHeading").textContent=(current+1)+"/5 · "+phase.title;
 for(const f of fields){const block=host.querySelector('[data-field-wrap="'+f.id+'"]');const enabled=phase.ids.includes(f.id);block.hidden=!enabled;controls.get(f.id).disabled=!enabled;}
 document.querySelector("#previous").disabled=current===0;document.querySelector("#next").hidden=current===phases.length-1;document.querySelector("#submit").hidden=current!==phases.length-1;
 document.querySelector("#progressNote").textContent="Etapa "+(current+1)+" de "+phases.length;
 const steps=document.querySelector("#steps");steps.replaceChildren();phases.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.textContent=(i+1)+". "+p.title;b.className=i===current?"active":"";b.setAttribute("aria-current",i===current?"step":"false");b.addEventListener("click",()=>{if(i<current){current=i;clearErrors();render();}});steps.append(b);});
}
function validateStep(){const check=validateRealEstateDraft(data());clearErrors();let first=null;for(const id of phases[current].ids){if(check.errors[id]){document.querySelector("#error-"+id).textContent=check.errors[id];first??=controls.get(id);}}first?.focus();return !first;}
document.querySelector("#next").addEventListener("click",()=>{if(!validateStep()){status.textContent="Corrige los campos señalados.";return;}current++;status.textContent="";render();});
document.querySelector("#previous").addEventListener("click",()=>{if(current>0){current--;clearErrors();status.textContent="";render();}});
form.addEventListener("input",()=>{result.hidden=true;exportText="";document.querySelector("#recordState").textContent="Borrador modificado";});
form.addEventListener("reset",()=>{current=0;exportText="";result.hidden=true;status.textContent="";clearErrors();queueMicrotask(render);});
form.addEventListener("submit",async event=>{
 event.preventDefault();const input=data();const check=validateRealEstateDraft(input);clearErrors();
 if(!check.valid){const target=fields.find(f=>check.errors[f.id]);current=phases.findIndex(p=>p.ids.includes(target?.id));if(current<0)current=0;render();for(const [id,msg] of Object.entries(check.errors)){const element=document.getElementById("error-"+id);if(element)element.textContent=msg;}controls.get(target.id)?.focus();status.textContent="Revisa los campos obligatorios.";return;}
 if(!crypto.subtle){status.textContent="Web Crypto requiere un contexto seguro.";return;}
 const payload={module:MODULE_ID,version:MODULE_VERSION,jurisdiction:"ES",status:"DRAFT_UNVERIFIED",generatedAt:new Date().toISOString(),data:input,disclaimers:["Borrador no firmado ni verificado","Revisión jurídica, fiscal y notarial pendiente"]};
 exportText=JSON.stringify(payload,null,2);
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(exportText));
 const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
 document.querySelector("#digest").textContent="SHA-256 del JSON exportado: "+hash;
 document.querySelector("#preview").textContent=exportText;
 const narrative=document.querySelector("#narrative");narrative.replaceChildren();
 for(const [title,text] of [["Partes",input.seller+" (vendedor/a) y "+input.buyer+" (comprador/a)"],["Inmueble",input.propertyAddress+" · Ref. catastral: "+input.cadastralReference],["Precio acordado",input.priceEUR+" EUR; contraprestación propuesta: "+input.btcAmount+" BTC"],["Cotización",input.rateSource+" · "+input.rateTimestamp+" (UTC)"],["Pago propuesto",readable[input.paymentMethod]],["Condiciones",input.terms||"Sin condiciones adicionales redactadas"],["Situación jurídica","Borrador sin comprobar título, cargas, impuestos, representación ni medios de pago"]]){const h=document.createElement("h3");h.textContent=title;const p=document.createElement("p");p.textContent=text;narrative.append(h,p);}
 result.hidden=false;status.textContent="Borrador local generado. Pendiente de revisión profesional.";document.querySelector("#recordState").textContent="Borrador sin verificar";result.scrollIntoView({behavior:"smooth"});
});
document.querySelector("#download").addEventListener("click",()=>{if(!exportText)return;const blob=new Blob([exportText],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="compraventa-btc-borrador.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.querySelector("#print").addEventListener("click",()=>{if(exportText)window.print();});
render();
