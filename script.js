// НАСТРОЙКА FIREBASE
// Замени эти данные на свои, когда создашь веб-проект в консоли Firebase!
const firebaseConfig = {
  apiKey: "AIzaSyC-IkNZCeMyEaezLOSmHFGyjPPn6wt7Hsw",
  authDomain: "domaskola.firebaseapp.com",
  projectId: "domaskola",
  storageBucket: "domaskola.firebasestorage.app",
  messagingSenderId: "272255887603",
  appId: "1:272255887603:web:a65be0cb16e36b517f2f86"
};

// Инициализируем Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Данные для авторизации админа
const ADMIN_USER = "stepadmin2015";
const ADMIN_PASS = "yaimeniniyklasniyetoklasno@!48*)_@";

// Состояние приложения локально (только сессия юзера)
let currentUser = JSON.parse(localStorage.getItem('dh_user')) || null;
// Массивы для данных из Firebase
let globalTasks =;
let globalGrades =;

// UI Элементы
const authSection = document.getElementById('auth-section');
const loginScreen = document.getElementById('login-screen');
const mainFeed = document.getElementById('main-feed');
const teacherPanel = document.getElementById('teacher-panel');
const studentPanel = document.getElementById('student-panel');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initAuthView();
    startRealtimeSync(); // Запуск синхронизации с базой
});

function setupEventListeners() {
    btnLogin.addEventListener('click', handleLogin);
    document.getElementById('btn-add-task').addEventListener('click', addTask);
    document.getElementById('btn-set-grade').addEventListener('click', setGrade);
}

// Отслеживание изменений в Firebase в реальном времени
function startRealtimeSync() {
    // Слушаем ветку заданий 'tasks'
    db.ref('tasks').on('value', (snapshot) => {
        const data = snapshot.val();
        globalTasks =;
        if (data) {
            // Переводим объект Firebase в массив
            Object.keys(data).forEach(key => {
                globalTasks.push({ id: key, title: data[key].title });
            });
        }
        renderTasks();
        if (currentUser && currentUser.role === 'teacher') {
            populateTeacherSelects();
        }
        if (currentUser && currentUser.role === 'student') {
            renderStudentCabinet();
        }
    });

    // Слушаем ветку оценок 'grades'
    db.ref('grades').on('value', (snapshot) => {
        const data = snapshot.val();
        globalGrades =;
        if (data) {
            Object.keys(data).forEach(key => {
                globalGrades.push(data[key]);
            });
        }
        if (currentUser && currentUser.role === 'student') {
            renderStudentCabinet();
        }
    });
}

function initAuthView() {
    renderAuthHeader();

    if (!currentUser) {
        loginScreen.classList.remove('hidden');
        teacherPanel.classList.add('hidden');
        studentPanel.classList.add('hidden');
    } else {
        loginScreen.classList.add('hidden');
        if (currentUser.role === 'teacher') {
            teacherPanel.classList.remove('hidden');
            studentPanel.classList.add('hidden');
            populateTeacherSelects();
        } else {
            teacherPanel.classList.add('hidden');
            studentPanel.classList.remove('hidden');
            renderStudentCabinet();
        }
    }
}

function renderAuthHeader() {
    if (currentUser) {
        authSection.innerHTML = `
            <span>Привет, <b>${currentUser.name}</b>!</span>
            <button id="btn-logout" class="logout-btn">Выйти</button>
        `;
        document.getElementById('btn-logout').addEventListener('click', logout);
    } else {
        authSection.innerHTML = `<span>Вы не авторизованы</span>`;
    }
}

function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) return alert('Введите имя!');

    if (username === ADMIN_USER) {
        if (password === ADMIN_PASS) {
            currentUser = { name: username, role: 'teacher' };
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
            return;
        }
    } else {
        currentUser = { name: username, role: 'student' };
    }

    localStorage.setItem('dh_user', JSON.stringify(currentUser));
    usernameInput.value = '';
    passwordInput.value = '';
    initAuthView();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('dh_user');
    initAuthView();
}

// Запись нового задания в Firebase
function addTask() {
    const titleInput = document.getElementById('new-task-title');
    const title = titleInput.value.trim();

    if (!title) return alert('Введите текст задания!');

    // push() автоматически создает уникальный ID в базе данных
    db.ref('tasks').push({
        title: title
    }).then(() => {
        titleInput.value = '';
        alert('Задание успешно отправлено в облако!');
    }).catch(err => alert('Ошибка сети: ' + err.message));
}

function renderTasks() {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';

    if (globalTasks.length === 0) {
        container.innerHTML = '<p>Пока нет заданных домашних заданий.</p>';
        return;
    }

    globalTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `<strong>${task.title}</strong>`;
        container.appendChild(div);
    });
}

function populateTeacherSelects() {
    const select = document.getElementById('select-task');
    select.innerHTML = '';
    globalTasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = task.title;
        select.appendChild(opt);
    });
}

// Запись оценки в Firebase
function setGrade() {
    const studentName = document.getElementById('select-student').value.trim();
    const taskId = document.getElementById('select-task').value;
    const gradeVal = document.getElementById('grade-value').value.trim();

    if (!studentName || !taskId || !gradeVal) {
        return alert('Заполните все поля для выставления оценки!');
    }

    // Создаем ключ вида "имя_idЗадания", чтобы перезаписывать старую оценку, если она была
    const gradeKey = `${studentName.toLowerCase()}_${taskId}`;

    db.ref('grades/' + gradeKey).set({
        student: studentName,
        taskId: taskId,
        grade: gradeVal
    }).then(() => {
        document.getElementById('select-student').value = '';
        document.getElementById('grade-value').value = '';
        alert(`Оценка для ${studentName} сохранена в базе!`);
    }).catch(err => alert('Ошибка записи: ' + err.message));
}

function renderStudentCabinet() {
    document.getElementById('student-name-title').textContent = currentUser.name;
    const list = document.getElementById('student-grades-list');
    list.innerHTML = '';

    if (globalTasks.length === 0) {
        list.innerHTML = '<li>Заданий еще нет!</li>';
        return;
    }

    globalTasks.forEach(task => {
        const gradeObj = globalGrades.find(g => g.student.toLowerCase() === currentUser.name.toLowerCase() && g.taskId === task.id);
        
        const li = document.createElement('li');
        const statusText = gradeObj ? `Оценка/Статус: <strong>${gradeObj.grade}</strong>` : `<span style="color: red;">❌ Нет оценки / Долг</span>`;
        
        li.innerHTML = `📖 <b>${task.title}</b> — ${statusText}`;
        list.appendChild(li);
    });
}
