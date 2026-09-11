// Hash routing: #/ splash, #/learn list, #/pattern/<id> detail, #/quiz quiz page.
const app = document.getElementById("app");

const byId = {};
PATTERN_CATEGORIES.forEach((c) => c.patterns.forEach((p) => (byId[p.id] = p)));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function darkMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// useMaxWidth off keeps a diagram at its natural size instead of stretching a
// small one across the column; .diagram shrinks anything too wide to fit.
const mermaidConfig = () => ({
  startOnLoad: false,
  theme: darkMode() ? "dark" : "default",
  securityLevel: "strict",
  flowchart: { useMaxWidth: false },
  sequence: { useMaxWidth: false },
});

mermaid.initialize(mermaidConfig());

function splashView() {
  return `
    <div class="splash">
      <h1>@lancedolan's system design toolbelt</h1>
      <div class="ctas">
        <a class="cta" href="#/learn">learn</a>
        <a class="cta" href="#/quiz">quiz</a>
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

// Mermaid needs a unique id per render or leftover nodes from an earlier draw
// collide with the new one.
let drawCount = 0;

async function draw(target, source, onError) {
  if (!target || !source) return;
  try {
    const { svg } = await mermaid.render("mermaid-" + drawCount++, source);
    target.innerHTML = svg;
  } catch (e) {
    target.innerHTML = onError;
  }
}

function drawDiagram(id) {
  const target = document.getElementById("diagram");
  if (!target) return;
  if (!DIAGRAMS[id]) {
    target.innerHTML = `<p class="diagram-error">No diagram yet.</p>`;
    return;
  }
  draw(target, DIAGRAMS[id], `<p class="diagram-error">Diagram failed to draw.</p>`);
}

// A scenario with no diagram just shows its text, so a failed draw removes the
// empty box rather than announcing itself.
function drawScenarioDiagram() {
  const target = document.getElementById("scenario-diagram");
  if (!target || !quizState.scenario) return;
  draw(target, SCENARIO_DIAGRAMS[quizState.scenario.id], "");
}

/* ---------- quiz page ---------- */

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

// An empty `categories` set means every category is in play.
const quizState = {
  categories: new Set(),
  scenario: null,
  wrong: new Set(),
  solved: false,
};

function showCategory(i) {
  return quizState.categories.size === 0 || quizState.categories.has(i);
}

function inCategory(scenario) {
  if (quizState.categories.size === 0) return true;
  return scenario.answers.some((id) => quizState.categories.has(categoryOf[id]));
}

function categoryName() {
  if (quizState.categories.size !== 1) return null;
  const [only] = quizState.categories;
  return PATTERN_CATEGORIES[only].category;
}

function pickScenario() {
  const pool = SCENARIOS.filter((s) => inCategory(s) && !solved.has(s.id));
  quizState.scenario = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : null;
  quizState.wrong = new Set();
  quizState.solved = false;
}

function clearScenario() {
  quizState.scenario = null;
  quizState.wrong = new Set();
  quizState.solved = false;
}

function quizBar() {
  const inFilter = SCENARIOS.filter(inCategory);
  const done = inFilter.filter((s) => solved.has(s.id)).length;
  const all = quizState.categories.size === 0;
  const chips = [
    `<button class="chip${all ? " on" : ""}" data-cat="all" aria-pressed="${all}">all categories</button>`,
    ...PATTERN_CATEGORIES.map((c, i) => {
      const on = quizState.categories.has(i);
      return `<button class="chip${on ? " on" : ""}" data-cat="${i}" aria-pressed="${on}">${esc(c.category)}</button>`;
    }),
  ].join("");
  return `
    <div class="quiz-bar">
      <div class="filters" role="group" aria-label="filter scenarios by category">${chips}</div>
      <span class="count">${done} of ${inFilter.length} solved</span>
      <span class="meter" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${inFilter.length}" aria-label="scenarios solved"><span class="meter-fill" style="width: ${inFilter.length ? (done / inFilter.length) * 100 : 0}%"></span></span>
      <a class="reset" href="#/quiz" data-reset>reset progress</a>
    </div>`;
}

function choices() {
  return PATTERN_CATEGORIES.map((c, i) => {
    if (!showCategory(i)) return "";
    const buttons = c.patterns
      .map((p) => {
        let cls = "choice";
        if (quizState.wrong.has(p.id)) cls += " wrong";
        if (quizState.solved && quizState.scenario.answers.includes(p.id))
          cls += " correct";
        const off = quizState.solved || quizState.wrong.has(p.id) ? " disabled" : "";
        return `<button class="${cls}" data-pick="${p.id}"${off}>${esc(p.name)}</button>`;
      })
      .join("");
    return `<h2 class="category">${esc(c.category)}</h2><div class="choices">${buttons}</div>`;
  }).join("");
}

function allDoneView() {
  const name = categoryName();
  const picked = quizState.categories.size;
  const what = name
    ? `every ${esc(name)} scenario`
    : picked
      ? `every scenario in the ${picked} categories you picked`
      : `all ${SCENARIOS.length} scenarios`;
  return `
    <div class="all-done">
      <div class="party">🎉</div>
      <h1>You solved ${what}!</h1>
      <p>Nothing left in this pool. Pick another category, or reset your progress to run through them again.</p>
    </div>`;
}

function quizView() {
  const body = quizState.scenario
    ? `
      <div class="quiz-grid">
        <div class="scenario">
          <h1 class="col-title">Your scenario...🤔</h1>
          <p>${esc(quizState.scenario.text)}</p>
          ${
            SCENARIO_DIAGRAMS[quizState.scenario.id]
              ? `<div class="diagram scenario-diagram" id="scenario-diagram" title="tap to enlarge"></div>`
              : ""
          }
          ${
            quizState.solved
              ? `<div class="success">
                   <p>Correct. That is the one to reach for. 🎉</p>
                   <button class="cta" data-next>next scenario</button>
                 </div>`
              : ""
          }
        </div>
        <div class="picks"><h1 class="col-title">You reach for...🔨</h1>${choices()}</div>
      </div>`
    : allDoneView();
  return `<a class="back" href="#/">&larr; back</a>${quizBar()}${body}`;
}

function paintQuiz() {
  app.innerHTML = quizView();
  drawScenarioDiagram();
}

function renderQuiz() {
  if (!quizState.scenario && !quizState.solved) pickScenario();
  paintQuiz();
}

function pick(id) {
  if (quizState.solved || !quizState.scenario) return;
  if (quizState.scenario.answers.includes(id)) {
    quizState.solved = true;
    solved.add(quizState.scenario.id);
    saveSolved();
  } else {
    quizState.wrong.add(id);
  }
  paintQuiz();
}

// Tapping the scenario diagram opens a copy of it full screen, since on a phone
// it is drawn too small to read in the column.
app.addEventListener("click", (e) => {
  const diagram = e.target.closest(".scenario-diagram");
  if (diagram && diagram.innerHTML) {
    const zoom = document.createElement("div");
    zoom.className = "zoom";
    zoom.innerHTML = diagram.innerHTML;
    zoom.addEventListener("click", () => zoom.remove());
    document.body.appendChild(zoom);
    return;
  }
  const choice = e.target.closest("[data-pick]");
  if (choice) {
    pick(choice.dataset.pick);
    return;
  }
  if (e.target.closest("[data-next]")) {
    clearScenario();
    renderQuiz();
    window.scrollTo(0, 0);
    return;
  }
  const chip = e.target.closest("[data-cat]");
  if (chip) {
    const value = chip.dataset.cat;
    if (value === "all") {
      quizState.categories.clear();
    } else {
      const i = Number(value);
      if (quizState.categories.has(i)) quizState.categories.delete(i);
      else quizState.categories.add(i);
    }
    clearScenario();
    renderQuiz();
    const again = app.querySelector(`[data-cat="${value}"]`);
    if (again) again.focus();
    return;
  }
  const reset = e.target.closest("[data-reset]");
  if (reset) {
    e.preventDefault();
    solved.clear();
    saveSolved();
    clearScenario();
    renderQuiz();
    window.scrollTo(0, 0);
  }
});

function render() {
  const hash = location.hash.replace(/^#/, "");
  const patternMatch = hash.match(/^\/pattern\/([a-z0-9-]+)$/);

  app.classList.toggle("wide", hash === "/quiz");

  if (hash === "/learn") {
    app.innerHTML = learnView();
  } else if (hash === "/quiz") {
    renderQuiz();
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
  // The category filter is not in the address, so arriving at #/quiz resets it.
  if (location.hash === "#/quiz") quizState.categories.clear();
  render();
});
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    mermaid.initialize(mermaidConfig());
    render();
  });
render();
