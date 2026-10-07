import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const verify=fs.readFileSync(path.join(root,'verify.html'),'utf8');
const css=fs.readFileSync(path.join(root,'styles','world-ui.css'),'utf8');
const schema=JSON.parse(fs.readFileSync(path.join(root,'schema','contract-schema.json'),'utf8'));

assert.doesNotMatch(index,/user-scalable\s*=\s*["']no["']/i);
assert.match(index,/world-hero/);
assert.match(index,/world-nav/);
assert.match(index,/world-ui\.css/);
assert.match(index,/crypto\.subtle/);
assert.match(index,/PublicKeyCredential/);
assert.match(index,/STATIC-DEMO/);
assert.match(index,/canonicalDataForHash/);
assert.match(index,/if \(id === 'workerRole'/);
assert.doesNotMatch(index,/Passport_Jeddah_Official\.pdf/);
assert.doesNotMatch(index,/Array\.from\(\{length:25\}/);
assert.match(index,/URL\.revokeObjectURL/);
assert.match(index,/setTimeout\(\(\)=>/);
assert.match(index,/workerReading/);
assert.match(index,/Firma reservada a las partes/);

assert.ok(schema.properties?.workerFullName);
assert.ok(schema.properties?.workerPassport);
assert.ok(Array.isArray(schema.allOf) && schema.allOf.length >= 4);

assert.match(css,/\.world-hero/);
assert.match(css,/prefers-reduced-motion/);
assert.match(verify,/Alcance:/);
assert.match(verify,/SHA-256/);
assert.match(verify,/createElement/);

console.log('Contract Engine 100 smoke tests: OK');