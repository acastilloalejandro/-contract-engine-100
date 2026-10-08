import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const domain = fs.readFileSync(path.join(root, "src/domain/types.ts"), "utf8");
const rules = fs.readFileSync(path.join(root, "src/rules-engine/rule.ts"), "utf8");
const validation = fs.readFileSync(path.join(root, "src/validation/contract.ts"), "utf8");

assert.match(domain, /export interface ContractState/);
assert.match(rules, /effectiveFrom/);
assert.match(rules, /jurisdiction/);
assert.match(validation, /evaluateRules/);
console.log("Contract OS architecture invariants: OK");
