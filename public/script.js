const scrollBtn = document.getElementById("scrollToForm");
const form = document.getElementById("requestForm");
const table = document.getElementById("requestsTable");
const ahoTable = document.getElementById("ahoRequestsTable");
const messageBox = document.getElementById("formMessage");

const authOverlay = document.getElementById("authOverlay");
const mainPage = document.getElementById("mainPage");
const currentUserName = document.getElementById("currentUserName");
const logoutBtn = document.getElementById("logoutBtn");

const loginTabBtn = document.getElementById("loginTabBtn");
const registerTabBtn = document.getElementById("registerTabBtn");
const loginBlock = document.getElementById("loginBlock");
const registerBlock = document.getElementById("registerBlock");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const feedbackForm = document.getElementById("feedbackForm");
const feedbackMessage = document.getElementById("feedbackMessage");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const printReportBtn = document.getElementById("printReportBtn");
const exportServicesCsvBtn = document.getElementById("exportServicesCsvBtn");
const requestSearchInput = document.getElementById("requestSearchInput");
const requestStatusFilter = document.getElementById("requestStatusFilter");
const analyticsStatusFilter = document.getElementById("analyticsStatusFilter");
const feedbackTable = document.getElementById("feedbackTable");
const totalFeedback = document.getElementById("totalFeedback");
const todayFeedback = document.getElementById("todayFeedback");
const feedbackChart = document.getElementById("feedbackChart");
const requestsChart = document.getElementById("requestsChart");

const requestFileInput = document.getElementById("requestFile");
const fileNameText = document.getElementById("fileNameText");

const API_URL = "https://ahocit.onrender.com";

let allRequests = [];
let allFeedback = [];

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser")) || null;
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

function switchToLogin() {
  loginTabBtn.classList.add("active");
  registerTabBtn.classList.remove("active");
  loginBlock.classList.remove("hidden");
  registerBlock.classList.add("hidden");
  loginMessage.textContent = "";
  registerMessage.textContent = "";
}

function switchToRegister() {
  registerTabBtn.classList.add("active");
  loginTabBtn.classList.remove("active");
  registerBlock.classList.remove("hidden");
  loginBlock.classList.add("hidden");
  loginMessage.textContent = "";
  registerMessage.textContent = "";
}

function getStatusClass(status) {
  if (status === "В работе") return "status-work";
  if (status === "Выполнено") return "status-done";
  if (status === "Отклонено") return "status-cancel";
  return "status-new";
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ru-RU");
}

function showRoleInterface(user) {
  const employeeSections = document.querySelectorAll(".employee-section");
  const ahoSections = document.querySelectorAll(".aho-section");
  const employeeLinks = document.querySelectorAll(".employee-link");
  const ahoLinks = document.querySelectorAll(".aho-link");
  const employeeActions = document.querySelectorAll(".employee-action");
  const feedbackSection = document.getElementById("feedback");

  if (user.role === "aho") {
    employeeSections.forEach((item) => item.classList.add("hidden"));
    employeeLinks.forEach((item) => item.classList.add("hidden"));
    employeeActions.forEach((item) => item.classList.add("hidden"));
    ahoSections.forEach((item) => item.classList.remove("hidden"));
    ahoLinks.forEach((item) => item.classList.remove("hidden"));

    if (feedbackSection) {
      feedbackSection.classList.add("hidden");
    }
  } else {
    employeeSections.forEach((item) => item.classList.remove("hidden"));
    employeeLinks.forEach((item) => item.classList.remove("hidden"));
    employeeActions.forEach((item) => item.classList.remove("hidden"));
    ahoSections.forEach((item) => item.classList.add("hidden"));
    ahoLinks.forEach((item) => item.classList.add("hidden"));

    if (feedbackSection) {
      feedbackSection.classList.remove("hidden");
    }
  }
}

function openSite() {
  const user = getCurrentUser();

  if (!user) {
    authOverlay.classList.remove("hidden");
    mainPage.classList.add("locked");
    return;
  }

  currentUserName.textContent =
    user.role === "aho" ? `${user.full_name} (АХО)` : user.full_name;

  authOverlay.classList.add("hidden");
  mainPage.classList.remove("locked");

  showRoleInterface(user);
  loadRequests();

  if (user.role === "aho") {
    loadFeedback();
  }
}

async function registerUser() {
  const full_name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  registerMessage.style.color = "#c62828";
  registerMessage.textContent = "";

  if (!full_name || !username || !password) {
    registerMessage.textContent = "Заполните все поля.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name,
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      registerMessage.textContent = data.error || "Ошибка регистрации.";
      return;
    }

    registerMessage.style.color = "green";
    registerMessage.textContent = data.message || "Регистрация успешна.";

    document.getElementById("registerName").value = "";
    document.getElementById("registerUsername").value = "";
    document.getElementById("registerPassword").value = "";

    setTimeout(switchToLogin, 700);
  } catch (error) {
    registerMessage.textContent = "Ошибка сервера.";
  }
}

async function loginUser() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  loginMessage.textContent = "";

  if (!username || !password) {
    loginMessage.textContent = "Введите логин и пароль.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent = data.error || "Ошибка входа.";
      return;
    }

    setCurrentUser(data);
    openSite();
  } catch (error) {
    loginMessage.textContent = "Ошибка сервера.";
  }
}

async function loadRequests() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const response = await fetch(
      `${API_URL}/api/requests?user_id=${user.id}&role=${user.role}`
    );

    const requests = await response.json();

    if (!response.ok) {
      console.error(requests.error || "Ошибка получения заявок.");
      return;
    }

    allRequests = requests;

    renderUserRequests(allRequests, user);
    renderAhoRequests(allRequests, user);
    renderAnalytics(allRequests);
  } catch (error) {
    console.error("Ошибка загрузки заявок:", error);
  }
}

function renderUserRequests(requests, user) {
  if (!table) return;

  table.innerHTML = "";

  if (user.role === "aho") {
    table.innerHTML = `
      <tr>
        <td colspan="9">Для сотрудника АХО заявки отображаются в панели АХО.</td>
      </tr>
    `;
    return;
  }

  if (requests.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="9">Заявки отсутствуют.</td>
      </tr>
    `;
    return;
  }

  requests.forEach((request) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${request.id}</td>
      <td>${request.type}</td>
      <td>${request.office}</td>
      <td>${request.description}</td>
      <td>${request.priority}</td>
      <td>${request.file_name || "—"}</td>
      <td><span class="status ${getStatusClass(request.status)}">${request.status}</span></td>
      <td>${formatDate(request.created_at)}</td>
      <td>${request.aho_comment || "—"}</td>
    `;

    table.appendChild(row);
  });
}

function getFilteredAhoRequests(requests) {
  const search = requestSearchInput ? requestSearchInput.value.trim().toLowerCase() : "";
  const filter = requestStatusFilter ? requestStatusFilter.value : "all";

  return requests.filter((request) => {
    const isDone = request.status === "Выполнено";

    if (filter === "done" && !isDone) return false;
    if (filter === "not_done" && isDone) return false;
    if (filter !== "all" && filter !== "done" && filter !== "not_done" && request.status !== filter) return false;

    if (!search) return true;

    const searchableText = [
      request.id,
      request.user_name,
      request.type,
      request.office,
      request.description,
      request.priority,
      request.status,
      request.file_name,
      request.aho_comment
    ].join(" ").toLowerCase();

    return searchableText.includes(search);
  });
}

function renderAhoRequests(requests, user) {
  if (!ahoTable || user.role !== "aho") return;

  const visibleRequests = getFilteredAhoRequests(requests);

  ahoTable.innerHTML = "";

  if (visibleRequests.length === 0) {
    ahoTable.innerHTML = `
      <tr>
        <td colspan="10">Заявки не найдены.</td>
      </tr>
    `;
    return;
  }

  visibleRequests.forEach((request) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${request.id}</td>
      <td>${request.user_name || "—"}</td>
      <td>${request.type}</td>
      <td>${request.office}</td>
      <td>${request.description}</td>
      <td>${request.priority}</td>
      <td>${request.file_name || "—"}</td>
      <td>
        <select class="admin-status" data-id="${request.id}">
          <option value="Новая" ${request.status === "Новая" ? "selected" : ""}>Новая</option>
          <option value="В работе" ${request.status === "В работе" ? "selected" : ""}>В работе</option>
          <option value="Выполнено" ${request.status === "Выполнено" ? "selected" : ""}>Выполнено</option>
          <option value="Отклонено" ${request.status === "Отклонено" ? "selected" : ""}>Отклонено</option>
        </select>
      </td>
      <td>
        <textarea class="admin-comment" data-id="${request.id}" placeholder="Комментарий">${request.aho_comment || ""}</textarea>
      </td>
      <td>
        <button class="small-btn save-request-btn" data-id="${request.id}" type="button">Сохранить</button>
      </td>
    `;

    ahoTable.appendChild(row);
  });

  document.querySelectorAll(".save-request-btn").forEach((button) => {
    button.addEventListener("click", () => {
      updateRequestByAho(Number(button.dataset.id));
    });
  });
}

function getAnalyticsRequests(requests) {
  const filter = analyticsStatusFilter ? analyticsStatusFilter.value : "all";

  if (filter === "done") {
    return requests.filter((item) => item.status === "Выполнено");
  }

  if (filter === "not_done") {
    return requests.filter((item) => item.status !== "Выполнено");
  }

  return requests;
}

function renderAnalytics(requests) {
  const totalRequests = document.getElementById("totalRequests");
  const newRequests = document.getElementById("newRequests");
  const workRequests = document.getElementById("workRequests");
  const doneRequests = document.getElementById("doneRequests");
  const cancelRequests = document.getElementById("cancelRequests");

  if (!totalRequests) return;

  const analyticsRequests = getAnalyticsRequests(requests);

  totalRequests.textContent = analyticsRequests.length;
  newRequests.textContent = analyticsRequests.filter((item) => item.status === "Новая").length;
  workRequests.textContent = analyticsRequests.filter((item) => item.status === "В работе").length;
  doneRequests.textContent = analyticsRequests.filter((item) => item.status === "Выполнено").length;
  cancelRequests.textContent = analyticsRequests.filter((item) => item.status === "Отклонено").length;

  drawRequestsChart(requests);
}

function drawRequestsChart(requests) {

  if (!requestsChart) return;

  const ctx = requestsChart.getContext("2d");

  const width = requestsChart.width;
  const height = requestsChart.height;

  ctx.clearRect(0, 0, width, height);

  const doneCount = requests.filter(
    (item) => item.status === "Выполнено"
  ).length;

  const notDoneCount = requests.filter(
    (item) => item.status !== "Выполнено"
  ).length;

  const total = Math.max(doneCount + notDoneCount, 1);

  const data = [
    {
      label: "Выполнено",
      value: doneCount,
      color: "#39ae61"
    },
    {
      label: "Не выполнено",
      value: notDoneCount,
      color: "#2f7fd2"
    }
  ];

  const padding = 42;

  const chartWidth = width - padding * 2;

  const maxValue = Math.max(doneCount, notDoneCount, 1);

  const barHeight = 54;

  const startY = 82;

  const gap = 70;

  ctx.font = "16px Segoe UI, Arial";

  ctx.fillStyle = "#324968";

  ctx.fillText(
    "Выполненные и невыполненные заявки",
    padding,
    28
  );

  data.forEach((item, index) => {

    const y = startY + index * (barHeight + gap);

    const barWidth =
      (item.value / maxValue) * chartWidth;

    const percent = Math.round(
      (item.value / total) * 100
    );

    ctx.fillStyle = "#000000";

    ctx.font = "16px Segoe UI";

    ctx.fillText(
      item.label.toLowerCase() + ":",
      padding,
      y - 12
    );

    ctx.fillStyle = "#eef3f8";

    ctx.fillRect(
      padding,
      y,
      chartWidth,
      barHeight
    );

    ctx.fillStyle = item.color;

    ctx.fillRect(
      padding,
      y,
      barWidth,
      barHeight
    );

    ctx.fillStyle = "#000000";

    ctx.font = "700 15px Segoe UI";

    ctx.fillText(
      `${item.value} `,
      8,
      y + 34
    );

    ctx.fillStyle = "#2f3d4f";

    ctx.font = "700 14px Segoe UI, Arial";

    ctx.fillText(
      `${percent}%`,
      padding + chartWidth + 14,
      y + 34
    );

  });

}

async function updateRequestByAho(id) {
  const statusElement = document.querySelector(`.admin-status[data-id="${id}"]`);
  const commentElement = document.querySelector(`.admin-comment[data-id="${id}"]`);

  if (!statusElement || !commentElement) return;

  try {
    const response = await fetch(`${API_URL}/api/requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: statusElement.value,
        aho_comment: commentElement.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Ошибка обновления заявки.");
      return;
    }

    alert(data.message || "Заявка обновлена.");
    loadRequests();
  } catch (error) {
    alert("Ошибка сервера.");
  }
}

async function createRequest(event) {
  event.preventDefault();

  const user = getCurrentUser();

  if (!user) {
    authOverlay.classList.remove("hidden");
    mainPage.classList.add("locked");
    return;
  }

  const type = document.getElementById("requestType").value.trim();
  const department = document.getElementById("department").value.trim();
  const office = document.getElementById("office").value.trim();
  const description = document.getElementById("requestDescription").value.trim();
  const priority = document.getElementById("requestPriority").value.trim();
  const fileInput = document.getElementById("requestFile");

  if (!type || !department || !office || !description || !priority) {
    alert("Заполните все обязательные поля.");
    return;
  }

  if (description.length < 8) {
    alert("Слишком короткое описание проблемы.");
    return;
  }

  const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : null;

  try {
    const response = await fetch(`${API_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        type,
        department,
        office,
        description,
        priority,
        file_name: fileName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Ошибка создания заявки.");
      return;
    }

    messageBox.textContent = data.message || "Заявка успешно создана.";
    form.reset();

    if (fileNameText) {
      fileNameText.textContent = "Файл не выбран";
    }

    loadRequests();
  } catch (error) {
    alert("Ошибка сервера.");
  }
}

async function sendFeedback(event) {
  event.preventDefault();

  const user = getCurrentUser();
  const textArea = document.getElementById("feedbackText");
  const message = textArea.value.trim();

  if (!user) {
    alert("Необходимо войти в систему.");
    return;
  }

  if (!message) {
    feedbackMessage.style.color = "#c62828";
    feedbackMessage.textContent = "Введите сообщение.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      feedbackMessage.style.color = "#c62828";
      feedbackMessage.textContent = data.error || "Ошибка отправки.";
      return;
    }

    feedbackMessage.style.color = "#2c7a45";
    feedbackMessage.textContent = data.message || "Сообщение отправлено.";
    feedbackForm.reset();

    if (user.role === "aho") {
      loadFeedback();
    }
  } catch (error) {
    feedbackMessage.style.color = "#c62828";
    feedbackMessage.textContent = "Ошибка сервера.";
  }
}

async function loadFeedback() {
  try {
    const response = await fetch(`${API_URL}/api/feedback`);
    const feedback = await response.json();

    if (!response.ok) {
      console.error(feedback.error || "Ошибка получения отзывов.");
      return;
    }

    allFeedback = Array.isArray(feedback) ? feedback : [];
    renderFeedback(allFeedback);
  } catch (error) {
    console.error("Ошибка загрузки отзывов:", error);
  }
}

function renderFeedback(feedback) {
  renderFeedbackTable(feedback);
  renderFeedbackSummary(feedback);
  drawFeedbackChart(feedback);
}

function renderFeedbackTable(feedback) {
  if (!feedbackTable) return;

  feedbackTable.innerHTML = "";

  if (feedback.length === 0) {
    feedbackTable.innerHTML = `
      <tr>
        <td colspan="4">Отзывы отсутствуют.</td>
      </tr>
    `;
    return;
  }

  feedback.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.user_name || "—"}</td>
      <td>${item.message}</td>
      <td>${formatDate(item.created_at)}</td>
    `;

    feedbackTable.appendChild(row);
  });
}

function renderFeedbackSummary(feedback) {
  if (!totalFeedback || !todayFeedback) return;

  const today = new Date().toLocaleDateString("ru-RU");

  totalFeedback.textContent = feedback.length;
  todayFeedback.textContent = feedback.filter((item) => formatDate(item.created_at) === today).length;
}

function drawFeedbackChart(feedback) {
  if (!feedbackChart) return;

  const ctx = feedbackChart.getContext("2d");
  const width = feedbackChart.width;
  const height = feedbackChart.height;

  ctx.clearRect(0, 0, width, height);

  const dates = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    dates.push(date.toLocaleDateString("ru-RU"));
  }

  const counts = dates.map((date) => {
    return feedback.filter((item) => formatDate(item.created_at) === date).length;
  });

  const maxCount = Math.max(...counts, 1);
  const paddingLeft = 42;
  const paddingRight = 42;
  const paddingTop = 42;
  const paddingBottom = 42;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barGap = 18;
  const barWidth = (chartWidth - barGap * (dates.length - 1)) / dates.length;

  ctx.font = "12px Segoe UI, Arial";
  ctx.fillStyle = "#52657f";
  ctx.fillText("Диаграмма отзывов за последние 7 дней", paddingLeft, 22);

  dates.forEach((date, index) => {
    const barHeight = (counts[index] / maxCount) * (chartHeight - 35);
    const x = paddingLeft + index * (barWidth + barGap);
    const y = height - paddingBottom - barHeight;

    ctx.fillStyle = "#2f7fd2";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#2f3d4f";
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(counts[index]), x + barWidth / 2, y - 8);

    ctx.fillStyle = "#53657d";
    ctx.font = "12px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(date.slice(0, 5), x + barWidth / 2, height - 14);
  });

  ctx.textAlign = "left";
}

function exportToCsv() {
  const user = getCurrentUser();
  if (!user || user.role !== "aho") return;

  fetch(`${API_URL}/api/requests?user_id=${user.id}&role=${user.role}`)
    .then((response) => response.json())
    .then((requests) => {
      const rows = [
        ["ID", "Сотрудник", "Тип", "Кабинет", "Описание", "Приоритет", "Файл", "Статус", "Дата", "Комментарий АХО"],
        ...requests.map((item) => [
          item.id,
          item.user_name || "",
          item.type,
          item.office,
          item.description,
          item.priority,
          item.file_name || "",
          item.status,
          formatDate(item.created_at),
          item.aho_comment || ""
        ])
      ];

      const csv = rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "zayavki_aho.csv";
      link.click();
    });
}

function exportServicesToCsv() {
  const rows = [
    ["Категория", "Наименование", "Описание"],
    ["Ремонт", "Ремонт мебели", "Устранение неисправностей мебели и элементов кабинета"],
    ["Ремонт", "Ремонт освещения", "Замена ламп и устранение проблем с освещением"],
    ["Уборка", "Заявка на уборку", "Уборка кабинета, переговорной или рабочей зоны"],
    ["Канцтовары", "Бумага офисная", "Выдача бумаги для печати и документов"],
    ["Канцтовары", "Ручки и карандаши", "Выдача базовых канцелярских принадлежностей"],
    ["Хозтовары", "Мыло и салфетки", "Выдача хозяйственных расходных материалов"],
    ["Хозтовары", "Пакеты и чистящие средства", "Выдача товаров для хозяйственных нужд"],
    ["Другое", "Прочее обращение", "Обращение, не входящее в основные категории"]
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "perechen_uslug_aho.csv";
  link.click();
}

loginTabBtn.addEventListener("click", switchToLogin);
registerTabBtn.addEventListener("click", switchToRegister);
registerBtn.addEventListener("click", registerUser);
loginBtn.addEventListener("click", loginUser);

logoutBtn.addEventListener("click", () => {
  clearCurrentUser();
  authOverlay.classList.remove("hidden");
  mainPage.classList.add("locked");
  switchToLogin();
});

if (scrollBtn) {
  scrollBtn.addEventListener("click", () => {
    const target = document.getElementById("create-request");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
}

if (form) {
  form.addEventListener("submit", createRequest);
}

if (feedbackForm) {
  feedbackForm.addEventListener("submit", sendFeedback);
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", exportToCsv);
}

if (printReportBtn) {
  printReportBtn.addEventListener("click", () => {
    window.print();
  });
}

if (requestSearchInput) {
  requestSearchInput.addEventListener("input", () => {
    const user = getCurrentUser();
    if (user && user.role === "aho") {
      renderAhoRequests(allRequests, user);
    }
  });
}

if (requestStatusFilter) {
  requestStatusFilter.addEventListener("change", () => {
    const user = getCurrentUser();
    if (user && user.role === "aho") {
      renderAhoRequests(allRequests, user);
    }
  });
}

if (analyticsStatusFilter) {
  analyticsStatusFilter.addEventListener("change", () => {
    renderAnalytics(allRequests);
  });
}

if (exportServicesCsvBtn) {
  exportServicesCsvBtn.addEventListener("click", exportServicesToCsv);
}

if (requestFileInput && fileNameText) {
  requestFileInput.addEventListener("change", () => {
    if (requestFileInput.files.length > 0) {
      fileNameText.textContent = `Выбран файл: ${requestFileInput.files[0].name}`;
    } else {
      fileNameText.textContent = "Файл не выбран";
    }
  });
}

switchToLogin();
openSite();