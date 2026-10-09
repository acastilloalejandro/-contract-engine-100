// Contract Engine 100 | Spanish real-estate Bitcoin draft module.
// This is an intake schema, not a notarised deed, tax determination or payment gateway.
export const MODULE_ID = "ES-REAL-ESTATE-BTC";
export const MODULE_VERSION = "1.0.0";
export const LEGAL_REVIEW_REQUIRED = true;
export const fields = [
  {id:"seller", label:"Nombre del vendedor",required:true},
  {id:"buyer", label:"Nombre del comprador",required:true},
  {id:"propertyAddress",label:"Dirección completa del inmueble",required:true},
  {id:"cadastralReference",label:"Referencia catastral (20 caracteres)",required:true},
  {id:"propertyType",label:"Tipo de transmisión",type:"select",values:["segunda_mano","obra_nueva"],required:true},
  {id:"priceEUR",label:"Valor acordado en EUR",type:"decimal",required:true},
  {id:"btcAmount",label:"Bitcoin acordado (BTC)",type:"decimal",required:true},
  {id:"rateSource",label:"Fuente del tipo de cambio BTC/EUR",required:true},
  {id:"rateTimestamp",label:"Fecha y hora de cotización (UTC)",type:"datetime-local",required:true},
  {id:"paymentMethod",label:"Medio de liquidación",type:"select",values:["onchain","tercero_regulado","multisig"],required:true},
  {id:"notary",label:"Notaría propuesta"},
  {id:"closingDate",label:"Fecha prevista de otorgamiento",type:"date"},
  {id:"terms",label:"Condiciones especiales",type:"textarea"},
  {id:"legalReview",label:"Confirmo que este expediente exige revisión jurídica, fiscal y notarial",type:"checkbox",required:true}
];
const numberPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
export function validateRealEstateDraft(input){
  const errors = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return {valid:false,errors:{form:"Datos inválidos."}};
  for (const field of fields){
    const value = input[field.id];
    if (field.required && (field.type==="checkbox" ? value!==true : typeof value!=="string" || !value.trim()))
      errors[field.id]="Campo obligatorio.";
    if (typeof value==="string" && value.length>2000) errors[field.id]="Longitud máxima superada.";
  }
  if (input.cadastralReference && !/^[A-Z0-9]{20}$/.test(String(input.cadastralReference).toUpperCase()))
    errors.cadastralReference="La referencia catastral debe tener 20 caracteres alfanuméricos. Contrasta su existencia en Catastro.";
  for(const key of ["priceEUR","btcAmount"]){
    const value=String(input[key]??"");
    if(value && (!numberPattern.test(value)||Number(value)<=0||!Number.isFinite(Number(value))))
      errors[key]="Introduce un importe positivo, sin separador de miles.";
  }
  if(input.btcAmount && numberPattern.test(String(input.btcAmount)) && String(input.btcAmount).split(".")[1]?.length>8)
    errors.btcAmount="BTC admite como máximo ocho decimales.";
  if(input.propertyType && !["segunda_mano","obra_nueva"].includes(input.propertyType))errors.propertyType="Tipo no admitido.";
  if(input.paymentMethod && !["onchain","tercero_regulado","multisig"].includes(input.paymentMethod))errors.paymentMethod="Método no admitido.";
  if(input.rateTimestamp && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.rateTimestamp))errors.rateTimestamp="Fecha/hora inválida.";
  return {valid:Object.keys(errors).length===0,errors};
}
export function publicDraft(input){
  // Explicit allowlist: never leak identities, wallet addresses, or identity documents to public QR.
  return {module:MODULE_ID,version:MODULE_VERSION,jurisdiction:"ES",status:"DRAFT_UNVERIFIED",
    propertyType:input.propertyType,priceEUR:input.priceEUR,btcAmount:input.btcAmount};
}
