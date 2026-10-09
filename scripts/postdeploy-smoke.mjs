const configured = process.env.SITE_URL;
if (!configured) throw new Error("SITE_URL is required.");
const base = new URL(configured);
if (base.protocol !== "https:") throw new Error("Pages URL must use HTTPS.");
if (!base.pathname.endsWith("/")) base.pathname += "/";

const required = [
  "", "verify.html", "config.js", "manifest.webmanifest",
  "styles/world-ui.css", "app/main.js", "app/schema.js", "app/engine.js",
  "app/ui.js", "app/contract-preview.js", "app/verify.js",
  "vendor/qrcode.min.js", "sw.js"
];

async function fetchWithRetry(path) {
  const url = new URL(path || "./", base);
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, { cache: "no-store", redirect: "follow" });
      if (!response.ok) throw new Error(path + ": HTTP " + response.status);
      const body = await response.text();
      if (!body.length) throw new Error(path + ": empty response");
      const versionMarker = 'name="application-version" content="5.2.1"';
      if (path === "" && !body.includes(versionMarker)) {
        throw new Error("The deployed homepage does not advertise version 5.2.1.");
      }
      if (path === "verify.html" && !body.includes("app/verify.js")) {
        throw new Error("Verification route does not load the verification module.");
      }
      if (path === "app/contract-preview.js" && !body.includes("renderContractDraft")) {
        throw new Error("Contract preview module does not contain its exported renderer.");
      }
      return { path: path || "/", status: response.status, bytes: body.length, url: url.href };
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

const results = [];
for (const path of required) results.push(await fetchWithRetry(path));
for (const result of results) {
  process.stdout.write("OK " + result.status + " " + result.path + " (" + result.bytes + " bytes)\n");
}
process.stdout.write("Post-deploy Pages smoke test passed: " + results.length + " routes/assets checked.\n");
