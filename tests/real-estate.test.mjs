import assert from "node:assert/strict";
import {validateRealEstateDraft,publicDraft,MODULE_VERSION} from "../real-estate/schema.js";
const valid={seller:"Ana",buyer:"Luis",propertyAddress:"Calle Mayor 1",cadastralReference:"1234567AB1234C0001DE",propertyType:"segunda_mano",priceEUR:"200000",btcAmount:"2.12500000",rateSource:"Cotización documentada",rateTimestamp:"2026-10-09T12:30",paymentMethod:"onchain",legalReview:true};
assert.equal(validateRealEstateDraft(valid).valid,true);
for(const key of ["seller","buyer","propertyAddress","cadastralReference","priceEUR","btcAmount","rateSource","rateTimestamp","paymentMethod"]){assert.equal(validateRealEstateDraft({...valid,[key]:""}).valid,false,key);}
assert.equal(validateRealEstateDraft({...valid,legalReview:false}).valid,false);
assert.equal(validateRealEstateDraft({...valid,btcAmount:"0.123456789"}).valid,false);
assert.equal(validateRealEstateDraft({...valid,btcAmount:"1e9"}).valid,false);
assert.equal(validateRealEstateDraft({...valid,propertyType:"unknown"}).valid,false);
assert.equal(validateRealEstateDraft({...valid,paymentMethod:"fake"}).valid,false);
const exposed=publicDraft({...valid,dni:"12345678Z",seed:"secret",wallet:"bc1something"});
assert.equal(JSON.stringify(exposed).includes("12345678Z"),false);
assert.equal(JSON.stringify(exposed).includes("bc1something"),false);
assert.equal(exposed.status,"DRAFT_UNVERIFIED");
assert.equal(MODULE_VERSION,"1.0.0");
console.log("Spanish real estate Bitcoin intake tests: OK");
