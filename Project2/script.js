let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let searchQuery = '';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskDate = document.getElementById('task-date');
const submitBtn = document.getElementById('submit-btn');
const editTaskIdEl = document.getElementById('edit-task-id');

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderApp();
    setupEventListeners();
});

function setupEventListeners() {
    taskForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderApp();
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderApp();
        });
    });

    themeToggle.addEventListener('click', toggleTheme);
}

function renderApp() {
    let filteredTasks = tasks.filter(task => {
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'completed' && task.completed) || 
            (currentFilter === 'pending' && !task.completed);
            
        const matchesSearch = task.text.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    taskList.innerHTML = '';
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filteredTasks.forEach(task => taskList.appendChild(createTaskNode(task)));
    }
    updateStats();
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
function createTaskNode(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed-state' : ''}`;
    
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <span class="task-text">${escapeHTML(task.text)}</span>
            <div class="task-tags">
                <span class="badge category">${task.category}</span>
                <span class="badge priority-${task.priority}">${task.priority}</span>
                ${task.dueDate ? `<span class="due-indicator">📅 ${task.dueDate}</span>` : ''}
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn edit" title="Edit Task">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-btn delete" title="Delete Task">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;

    li.querySelector('.task-checkbox').addEventListener('change', () => toggleTaskStatus(task.id));
    li.querySelector('.action-btn.edit').addEventListener('click', () => prepareEdit(task));
    li.querySelector('.action-btn.delete').addEventListener('click', () => deleteTask(task.id));

    return li;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const editId = editTaskIdEl.value;

    if (editId) {
        tasks = tasks.map(t => t.id === editId ? {
            ...t,
            text,
            category: taskCategory.value,
            priority: taskPriority.value,
            dueDate: taskDate.value
        } : t);
    
        submitBtn.textContent = 'Add Task';
        editTaskIdEl.value = '';
    } else {

        const newTask = {
            id: Date.now().toString(),
            text,
            category: taskCategory.value,
            priority: taskPriority.value,
            dueDate: taskDate.value,
            completed: false
        };
        tasks.unshift(newTask);
    }

    taskForm.reset();
    renderApp();
}

function toggleTaskStatus(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    renderApp();
}

function prepareEdit(task) {
    taskInput.value = task.text;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDate.value = task.dueDate || '';
    editTaskIdEl.value = task.id;
    
    submitBtn.textContent = 'Save Changes';
    taskInput.focus();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderApp();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
}

function initTheme() {
    const activeTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}