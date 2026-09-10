// Hash routing: #/ splash, #/learn list, #/pattern/<id> detail.
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
        <button class="cta" disabled>test</button>
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

function render() {
  const hash = location.hash.replace(/^#/, "");
  const patternMatch = hash.match(/^\/pattern\/([a-z0-9-]+)$/);

  if (hash === "/learn") {
    app.innerHTML = learnView();
  } else if (patternMatch && byId[patternMatch[1]]) {
    const id = patternMatch[1];
    app.innerHTML = detailView(byId[id]);
    drawDiagram(id);
  } else {
    app.innerHTML = splashView();
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
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
