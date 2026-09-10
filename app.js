// Hash routing: #/ splash, #/learn list, #/pattern/<id> detail, #/test quiz.
const app = document.getElementById("app");

const byId = {};
PATTERN_CATEGORIES.forEach((c) => c.patterns.forEach((p) => (byId[p.id] = p)));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function darkMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

mermaid.initialize({
  startOnLoad: false,
  theme: darkMode() ? "dark" : "default",
  securityLevel: "strict",
});

function splashView() {
  return `
    <div class="splash">
      <h1>@lancedolan's system design toolbelt</h1>
      <div class="ctas">
        <a class="cta" href="#/learn">learn</a>
        <a class="cta" href="#/test">test</a>
      </div>
    </div>`;
}

function learnView() {
  const groups = PATTERN_CATEGORIES.map(
    (c) => `
      <h2 class="category">${esc(c.category)}</h2>
      <ul class="patterns">
        ${c.patterns
          .map(
            (p) => `
          <li>
            <a href="#/pattern/${p.id}">
              <div class="pattern-name">${esc(p.name)}</div>
              <div class="pattern-trigger">${esc(p.trigger)}</div>
            </a>
          </li>`
          )
          .join("")}
      </ul>`
  ).join("");
  return `<a class="back" href="#/">&larr; back</a>${groups}`;
}

function detailView(pattern) {
  return `
    <a class="back" href="#/learn">&larr; all patterns</a>
    <div class="detail">
      <h1>${esc(pattern.name)}</h1>
      <h3>When to use</h3>
      <p>${esc(pattern.trigger)}</p>
      <h3>How to implement</h3>
      <p>${esc(pattern.implementation)}</p>
      <div class="diagram" id="diagram"></div>
    </div>`;
}

async function drawDiagram(id) {
  const target = document.getElementById("diagram");
  const source = DIAGRAMS[id];
  if (!target) return;
  if (!source) {
    target.innerHTML = `<p class="diagram-error">No diagram yet.</p>`;
    return;
  }
  try {
    const { svg } = await mermaid.render("mermaid-" + id, source);
    target.innerHTML = svg;
  } catch (e) {
    target.innerHTML = `<p class="diagram-error">Diagram failed to draw.</p>`;
  }
}

/* ---------- test page ---------- */

const SOLVED_KEY = "toolbelt-solved";

function loadSolved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOLVED_KEY));
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    return new Set();
  }
}

function saveSolved() {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved]));
  } catch (e) {
    /* storage blocked: progress just does not stick */
  }
}

const solved = loadSolved();

// pattern id -> index into PATTERN_CATEGORIES
const categoryOf = {};
PATTERN_CATEGORIES.forEach((c, i) =>
  c.patterns.forEach((p) => (categoryOf[p.id] = i))
);

const testState = { category: "all", scenario: null, wrong: new Set(), solved: false };

function inCategory(scenario) {
  if (testState.category === "all") return true;
  const want = Number(testState.category);
  return scenario.answers.some((id) => categoryOf[id] === want);
}

function categoryName() {
  return testState.category === "all"
    ? null
    : PATTERN_CATEGORIES[Number(testState.category)].category;
}

function pickScenario() {
  const pool = SCENARIOS.filter((s) => inCategory(s) && !solved.has(s.id));
  testState.scenario = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : null;
  testState.wrong = new Set();
  testState.solved = false;
}

function clearScenario() {
  testState.scenario = null;
  testState.wrong = new Set();
  testState.solved = false;
}

function testBar() {
  const inFilter = SCENARIOS.filter(inCategory);
  const done = inFilter.filter((s) => solved.has(s.id)).length;
  const options = [
    `<option value="all"${testState.category === "all" ? " selected" : ""}>all categories</option>`,
    ...PATTERN_CATEGORIES.map(
      (c, i) =>
        `<option value="${i}"${String(i) === String(testState.category) ? " selected" : ""}>${esc(c.category)}</option>`
    ),
  ].join("");
  return `
    <div class="test-bar">
      <select id="category">${options}</select>
      <span class="count">${done} of ${inFilter.length} solved</span>
      <a class="reset" href="#/test" data-reset>reset progress</a>
    </div>`;
}

function choices() {
  return PATTERN_CATEGORIES.map((c, i) => {
    if (testState.category !== "all" && String(i) !== String(testState.category))
      return "";
    const buttons = c.patterns
      .map((p) => {
        let cls = "choice";
        if (testState.wrong.has(p.id)) cls += " wrong";
        if (testState.solved && testState.scenario.answers.includes(p.id))
          cls += " correct";
        const off = testState.solved || testState.wrong.has(p.id) ? " disabled" : "";
        return `<button class="${cls}" data-pick="${p.id}"${off}>${esc(p.name)}</button>`;
      })
      .join("");
    return `<h2 class="category">${esc(c.category)}</h2><div class="choices">${buttons}</div>`;
  }).join("");
}

function allDoneView() {
  const name = categoryName();
  const what = name
    ? `every ${esc(name)} scenario`
    : `all ${SCENARIOS.length} scenarios`;
  return `
    <div class="all-done">
      <div class="party">🎉</div>
      <h1>You solved ${what}!</h1>
      <p>Nothing left in this pool. Pick another category, or reset your progress to run through them again.</p>
    </div>`;
}

function testView() {
  const body = testState.scenario
    ? `
      <div class="test-grid">
        <div class="scenario">
          <p>${esc(testState.scenario.text)}</p>
          ${
            testState.solved
              ? `<div class="success">
                   <p>Correct. That is the one to reach for. 🎉</p>
                   <button class="cta" data-next>next scenario</button>
                 </div>`
              : ""
          }
        </div>
        <div class="picks">${choices()}</div>
      </div>`
    : allDoneView();
  return `<a class="back" href="#/">&larr; back</a>${testBar()}${body}`;
}

function renderTest() {
  if (!testState.scenario && !testState.solved) pickScenario();
  app.innerHTML = testView();
}

function pick(id) {
  if (testState.solved || !testState.scenario) return;
  if (testState.scenario.answers.includes(id)) {
    testState.solved = true;
    solved.add(testState.scenario.id);
    saveSolved();
  } else {
    testState.wrong.add(id);
  }
  app.innerHTML = testView();
}

app.addEventListener("click", (e) => {
  const choice = e.target.closest("[data-pick]");
  if (choice) {
    pick(choice.dataset.pick);
    return;
  }
  if (e.target.closest("[data-next]")) {
    clearScenario();
    renderTest();
    window.scrollTo(0, 0);
    return;
  }
  const reset = e.target.closest("[data-reset]");
  if (reset) {
    e.preventDefault();
    solved.clear();
    saveSolved();
    clearScenario();
    renderTest();
    window.scrollTo(0, 0);
  }
});

app.addEventListener("change", (e) => {
  if (e.target.id !== "category") return;
  testState.category = e.target.value;
  clearScenario();
  renderTest();
});

function render() {
  const hash = location.hash.replace(/^#/, "");
  const patternMatch = hash.match(/^\/pattern\/([a-z0-9-]+)$/);

  app.classList.toggle("wide", hash === "/test");

  if (hash === "/learn") {
    app.innerHTML = learnView();
  } else if (hash === "/test") {
    renderTest();
  } else if (patternMatch && byId[patternMatch[1]]) {
    const id = patternMatch[1];
    app.innerHTML = detailView(byId[id]);
    drawDiagram(id);
  } else {
    app.innerHTML = splashView();
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", () => {
  // The category filter is not in the address, so arriving at #/test resets it.
  if (location.hash === "#/test") testState.category = "all";
  render();
});
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode() ? "dark" : "default",
      securityLevel: "strict",
    });
    render();
  });
render();
