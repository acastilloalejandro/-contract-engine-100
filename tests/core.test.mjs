import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const pipeline = read("src/pipeline/contract-pipeline.ts");
const classifier = read("src/classification/classify.ts");
const graph = read("src/form-engine/graph.ts");
const schema = read("src/form-engine/schema.ts");
const snapshot = read("src/rules-engine/snapshot.ts");
const rule = read("src/rules-engine/rule.ts");
const rules = read("src/rules-engine/rules.ts");

assert.match(pipeline, /runContractPipeline/);
assert.match(pipeline, /REVIEW_REQUIRED/);
assert.match(pipeline, /READY/);
assert.match(classifier, /confidence/);
assert.match(classifier, /temporaryCause/);
assert.match(graph, /invalidateDependentAnswers/);
assert.match(graph, /fieldData/);
assert.match(schema, /dependsOn/);
assert.match(snapshot, /buildRuleSnapshot/);
assert.match(snapshot, /ENGINE_VERSION/);
assert.doesNotMatch(rule, /\\\\n/);
assert.match(rule, /jurisdictionMatches/);
assert.match(rules, /TEMPORARY_DURATION_TOO_SHORT/);
assert.match(rules, /TEMPORARY_DURATION_REVIEW/);
assert.match(rules, /boe\.es/);

console.log("Contract OS core pipeline tests: OK");
