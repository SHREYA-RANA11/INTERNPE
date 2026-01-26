// TaskMaster To-Do List Application
// Main Application Controller

class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentSort = 'newest';
        this.editingTaskId = null;
        
        // DOM Elements
        this.elements = {
            taskInput: document.getElementById('taskInput'),
            addBtn: document.getElementById('addBtn'),
            taskList: document.getElementById('taskList'),
            emptyState: document.getElementById('emptyState'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            clearCompletedBtn: document.getElementById('clearCompleted'),
            deleteAllBtn: document.getElementById('deleteAll'),
            totalTasksEl: document.getElementById('totalTasks'),
            pendingTasksEl: document.getElementById('pendingTasks'),
            completedTasksEl: document.getElementById('completedTasks'),
            todayTasksEl: document.getElementById('todayTasks'),
            modal: document.getElementById('taskModal'),
            closeModalBtns: document.querySelectorAll('.close-modal'),
            saveTaskBtn: document.getElementById('saveTaskBtn'),
            editTaskText: document.getElementById('editTaskText'),
            editTaskPriority: document.getElementById('editTaskPriority'),
            editTaskDueDate: document.getElementById('editTaskDueDate'),
            editTaskCategory: document.getElementById('editTaskCategory'),
            currentYear: document.getElementById('currentYear')
        };
        
        this.init();
    }
    
    init() {
        // Set current year in footer
        this.elements.currentYear.textContent = new Date().getFullYear();
        
        // Add sample tasks if empty
        if (this.tasks.length === 0) {
            this.addSampleTasks();
        }
        
        // Initial render
        this.renderTasks();
        this.updateStats();
        
        // Event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Add task
        this.elements.addBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Filter tasks
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.renderTasks();
            });
        });
        
        // Search tasks
        this.elements.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.renderTasks();
        });
        
        // Sort tasks
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });
        
        // Bulk actions
        this.elements.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
        this.elements.deleteAllBtn.addEventListener('click', () => this.deleteAllTasks());
        
        // Modal
        this.elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        this.elements.saveTaskBtn.addEventListener('click', () => this.saveTaskChanges());
        
        // Close modal when clicking outside
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });
    }
    
    addTask() {
        const taskText = this.elements.taskInput.value.trim();
        
        if (taskText === '') {
            this.showNotification('Please enter a task description', 'error');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: 'medium',
            category: 'personal',
            dueDate: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.elements.taskInput.value = '';
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('Task added successfully!', 'success');
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.editingTaskId = taskId;
        this.elements.editTaskText.value = task.text;
        this.elements.editTaskPriority.value = task.priority;
        this.elements.editTaskDueDate.value = task.dueDate || '';
        this.elements.editTaskCategory.value = task.category;
        
        this.openModal();
    }
    
    saveTaskChanges() {
        if (!this.editingTaskId) return;
        
        const taskIndex = this.tasks.findIndex(t => t.id === this.editingTaskId);
        if (taskIndex === -1) return;
        
        const updatedTask = {
            ...this.tasks[taskIndex],
            text: this.elements.editTaskText.value.trim(),
            priority: this.elements.editTaskPriority.value,
            dueDate: this.elements.editTaskDueDate.value,
            category: this.elements.editTaskCategory.value,
            updatedAt: new Date().toISOString()
        };
        
        this.tasks[taskIndex] = updatedTask;
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeModal();
        
        this.showNotification('Task updated successfully!', 'success');
    }
    
    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('Task deleted successfully!', 'info');
    }
    
    toggleTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
        this.tasks[taskIndex].updatedAt = new Date().toISOString();
        
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        const status = this.tasks[taskIndex].completed ? 'completed' : 'pending';
        this.showNotification(`Task marked as ${status}`, 'info');
    }
    
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear', 'info');
            return;
        }
        
        if (!confirm(`Are you sure you want to clear all ${completedCount} completed tasks?`)) return;
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification(`Cleared ${completedCount} completed tasks`, 'success');
    }
    
    deleteAllTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to delete', 'info');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete all ${this.tasks.length} tasks? This action cannot be undone.`)) return;
        
        this.tasks = [];
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('All tasks deleted', 'info');
    }
    
    getFilteredTasks() {
        let filteredTasks = [...this.tasks];
        
        // Apply search filter
        if (this.currentSearch) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.currentSearch) ||
                task.category.toLowerCase().includes(this.currentSearch)
            );
        }
        
        // Apply status filter
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(task => task.dueDate === today);
                break;
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'oldest':
                filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name':
                filteredTasks.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            default: // newest
                filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return filteredTasks;
    }
    
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        this.elements.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.elements.emptyState.style.display = 'block';
            return;
        }
        
        this.elements.emptyState.style.display = 'none';
        
        filteredTasks.forEach(task => {
            const taskItem = this.createTaskElement(task);
            this.elements.taskList.appendChild(taskItem);
        });
    }
    
    createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-id', task.id);
        
        // Get due date status
        const dueStatus = this.getDueDateStatus(task.dueDate);
        const dueClass = dueStatus === 'overdue' ? 'due-overdue' : 
                        dueStatus === 'today' ? 'due-soon' : '';
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-priority">
                        <span class="priority-dot priority-${task.priority}"></span>
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    <span class="task-category">
                        <i class="fas fa-tag"></i> ${task.category}
                    </span>
                    ${task.dueDate ? `
                        <span class="task-due ${dueClass}">
                            <i class="fas fa-calendar-alt"></i> ${this.formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn details-btn" title="View details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="task-action-btn edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Event listeners for this task
        const checkbox = taskItem.querySelector('.task-checkbox');
        const detailsBtn = taskItem.querySelector('.details-btn');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));
        taskItem.addEventListener('dblclick', () => this.toggleTaskCompletion(task.id));
        detailsBtn.addEventListener('click', () => this.viewTaskDetails(task.id));
        editBtn.addEventListener('click', () => this.editTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return taskItem;
    }
    
    viewTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        alert(`Task Details:\n\n` +
              `Description: ${task.text}\n` +
              `Status: ${task.completed ? 'Completed' : 'Pending'}\n` +
              `Priority: ${task.priority}\n` +
              `Category: ${task.category}\n` +
              `Due Date: ${task.dueDate ? this.formatDate(task.dueDate) : 'Not set'}\n` +
              `Created: ${this.formatDateTime(task.createdAt)}\n` +
              `Last Updated: ${this.formatDateTime(task.updatedAt)}`);
    }
    
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        // Count tasks due today
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => 
            task.dueDate === today && !task.completed
        ).length;
        
        this.elements.totalTasksEl.textContent = totalTasks;
        this.elements.pendingTasksEl.textContent = pendingTasks;
        this.elements.completedTasksEl.textContent = completedTasks;
        this.elements.todayTasksEl.textContent = todayTasks;
    }
    
    getDueDateStatus(dueDate) {
        if (!dueDate) return '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'today';
        if (diffDays <= 3) return 'soon';
        return '';
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    openModal() {
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.editingTaskId = null;
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    addSampleTasks() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        this.tasks = [
            {
                id: 1,
                text: "Create a to-do list application",
                completed: true,
                priority: "high",
                category: "work",
                dueDate: today.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                text: "Learn JavaScript ES6 features",
                completed: true,
                priority: "medium",
                category: "personal",
                dueDate: today.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                text: "Build a personal portfolio website",
                completed: false,
                priority: "high",
                category: "work",
                dueDate: nextWeek.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                text: "Read a book for 30 minutes",
                completed: false,
                priority: "low",
                category: "personal",
                dueDate: tomorrow.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 5,
                text: "Prepare for next week's meeting",
                completed: false,
                priority: "medium",
                category: "work",
                dueDate: nextWeek.toISOString().split('T')[0],
                createdAt: today.toISOString(),
                updatedAt: today.toISOString()
            },
            {
                id: 6,
                text: "Buy groceries for the week",
                completed: false,
                priority: "medium",
                category: "shopping",
                dueDate: tomorrow.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 7,
                text: "Go for a morning run",
                completed: false,
                priority: "low",
                category: "health",
                dueDate: today.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        this.saveTasks();
    }
    
    showNotification(message, type) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add event listener to close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        document.body.appendChild(notification);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});