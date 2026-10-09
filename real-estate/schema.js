// bithome · Declarative form contract for Bitcoin real-estate intake.
// This schema never authorises, broadcasts or verifies an on-chain payment.
export const MODULE_ID = "ES-REAL-ESTATE-BTC";
export const MODULE_VERSION = "1.1.0";
export const LEGAL_REVIEW_REQUIRED = true;
export const phases = [
  {id:"parties",title:"Personas",caption:"Identifica a las partes sin documentos sensibles.",ids:["seller","buyer"]},
  {id:"property",title:"Inmueble",caption:"Delimita el bien y su contexto territorial.",ids:["propertyAddress","autonomousCommunity","municipality","cadastralReference","propertyType","areaM2"]},
  {id:"price",title:"Precio y Bitcoin",caption:"Introduce una cotización pactada; no se consulta ninguna bolsa.",ids:["priceEUR","btcAmount","rateSource","rateTimestamp","quoteExpiresAt","btcNetwork","paymentMethod","multisigArbitrator"]},
  {id:"conditions",title:"Condiciones",caption:"Revisa plazos, arras y obligaciones.",ids:["notary","closingDate","arrasType","arrasAmountEUR","terms"]},
  {id:"review",title:"Revisión",caption:"Confirma los controles que siguen pendientes.",ids:["chargesReview","taxReview","legalReview"]}
];
export const fields = [
 {id:"seller",label:"Nombre del vendedor",required:true,autocomplete:"off"},
 {id:"buyer",label:"Nombre del comprador",required:true,autocomplete:"off"},
 {id:"propertyAddress",label:"Dirección del inmueble",required:true},
 {id:"autonomousCommunity",label:"Comunidad autónoma",type:"select",values:["andalucia","aragon","asturias","baleares","canarias","cantabria","castilla_la_mancha","castilla_leon","cataluna","comunidad_valenciana","extremadura","galicia","madrid","murcia","navarra","pais_vasco","la_rioja","ceuta","melilla"]},
 {id:"municipality",label:"Municipio"},
 {id:"cadastralReference",label:"Referencia catastral (20 caracteres)",required:true,maxLength:20},
 {id:"propertyType",label:"Tipo de inmueble",type:"select",values:["segunda_mano","obra_nueva"],required:true},
 {id:"areaM2",label:"Superficie (m²)",type:"decimal",decimals:2},
 {id:"priceEUR",label:"Valor acordado (EUR)",type:"decimal",decimals:2,required:true},
 {id:"btcAmount",label:"Cantidad de Bitcoin (BTC)",type:"decimal",decimals:8,required:true},
 {id:"rateSource",label:"Fuente de cotización acordada",required:true},
 {id:"rateTimestamp",label:"Fecha y hora de cotización (UTC)",type:"datetime-local",required:true},
 {id:"quoteExpiresAt",label:"Caducidad pactada de cotización (UTC)",type:"datetime-local"},
 {id:"btcNetwork",label:"Red Bitcoin",type:"select",values:["bitcoin_mainnet"],required:true,defaultValue:"bitcoin_mainnet"},
 {id:"paymentMethod",label:"Método propuesto",type:"select",values:["onchain","tercero_regulado","multisig"],required:true},
 {id:"multisigArbitrator",label:"Tercero designado para multifirma",when:{field:"paymentMethod",equals:"multisig"}},
 {id:"notary",label:"Notaría propuesta"},
 {id:"closingDate",label:"Fecha de otorgamiento",type:"date"},
 {id:"arrasType",label:"Tipo de arras",type:"select",values:["ninguna","penitenciales","confirmatorias","penales"]},
 {id:"arrasAmountEUR",label:"Importe de arras (EUR)",type:"decimal",decimals:2,when:{field:"arrasType",notEquals:"ninguna"}},
 {id:"terms",label:"Pactos adicionales",type:"textarea",maxLength:2000},
 {id:"chargesReview",label:"Comprendo que las cargas y titularidad no están verificadas",type:"checkbox"},
 {id:"taxReview",label:"Comprendo que impuestos y obligaciones AML requieren evaluación",type:"checkbox"},
 {id:"legalReview",label:"Confirmo que se requiere revisión jurídica, fiscal y notarial",type:"checkbox",required:true}
];
const numberPattern=/^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const moneyPattern=/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const datePattern=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
export function isActive(field,input){
 if(!field.when)return true;
 if(field.when.equals!==undefined)return input[field.when.field]===field.when.equals;
 if(field.when.notEquals!==undefined)return Boolean(input[field.when.field]) && input[field.when.field]!==field.when.notEquals;
 return true;
}
function validDatetime(value){
 if(!datePattern.test(value))return false;
 const date=new Date(value+":00Z");
 return Number.isFinite(date.getTime()) && date.toISOString().slice(0,16)===value;
}
export function validateRealEstateDraft(input){
 const errors={};
 if(!input||typeof input!=="object"||Array.isArray(input))return {valid:false,errors:{form:"Datos inválidos."}};
 for(const field of fields){
  if(!isActive(field,input))continue;
  const value=input[field.id];
  if(field.required && (field.type==="checkbox"?value!==true:typeof value!=="string"||!value.trim()))errors[field.id]="Campo obligatorio.";
  if(typeof value==="string" && value.length>(field.maxLength||2000))errors[field.id]="Longitud máxima superada.";
  if(field.type==="select" && value && !field.values.includes(value))errors[field.id]="Selecciona una opción válida.";
  if(field.type==="decimal" && value!==undefined && value!==""){
   if(!numberPattern.test(String(value)) || !Number.isFinite(Number(value)) || Number(value)<=0)
    errors[field.id]="Introduce un importe positivo, con punto decimal y sin miles.";
   else if(String(value).split(".")[1]?.length>(field.decimals||8))
    errors[field.id]="Se admiten como máximo "+field.decimals+" decimales.";
  }
  if(field.type==="datetime-local"&&value&&!validDatetime(String(value)))errors[field.id]="Fecha y hora UTC inválidas.";
 }
 if(input.cadastralReference && !/^[A-Z0-9]{20}$/.test(String(input.cadastralReference).toUpperCase()))errors.cadastralReference="Referencia catastral: 20 caracteres alfanuméricos (no acredita existencia).";
 if(input.priceEUR && !moneyPattern.test(String(input.priceEUR)))errors.priceEUR="Máximo dos decimales para EUR.";
 if(input.arrasAmountEUR && !moneyPattern.test(String(input.arrasAmountEUR)))errors.arrasAmountEUR="Máximo dos decimales para EUR.";
 if(input.quoteExpiresAt&&input.rateTimestamp&&validDatetime(input.quoteExpiresAt)&&validDatetime(input.rateTimestamp)&&input.quoteExpiresAt<=input.rateTimestamp)
  errors.quoteExpiresAt="La caducidad debe ser posterior al instante de cotización.";
 if(input.arrasAmountEUR&&moneyPattern.test(String(input.arrasAmountEUR))&&moneyPattern.test(String(input.priceEUR))&&Number(input.arrasAmountEUR)>Number(input.priceEUR))
  errors.arrasAmountEUR="Las arras no pueden superar el precio.";
 return {valid:Object.keys(errors).length===0,errors};
}
// Keep public QR and public previews strictly free of PII and wallet identifiers.
export function publicDraft(input){
 return {module:MODULE_ID,version:MODULE_VERSION,jurisdiction:"ES",status:"DRAFT_UNVERIFIED",
   propertyType:input.propertyType,priceEUR:input.priceEUR,btcAmount:input.btcAmount};
}
export function computeIndicativeEURPerBTC(price,btc){
 const eur=String(price||""),b=String(btc||"");
 if(!moneyPattern.test(eur)||!numberPattern.test(b)||Number(b)<=0||b.split(".")[1]?.length>8)return null;
 const cents=BigInt(eur.split(".")[0])*100n+BigInt((eur.split(".")[1]||"").padEnd(2,"0"));
 const sat=BigInt(b.split(".")[0])*100000000n+BigInt((b.split(".")[1]||"").padEnd(8,"0"));
 if(sat===0n)return null;
 const integer=(cents*100000000n)/sat;
 return (Number(integer)/100).toFixed(2);
}
