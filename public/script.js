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

const requestFileInput = document.getElementById("requestFile");
const fileNameText = document.getElementById("fileNameText");

const API_URL = "https://ahocit.onrender.com";

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

  if (user.role === "aho") {
    employeeSections.forEach((item) => item.classList.add("hidden"));
    employeeLinks.forEach((item) => item.classList.add("hidden"));
    employeeActions.forEach((item) => item.classList.add("hidden"));
    ahoSections.forEach((item) => item.classList.remove("hidden"));
    ahoLinks.forEach((item) => item.classList.remove("hidden"));
  } else {
    employeeSections.forEach((item) => item.classList.remove("hidden"));
    employeeLinks.forEach((item) => item.classList.remove("hidden"));
    employeeActions.forEach((item) => item.classList.remove("hidden"));
    ahoSections.forEach((item) => item.classList.add("hidden"));
    ahoLinks.forEach((item) => item.classList.add("hidden"));
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

    renderUserRequests(requests, user);
    renderAhoRequests(requests, user);
    renderAnalytics(requests);
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

function renderAhoRequests(requests, user) {
  if (!ahoTable || user.role !== "aho") return;

  ahoTable.innerHTML = "";

  if (requests.length === 0) {
    ahoTable.innerHTML = `
      <tr>
        <td colspan="10">Заявки отсутствуют.</td>
      </tr>
    `;
    return;
  }

  requests.forEach((request) => {
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

function renderAnalytics(requests) {
  const totalRequests = document.getElementById("totalRequests");
  const newRequests = document.getElementById("newRequests");
  const workRequests = document.getElementById("workRequests");
  const doneRequests = document.getElementById("doneRequests");
  const cancelRequests = document.getElementById("cancelRequests");

  if (!totalRequests) return;

  totalRequests.textContent = requests.length;
  newRequests.textContent = requests.filter((item) => item.status === "Новая").length;
  workRequests.textContent = requests.filter((item) => item.status === "В работе").length;
  doneRequests.textContent = requests.filter((item) => item.status === "Выполнено").length;
  cancelRequests.textContent = requests.filter((item) => item.status === "Отклонено").length;
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
  } catch (error) {
    feedbackMessage.style.color = "#c62828";
    feedbackMessage.textContent = "Ошибка сервера.";
  }
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