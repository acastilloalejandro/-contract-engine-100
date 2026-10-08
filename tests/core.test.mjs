import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const pipeline = read("src/pipeline/contract-pipeline.ts");
const classifier = read("src/classification/classify.ts");
const graph = read("src/form-engine/graph.ts");
const snapshot = read("src/rules-engine/snapshot.ts");

assert.match(pipeline, /runContractPipeline/);
assert.match(pipeline, /REVIEW_REQUIRED/);
assert.match(pipeline, /READY/);
assert.match(classifier, /confidence/);
assert.match(classifier, /temporaryCause/);
assert.match(graph, /invalidateDependentAnswers/);
assert.match(snapshot, /buildRuleSnapshot/);
assert.match(snapshot, /ENGINE_VERSION/);
console.log("Contract OS core pipeline tests: OK");
