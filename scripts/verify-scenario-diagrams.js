// Draws every quiz scenario diagram in a headless browser and fails on any that break, since the app hides draw errors.
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");
const repo = fs.realpathSync(path.join(__dirname, ".."));
const port = 8765;
const base = `http://127.0.0.1:${port}`;
const batches = process.argv.slice(2).map((f) => path.relative(repo, fs.realpathSync(path.resolve(f))));
if (batches.some((f) => f.startsWith(".."))) throw new Error("batch files must be inside " + repo);
const name = `verify-${process.pid}.html`;
const page = path.join(repo, name);
const tags = ["lib/mermaid.min.js", "data.js", "scenarios.js", "scenario-diagrams.js"]
  .concat(`<script>window.BATCH_BEFORE = {}; window.BATCH_SOLVED = {};</script>`)
  .map((f) => (f.startsWith("<") ? f : `<script src="${f}"></script>`))
  .concat(batches.map((f) => `<script src="${f}?${Date.now()}"></script>`))
  .join("\n");
fs.writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"></head><body>${tags}
<script>
window.check = async () => {
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
  const useBatch = ${batches.length > 0};
  const before = useBatch ? BATCH_BEFORE : SCENARIO_DIAGRAMS;
  const solved = useBatch ? BATCH_SOLVED : SOLVED_SCENARIO_DIAGRAMS;
  const ids = new Set(SCENARIOS.map((s) => s.id));
  const errors = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(solved)]);
  let n = 0;
  for (const id of keys) {
    if (!ids.has(id)) errors.push(id + ": no scenario with this id");
    if (!before[id]) errors.push(id + ": missing before diagram");
    if (!solved[id]) errors.push(id + ": missing solved diagram");
    if (before[id] && before[id] === solved[id]) errors.push(id + ": solved is identical to before");
    if (useBatch && SCENARIO_DIAGRAMS[id]) errors.push(id + ": already in SCENARIO_DIAGRAMS");
    for (const [kind, src] of [["before", before[id]], ["solved", solved[id]]]) {
      if (!src) continue;
      n++;
      try {
        await mermaid.render("m" + n, src);
      } catch (e) {
        errors.push(id + " " + kind + ": " + String(e.message || e).split("\\n").slice(0, 3).join(" | "));
      }
      document.querySelectorAll("[id^=dm]").forEach((el) => el.remove());
    }
  }
  return JSON.stringify({ rendered: n, ids: keys.size, errors });
};
</script></body></html>`);

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: repo,
  stdio: "ignore",
});
const session = "-s=verify" + process.pid;
const run = (...a) => execFileSync("playwright-cli", [session, ...a], { encoding: "utf8" });
let failed = true;
try {
  // Wait for the server to accept connections before opening the page.
  for (let i = 0; i < 50; i++) {
    try {
      execFileSync("curl", ["-sf", "-o", "/dev/null", `${base}/${name}`]);
      break;
    } catch (e) {
      execFileSync("sleep", ["0.1"]);
    }
  }
  run("open", `${base}/${name}`);
  const out = run("eval", "() => window.check()");
  const m = out.match(/### Result\s*\n(".*")/);
  if (!m) {
    console.log(out);
  } else {
    const result = JSON.parse(JSON.parse(m[1]));
    console.log(JSON.stringify(result, null, 2));
    failed = result.errors.length > 0;
  }
} catch (e) {
  console.log(e.stdout || e.message);
} finally {
  try { run("close"); } catch (e) {}
  server.kill();
  fs.unlinkSync(page);
  process.exitCode = failed ? 1 : 0;
}
