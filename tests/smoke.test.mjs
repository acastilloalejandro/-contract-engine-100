import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(new URL("..",import.meta.url).pathname);
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const index=read("index.html"),schema=read("app/schema.js"),engine=read("app/engine.js"),ui=read("app/ui.js"),main=read("app/main.js"),css=read("styles/world-ui.css"),verify=read("verify.html"),workflow=read("app/workflow.js"),legal=read("app/legal-policy.js"),clauses=read("app/clauses.js"),manifest=JSON.parse(read("manifest.webmanifest"));
assert.match(index,/app\/main\.js/);assert.match(index,/stageNav/);assert.match(index,/Alquiler España/);
assert.equal((schema.match(/F\("/g)||[]).length>=70,true);assert.match(schema,/priorLeaseWithinFiveYears/);assert.match(schema,/tensionedZone/);assert.match(schema,/computed:true/);
assert.match(engine,/contractId/);assert.match(engine,/contractVersion/);assert.match(engine,/PROFILE_STORAGE_KEY/);assert.match(engine,/assessRentalContext/);assert.match(engine,/documentManifest/);assert.match(engine,/crypto\.subtle/);
assert.match(ui,/stageFields/);assert.match(ui,/profileCard/);assert.match(ui,/Motor declarativo/);assert.match(main,/openNextContractVersion/);assert.match(main,/data-profile/);
assert.match(workflow,/STAGES=\[/);assert.equal((workflow.match(/id:/g)||[]).length>=5,true);
assert.match(legal,/LEGAL_POLICY_VERSION/);assert.match(legal,/CAT_ZMRT/);assert.match(legal,/official_lookup_required/);assert.match(legal,/Hospitalet/);
assert.match(clauses,/generateClauses/);
assert.match(css,/stage-nav/);assert.match(css,/clause-card/);assert.match(verify,/Request ID/);assert.match(verify,/Política/);
assert.match(schema,/OPTIMIZATIONS=/);assert.equal((schema.match(/"/g)||[]).length>150,true);
assert.equal(manifest.display,"standalone");assert.equal(manifest.lang,"es");
console.log("Spain Housing Rental v6.1 smoke tests: OK");\n// CI checkpoint: five-stage rental architecture.
