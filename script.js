// Константы для авторизации
const ADMIN_USER = "stepadmin2015";
const ADMIN_PASS = "yaimeniniyklasniyetoklasno@!48*)_@";

// Состояние приложения (загрузка из LocalStorage или пустые массивы)
let state = {
    currentUser: JSON.parse(localStorage.getItem('dh_user')) || null, // {name: string, role: 'teacher'|'student'}
    tasks: JSON.parse(localStorage.getItem('dh_tasks')) || [], // [{id, title}]
    grades: JSON.parse(localStorage.getItem('dh_grades')) || [] // [{student, taskId, grade}]
};

// Элементы UI
const authSection = document.getElementById('auth-section');
const loginScreen = document.getElementById('login-screen');
const mainFeed = document.getElementById('main-feed');
const teacherPanel = document.getElementById('teacher-panel');
const studentPanel = document.getElementById('student-panel');

// Элементы формы входа
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function saveState() {
    localStorage.setItem('dh_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('dh_grades', JSON.stringify(state.grades));
}

function initApp() {
    renderAuthHeader();
    renderTasks();

    if (!state.currentUser) {
        // Если никто не вошел, показываем окно входа
        loginScreen.classList.remove('hidden');
        teacherPanel.classList.add('hidden');
        studentPanel.classList.add('hidden');
    } else {
        loginScreen.classList.add('hidden');
        if (state.currentUser.role === 'teacher') {
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
    if (state.currentUser) {
        authSection.innerHTML = `
            <span>Привет, <b>${state.currentUser.name}</b>!</span>
            <button id="btn-logout" class="logout-btn">Выйти</button>
        `;
        document.getElementById('btn-logout').addEventListener('click', logout);
    } else {
        authSection.innerHTML = `<span>Вы не авторизованы</span>`;
    }
}

function setupEventListeners() {
    btnLogin.addEventListener('click', handleLogin);
    
    // Кнопки учителя
    document.getElementById('btn-add-task').addEventListener('click', addTask);
    document.getElementById('btn-set-grade').addEventListener('click', setGrade);
}

function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) return alert('Введите имя!');

    if (username === ADMIN_USER) {
        if (password === ADMIN_PASS) {
            state.currentUser = { name: username, role: 'teacher' };
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
            return;
        }
    } else {
        // Вход для обычного ученика без пароля
        state.currentUser = { name: username, role: 'student' };
    }

    localStorage.setItem('dh_user', JSON.stringify(state.currentUser));
    usernameInput.value = '';
    passwordInput.value = '';
    initApp();
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('dh_user');
    initApp();
}

// Функции для работы с заданиями
function renderTasks() {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';

    if (state.tasks.length === 0) {
        container.innerHTML = '<p>Пока нет заданных домашних заданий.</p>';
        return;
    }

    state.tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `<strong>${task.title}</strong>`;
        container.appendChild(div);
    });
}

function addTask() {
    const titleInput = document.getElementById('new-task-title');
    const title = titleInput.value.trim();

    if (!title) return alert('Введите текст задания!');

    const newTask = {
        id: Date.now().toString(),
        title: title
    };

    state.tasks.push(newTask);
    saveState();
    titleInput.value = '';
    
    renderTasks();
    populateTeacherSelects();
    alert('Задание успешно добавлено на главную страницу!');
}

function populateTeacherSelects() {
    const select = document.getElementById('select-task');
    select.innerHTML = '';
    state.tasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = task.title;
        select.appendChild(opt);
    });
}

// Функции для выставления оценок
function setGrade() {
    const studentName = document.getElementById('select-student').value.trim();
    const taskId = document.getElementById('select-task').value;
    const gradeVal = document.getElementById('grade-value').value.trim();

    if (!studentName || !taskId || !gradeVal) {
        return alert('Заполните имя ученика, выберите задание и укажите оценку/долг!');
    }

    // Ищем, есть ли уже запись по этому заданию для ученика
    const existingIndex = state.grades.findIndex(g => g.student.toLowerCase() === studentName.toLowerCase() && g.taskId === taskId);

    if (existingIndex > -1) {
        state.grades[existingIndex].grade = gradeVal;
    } else {
        state.grades.push({
            student: studentName,
            taskId: taskId,
            grade: gradeVal
        });
    }

    saveState();
    document.getElementById('select-student').value = '';
    document.getElementById('grade-value').value = '';
    alert(`Статус/оценка для ${studentName} успешно обновлены!`);
}

// Отрисовка кабинета ученика
function renderStudentCabinet() {
    document.getElementById('student-name-title').textContent = state.currentUser.name;
    const list = document.getElementById('student-grades-list');
    list.innerHTML = '';

    if (state.tasks.length === 0) {
        list.innerHTML = '<li>Заданий еще нет, отдыхай!</li>';
        return;
    }

    state.tasks.forEach(task => {
        // Ищем оценку ученика по текущему заданию
        const gradeObj = state.grades.find(g => g.student.toLowerCase() === state.currentUser.name.toLowerCase() && g.taskId === task.id);
        
        const li = document.createElement('li');
        const statusText = gradeObj ? `Оценка/Статус: <strong>${gradeObj.grade}</strong>` : `<span style="color: red;">❌ Нет оценки / Долг</span>`;
        
        li.innerHTML = `📖 <b>${task.title}</b> — ${statusText}`;
        list.appendChild(li);
    });
}
