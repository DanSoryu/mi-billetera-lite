const STORAGE_KEY = "mi-billetera-lite-gastos-v1";
const CATEGORIES = new Set(["Comida", "Transporte", "Servicios", "Ocio", "Otros"]);
const CATEGORY_ICONS = { Comida: "☕", Transporte: "↗", Servicios: "▦", Ocio: "☆", Otros: "•" };
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const form = document.querySelector("#expense-form");
const list = document.querySelector("#expense-list");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#form-message");

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((item) =>
          item && typeof item.concept === "string" &&
          Number.isSafeInteger(item.amountCents) && item.amountCents > 0 &&
          CATEGORIES.has(item.category) && !Number.isNaN(Date.parse(item.createdAt))
        ).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

let expenses = loadExpenses();

function render() {
  const count = expenses.length;
  const totalCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  document.querySelector("#total").textContent = money.format(totalCents / 100);
  document.querySelector("#expense-count").textContent = `${count} ${count === 1 ? "gasto" : "gastos"}`;
  document.querySelector("#history-count").textContent = `${count} ${count === 1 ? "registro" : "registros"}`;
  emptyState.hidden = count > 0;
  list.hidden = count === 0;
  list.replaceChildren();

  for (const expense of expenses) {
    const item = document.createElement("li");
    const info = document.createElement("div");
    const mark = document.createElement("span");
    const copy = document.createElement("div");
    const concept = document.createElement("strong");
    const detail = document.createElement("small");
    const category = document.createElement("span");
    const amount = document.createElement("span");

    info.className = "expense-info";
    mark.className = "category-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = CATEGORY_ICONS[expense.category];
    concept.textContent = expense.concept;
    category.className = "category-pill";
    category.textContent = expense.category;
    detail.append(category, " · " + dateTime.format(new Date(expense.createdAt)));
    amount.className = "expense-amount";
    amount.textContent = money.format(expense.amountCents / 100);
    copy.append(concept, detail);
    info.append(mark, copy);
    item.append(info, amount);
    list.append(item);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const concept = form.elements.concept.value.trim();
  const amount = Number(form.elements.amount.value);
  const amountCents = Math.round(amount * 100);
  const category = form.elements.category.value;

  if (!concept || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !CATEGORIES.has(category)) {
    message.textContent = "Revisa el concepto, el monto y la categoría.";
    return;
  }

  const nextExpenses = [{ concept, amountCents, category, createdAt: new Date().toISOString() }, ...expenses];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextExpenses));
  } catch {
    message.textContent = "No se pudo guardar. Revisa el almacenamiento del navegador.";
    return;
  }

  expenses = nextExpenses;
  render();
  form.reset();
  form.elements.concept.focus();
  message.textContent = "Gasto guardado en este dispositivo.";
});

function updateConnectionStatus() {
  const status = document.querySelector("#connection-status");
  status.textContent = navigator.onLine ? "En línea" : "Sin conexión";
  status.classList.toggle("offline", !navigator.onLine);
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("No se pudo registrar el Service Worker:", error);
    });
  });
}
