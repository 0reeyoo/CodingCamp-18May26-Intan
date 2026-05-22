const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const greetingElement = document.getElementById('greeting');
const nameLabel = document.getElementById('nameLabel');
const editNameBtn = document.getElementById('editNameBtn');
const nameDialog = document.getElementById('nameDialog');
const nameInput = document.getElementById('nameInput');
const saveName = document.getElementById('saveName');
const cancelName = document.getElementById('cancelName');
const themeToggle = document.getElementById('themeToggle');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const linkForm = document.getElementById('linkForm');
const linkName = document.getElementById('linkName');
const linkUrl = document.getElementById('linkUrl');
const linkList = document.getElementById('linkList');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

const LOCAL_KEYS = {
  theme: 'dashboard-theme',
  name: 'dashboard-name',
  tasks: 'dashboard-tasks',
  links: 'dashboard-links',
  timer: 'dashboard-timer',
};

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let tasks = [];
let links = [];

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = `${now.getMinutes()}`.padStart(2, '0');
  const seconds = `${now.getSeconds()}`.padStart(2, '0');
  timeElement.textContent = `${hours}:${minutes}:${seconds}`;
  dateElement.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  greetingElement.textContent = getGreeting(hours);
}

function getGreeting(hour) {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function loadLocalData() {
  const savedTheme = localStorage.getItem(LOCAL_KEYS.theme);
  const savedName = localStorage.getItem(LOCAL_KEYS.name);
  const savedTasks = localStorage.getItem(LOCAL_KEYS.tasks);
  const savedLinks = localStorage.getItem(LOCAL_KEYS.links);
  const savedTimer = localStorage.getItem(LOCAL_KEYS.timer);

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  nameLabel.textContent = savedName || 'Guest';
  if (savedName) {
    nameInput.value = savedName;
  }

  tasks = savedTasks ? JSON.parse(savedTasks) : [];
  links = savedLinks ? JSON.parse(savedLinks) : [];

  if (savedTimer) {
    const savedValue = Number(savedTimer);
    if (!Number.isNaN(savedValue) && savedValue > 0) {
      timerSeconds = savedValue;
    }
  }
}

function saveTheme() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  localStorage.setItem(LOCAL_KEYS.theme, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  saveTheme();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' done' : ''}`;

    const text = document.createElement('div');
    text.className = 'task-text';
    text.textContent = task.text;
    text.contentEditable = 'false';
    text.addEventListener('dblclick', () => enableEditing(task.id, text));

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'secondary-btn';
    doneBtn.textContent = task.done ? 'Undo' : 'Done';
    doneBtn.addEventListener('click', () => toggleTaskDone(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(doneBtn, deleteBtn);
    item.append(text, actions);
    taskList.appendChild(item);
  });
}

function enableEditing(id, element) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  element.contentEditable = 'true';
  element.focus();
  document.execCommand('selectAll', false);
  const finishEdit = () => {
    element.contentEditable = 'false';
    const updatedText = element.textContent.trim();
    if (updatedText) {
      task.text = updatedText;
      saveTasks();
      renderTasks();
    } else {
      renderTasks();
    }
    element.removeEventListener('blur', finishEdit);
  };
  element.addEventListener('blur', finishEdit);
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const duplicate = tasks.some((item) => item.text.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    alert('This task already exists.');
    return;
  }
  tasks.unshift({ id: Date.now(), text: trimmed, done: false });
  saveTasks();
  renderTasks();
}

function toggleTaskDone(id) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem(LOCAL_KEYS.tasks, JSON.stringify(tasks));
}

function renderLinks() {
  linkList.innerHTML = '';
  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    anchor.textContent = link.name;

    const actions = document.createElement('div');
    actions.className = 'link-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editLink(link.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    actions.append(editBtn, deleteBtn);
    item.append(anchor, actions);
    linkList.appendChild(item);
  });
}

function addLink(name, url) {
  const trimmedName = name.trim();
  const trimmedUrl = url.trim();
  if (!trimmedName || !trimmedUrl) return;
  const normalizedUrl = normalizeUrl(trimmedUrl);
  const duplicate = links.some((item) => item.url === normalizedUrl || item.name.toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) {
    alert('A link with this name or URL already exists.');
    return;
  }
  links.unshift({ id: Date.now(), name: trimmedName, url: normalizedUrl });
  saveLinks();
  renderLinks();
}

function normalizeUrl(value) {
  if (!/^(https?:)?\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

function editLink(id) {
  const link = links.find((item) => item.id === id);
  if (!link) return;
  const newName = prompt('Edit link name', link.name);
  if (!newName) return;
  const newUrl = prompt('Edit link URL', link.url);
  if (!newUrl) return;
  link.name = newName.trim() || link.name;
  link.url = normalizeUrl(newUrl.trim()) || link.url;
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((link) => link.id !== id);
  saveLinks();
  renderLinks();
}

function saveLinks() {
  localStorage.setItem(LOCAL_KEYS.links, JSON.stringify(links));
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  minutesElement.textContent = String(mins).padStart(2, '0');
  secondsElement.textContent = String(secs).padStart(2, '0');
}

function saveTimer() {
  localStorage.setItem(LOCAL_KEYS.timer, String(timerSeconds));
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      return;
    }
    timerSeconds -= 1;
    updateTimerDisplay();
    saveTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = 25 * 60;
  updateTimerDisplay();
  saveTimer();
}

function openNameDialog() {
  nameInput.value = nameLabel.textContent === 'Guest' ? '' : nameLabel.textContent;
  nameDialog.showModal();
}

function setName(event) {
  event.preventDefault();
  const value = nameInput.value.trim();
  if (value) {
    nameLabel.textContent = value;
    localStorage.setItem(LOCAL_KEYS.name, value);
  }
  nameDialog.close();
}

function initEvents() {
  themeToggle.addEventListener('click', toggleTheme);
  editNameBtn.addEventListener('click', openNameDialog);
  cancelName.addEventListener('click', () => nameDialog.close());
  nameDialog.addEventListener('submit', setName);

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
  });

  linkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addLink(linkName.value, linkUrl.value);
    linkName.value = '';
    linkUrl.value = '';
  });

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);
}

function init() {
  loadLocalData();
  updateTime();
  setInterval(updateTime, 1000);
  updateTimerDisplay();
  renderTasks();
  renderLinks();
  initEvents();
}

init();
