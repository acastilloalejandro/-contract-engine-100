import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../src/index.js";
globalThis.crypto ||= webcrypto;

const app="https://app.example.com",api="https://api.example.com";
const idOwned="f11eb433-ae1e-49ed-b69c-0d41d4988571",idForeign="03bdbcc5-39f6-4e2d-8cc2-cb9a8318fd30";
async function digest(s){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));let binary="";for(const b of new Uint8Array(bytes))binary+=String.fromCharCode(b);return btoa(binary).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");}
const token="bithome-token",tokenHash=await digest(token);
const now=Math.floor(Date.now()/1000);
const storage=[
 {id:idOwned,user_id:"u1",property_type:"segunda_mano",phase:2,revision:1,created_at:now,updated_at:now},
 {id:idForeign,user_id:"u2",property_type:"obra_nueva",phase:3,revision:1,created_at:now,updated_at:now}
];
const calls=[];
const db={prepare(sql){
 let p=[];
 return {
  bind(...params){p=params;return this;},
  async first(){calls.push({op:"first",sql,p});
    if(sql.includes("FROM sessions s JOIN users u") && p[0]===tokenHash)return {id:"u1",email:"alice@example.invalid",email_verified:1,phone_verified:0,identity_status:"unverified"};
    if(sql.includes("INSERT INTO rate_limits"))return {count:1};
    if(sql.includes("FROM real_estate_cases WHERE id = ?"))return storage.find(r=>r.id===p[0]&&r.user_id===p[1])||null;
    return null;
  },
  async all(){calls.push({op:"all",sql,p});
    if(sql.includes("FROM real_estate_cases"))return {results:storage.filter(r=>r.user_id===p[0])};
    return {results:[]};
  },
  async run(){calls.push({op:"run",sql,p});
    if(sql.includes("INSERT INTO real_estate_cases")){
      storage.push({id:p[0],user_id:p[1],property_type:p[2],phase:p[3],revision:1,created_at:p[4],updated_at:p[5]});
    }
    return {meta:{changes:1}};
  }
 };
}};
const env={APP_ORIGIN:app,API_ORIGIN:api,DB:db};
function req(path,method="GET",body,authorized=true,origin=app){
 const headers={Origin:origin};
 if(authorized)headers.Cookie="__Host-ce_session="+token;
 if(body!==undefined)headers["Content-Type"]="application/json";
 return new Request(api+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
}
const unauthorized=await worker.fetch(req("/v1/real-estate/cases","GET",undefined,false),env);
assert.equal(unauthorized.status,401);
assert.equal((await unauthorized.json()).code,"AUTH_REQUIRED");
const invalidOrigin=await worker.fetch(req("/v1/real-estate/cases","GET",undefined,true,"https://attacker.invalid"),env);
assert.equal(invalidOrigin.status,403);
const ownerList=await worker.fetch(req("/v1/real-estate/cases"),env);
assert.equal(ownerList.status,200);
const listed=await ownerList.json();
assert.equal(listed.cases.length,1);
assert.equal(listed.cases[0].id,idOwned);
assert.equal(JSON.stringify(listed).includes(idForeign),false);
const owner=await worker.fetch(req("/v1/real-estate/cases/"+idOwned),env);
assert.equal(owner.status,200);
assert.equal((await owner.json()).case.id,idOwned);
const other=await worker.fetch(req("/v1/real-estate/cases/"+idForeign),env);
assert.equal(other.status,404);
const blocked=await worker.fetch(req("/v1/real-estate/cases","POST",{propertyType:"segunda_mano",phase:1,wallet:"bc1qexample"}),env);
assert.equal(blocked.status,400);
assert.equal((await blocked.json()).code,"INVALID_CASE_METADATA");
const blockedAddress=await worker.fetch(req("/v1/real-estate/cases","POST",{propertyType:"segunda_mano",phase:1,propertyAddress:"Calle Real"}),env);
assert.equal(blockedAddress.status,400);
const invalidPhase=await worker.fetch(req("/v1/real-estate/cases","POST",{propertyType:"segunda_mano",phase:6}),env);
assert.equal(invalidPhase.status,400);
const created=await worker.fetch(req("/v1/real-estate/cases","POST",{propertyType:"segunda_mano",phase:1}),env);
assert.equal(created.status,201);
const payload=await created.json();
assert.equal(payload.case.status,"DRAFT_UNVERIFIED");
assert.equal(storage.length,3);
assert.equal(storage[2].user_id,"u1");
assert.equal(await (await worker.fetch(req("/v1/real-estate/cases/"+payload.case.id),env)).status,200);
assert.ok(calls.some(c=>c.sql.includes("FROM real_estate_cases WHERE id = ? AND user_id = ?")));
assert.ok(calls.some(c=>c.sql.includes("FROM real_estate_cases WHERE user_id = ?")));
const forbiddenPut=await worker.fetch(req("/v1/real-estate/cases","PUT"),env);
assert.equal(forbiddenPut.status,405);
console.log("Bithome authenticated case metadata and authorization: OK");
