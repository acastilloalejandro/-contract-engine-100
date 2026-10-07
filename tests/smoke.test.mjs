import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
const verify = fs.readFileSync(path.join(root,'verify.html'),'utf8');
const schemaPath = path.join(root,'schema','contract-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath,'utf8'));

assert.match(index,/easyqrcodejs@4\.6\.2/);
assert.match(index,/new window\.QRCode/);
assert.match(index,/crypto\.subtle/);
assert.match(index,/PublicKeyCredential/);
assert.match(index,/STATIC-DEMO/);
assert.doesNotMatch(index,/Passport_Jeddah_Official\.pdf/);
assert.doesNotMatch(index,/Array\.from\(\{length:25\}/);
assert.match(index,/workingDays.*weeklyRestDay|weeklyRestDay.*workingDays/s);
assert.ok(schema.properties?.workerFullName);
assert.ok(schema.properties?.workerPassport);
assert.ok(Array.isArray(schema.allOf) && schema.allOf.length >= 3);
assert.match(verify,/Alcance/);
console.log('Contract Engine 100 smoke tests: OK');
