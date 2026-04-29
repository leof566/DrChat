const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  score: { ok: 0, total: 0 },
  currentQuiz: null,
  installPrompt: null,
};

const messages = $("#messages");
const notesInput = $("#notesInput");

init();

function init() {
  registerServiceWorker();
  wireNavigation();
  wireChat();
  wireQuickButtons();
  wireNotes();
  renderModules();
  nextQuestion();
  greet();
  wireInstall();
}

function greet() {
  addMessage("bot", "Hola, soy **Dr Chat**. Estoy armado para ayudarte a estudiar terminología médica, administración en salud, obras sociales y atención al paciente.\n\nPuedo responder simple, tomarte preguntas trampa y armar mini evaluaciones. Recordá: soy educativo, no reemplazo a un profesional de salud.");
}

function wireNavigation() {
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      $$(".nav-btn").forEach((b) => b.classList.toggle("active", b === btn));
      $$(".view").forEach((section) => section.classList.remove("active"));
      $(`#view-${view}`).classList.add("active");
    });
  });
}

function wireChat() {
  $("#chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#questionInput");
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    addMessage("user", question);
    await answerQuestion(question, $("#modeSelect").value);
  });
}

function wireQuickButtons() {
  $$("[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const prompt = btn.dataset.prompt;
      addMessage("user", prompt);
      await answerQuestion(prompt, "estudio");
    });
  });
}

function wireNotes() {
  notesInput.value = localStorage.getItem("drchat_notes") || "";
  $("#saveNotesBtn").addEventListener("click", () => {
    localStorage.setItem("drchat_notes", notesInput.value.trim());
    toastBot("Apuntes guardados en este celular/navegador.");
  });
  $("#resetExamBtn").addEventListener("click", () => {
    state.score = { ok: 0, total: 0 };
    nextQuestion();
    updateScore();
  });
}

async function answerQuestion(question, mode) {
  const thinkingId = addMessage("bot", "Buscando la mejor explicación...", true);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        mode,
        notes: localStorage.getItem("drchat_notes") || "",
        localKnowledge: window.DRCHAT_KNOWLEDGE,
      }),
    });

    if (!res.ok) throw new Error("Backend no disponible");
    const data = await res.json();
    replaceMessage(thinkingId, data.answer || "No pude generar respuesta.");
  } catch (err) {
    const fallback = localAnswer(question, mode);
    replaceMessage(thinkingId, fallback + "\n\n_Nota: estoy usando la base local porque el backend con IA/internet todavía no está conectado._");
  }
}

function localAnswer(question, mode = "simple") {
  const q = normalize(question);
  const notes = localStorage.getItem("drchat_notes") || "";
  const scored = window.DRCHAT_KNOWLEDGE
    .map((item) => ({
      item,
      score: item.keywords.reduce((acc, kw) => acc + (q.includes(normalize(kw)) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.score > 0 ? scored[0].item : null;

  if (q.includes("pregunta") || q.includes("trampa") || q.includes("examen")) {
    const sample = getRandomQuiz();
    return `**Pregunta de práctica:**\n${sample.q}\n\nA) ${sample.options[0]}\nB) ${sample.options[1] || "—"}${sample.options[2] ? `\nC) ${sample.options[2]}` : ""}\n\nRespondé con la opción y después te explico.`;
  }

  if (!best) {
    return "No encontré ese tema exacto en la base local. Probá preguntarlo con una palabra clave como: tiroides, hipófisis, tráquea, odontología, obra social, PMO, ecografía, cardiología o columna. Cuando conectes el backend, Dr Chat también podrá verificar en internet y tus PDFs completos.";
  }

  const terms = best.terms.map((t) => `• ${t}`).join("\n");
  const sourceHint = "Base local: libro de Terminología Médica cargado + resumen inicial del curso.";

  if (mode === "examen") {
    const quiz = getRandomQuiz(best.keywords);
    return `**Tema detectado:** ${best.title}\n\n**Pregunta:** ${quiz.q}\n\n${quiz.options.map((op, i) => `${String.fromCharCode(65 + i)}) ${op}`).join("\n")}\n\nCuando respondas, te corrijo.`;
  }

  if (mode === "estudio" || mode === "internet") {
    return `**${best.title}**\n\n${best.summary}\n\n**Palabras clave para estudiar:**\n${terms}\n\n**Ejemplo simple:** Si en recepción aparece este término en una orden o consulta, tu tarea no es diagnosticar, sino entender la palabra, cargar bien los datos y derivar correctamente según el protocolo.\n\n**Para recordar:** explicalo con tus palabras en una frase corta.\n\n${sourceHint}`;
  }

  return `**${best.title}:** ${best.summary}\n\n**Idea fácil:** ${best.terms.slice(0, 3).join(" · ")}\n\n${sourceHint}`;
}

function renderModules() {
  const container = $("#moduleList");
  container.innerHTML = "";
  window.DRCHAT_KNOWLEDGE.filter((m) => m.id !== "seguridad").forEach((module) => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <h3>${escapeHtml(module.title)}</h3>
      <p>${escapeHtml(module.summary)}</p>
      <div class="chips">${module.terms.slice(0, 6).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
    `;
    card.addEventListener("click", () => {
      $(`[data-view="chat"]`).click();
      addMessage("user", `Explicame ${module.title} de forma simple`);
      answerQuestion(`Explicame ${module.title} de forma simple`, "estudio");
    });
    container.appendChild(card);
  });
}

function nextQuestion() {
  const quiz = getRandomQuiz();
  state.currentQuiz = quiz;
  const card = $("#quizCard");
  card.innerHTML = `
    <h3>${escapeHtml(quiz.q)}</h3>
    <div class="answers">
      ${quiz.options.map((op, i) => `<button class="answer-btn" data-index="${i}" type="button">${String.fromCharCode(65 + i)}) ${escapeHtml(op)}</button>`).join("")}
    </div>
    <div class="explain" id="quizExplain"></div>
  `;
  $$(".answer-btn").forEach((btn) => btn.addEventListener("click", handleAnswer));
}

function handleAnswer(event) {
  const selected = Number(event.currentTarget.dataset.index);
  const quiz = state.currentQuiz;
  const correct = selected === quiz.answer;
  state.score.total += 1;
  if (correct) state.score.ok += 1;
  $$(".answer-btn").forEach((btn) => {
    btn.disabled = true;
    const idx = Number(btn.dataset.index);
    if (idx === quiz.answer) btn.classList.add("correct");
    if (idx === selected && !correct) btn.classList.add("wrong");
  });
  $("#quizExplain").innerHTML = `<strong>${correct ? "Correcto." : "Incorrecto."}</strong> ${escapeHtml(quiz.explain)}<br><br><button class="primary-btn" type="button" id="nextQuizBtn">Siguiente</button>`;
  $("#nextQuizBtn").addEventListener("click", nextQuestion);
  updateScore();
}

function updateScore() {
  $("#scoreBadge").textContent = `Puntaje: ${state.score.ok}/${state.score.total}`;
}

function getRandomQuiz() {
  const items = window.DRCHAT_QUIZ;
  return items[Math.floor(Math.random() * items.length)];
}

function addMessage(role, content, returnId = false) {
  const id = `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const el = document.createElement("div");
  el.id = id;
  el.className = `message ${role}`;
  el.innerHTML = `<span class="tag">${role === "user" ? "Vos" : "Dr Chat"}</span>${formatMarkdown(content)}`;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  return returnId ? id : undefined;
}

function replaceMessage(id, content) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<span class="tag">Dr Chat</span>${formatMarkdown(content)}`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function toastBot(text) {
  addMessage("bot", text);
}

function formatMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

function normalize(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

function wireInstall() {
  const btn = $("#installBtn");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    btn.classList.remove("hidden");
  });
  btn.addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    btn.classList.add("hidden");
  });
}
