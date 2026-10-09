import {fields,validateRealEstateDraft,MODULE_ID,MODULE_VERSION} from "./schema.js";
const form=document.querySelector("#contractForm"), host=document.querySelector("#fields"), result=document.querySelector("#result");
const status=document.querySelector("#status"), preview=document.querySelector("#preview"), digest=document.querySelector("#digest");
let exportText="";
for (const field of fields){
 const wrap=document.createElement("div");wrap.className="field"+(field.type==="textarea"||field.type==="checkbox"?" wide":"")+(field.type==="checkbox"?" check":"");
 const label=document.createElement("label");label.htmlFor=field.id;label.textContent=field.label+(field.required?" *":"");
 let control;
 if(field.type==="select"){control=document.createElement("select");const blank=document.createElement("option");blank.value="";blank.textContent="Seleccionar";control.append(blank);for(const value of field.values){const o=document.createElement("option");o.value=value;o.textContent=({segunda_mano:"Segunda mano",obra_nueva:"Obra nueva",onchain:"Bitcoin on-chain",tercero_regulado:"Proveedor regulado (pendiente)",multisig:"Multifirma (pendiente)"})[value]||value;control.append(o);}}
 else if(field.type==="textarea")control=document.createElement("textarea");
 else{control=document.createElement("input");control.type=field.type==="decimal"?"text":field.type==="checkbox"?"checkbox":field.type||"text";if(field.type==="decimal")control.inputMode="decimal";}
 control.id=field.id;control.name=field.id;if(field.required)control.required=true;
 if(field.type==="checkbox"){wrap.append(control,label);}else{wrap.append(label,control);}
 const error=document.createElement("span");error.className="error";error.id="error-"+field.id;wrap.append(error);host.append(wrap);
}
form.addEventListener("submit",async event=>{
 event.preventDefault();result.hidden=true;const input={};
 for(const field of fields){const element=form.elements.namedItem(field.id);input[field.id]=field.type==="checkbox"?element.checked:element.value.trim();}
 const validation=validateRealEstateDraft(input);
 for(const field of fields)document.getElementById("error-"+field.id).textContent=validation.errors[field.id]||"";
 if(!validation.valid){status.textContent="Corrige los campos señalados. No se ha generado un documento.";return;}
 const payload={module:MODULE_ID,version:MODULE_VERSION,jurisdiction:"ES",status:"DRAFT_UNVERIFIED",generatedAt:new Date().toISOString(),data:input,disclaimers:["Sin verificación de titularidad, firma ni pago","Sujeto a revisión jurídica y fiscal"]};
 exportText=JSON.stringify(payload,null,2);
 const bytes=new TextEncoder().encode(exportText);
 if(!crypto.subtle){status.textContent="Contexto no seguro: no se pudo calcular SHA-256.";return;}
 const hash=await crypto.subtle.digest("SHA-256",bytes);
 const hex=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
 digest.textContent="SHA-256 del JSON exportado: "+hex;
 preview.textContent=exportText;result.hidden=false;status.textContent="Borrador local generado; pendiente de revisión y firma.";result.scrollIntoView({behavior:"smooth"});
});
form.addEventListener("reset",()=>{result.hidden=true;exportText="";status.textContent="";for(const e of document.querySelectorAll(".error"))e.textContent="";});
document.querySelector("#download").addEventListener("click",()=>{if(!exportText)return;const blob=new Blob([exportText],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="compraventa-btc-borrador.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
