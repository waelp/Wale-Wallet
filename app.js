const app = {
    currentTab: 'dashboard',
    currentPeriod: 'thisMonth',

    init() {
        try {
            // Initialize Language
            if (typeof Lang !== 'undefined') {
                Lang.init();
            } else {
                console.error('Lang is not defined');
            }

            // Initialize Theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('theme-dark');
            }

            // Check Auth - Always init
            if (typeof Store !== 'undefined') {
                Store.init();
            } else {
                throw new Error('Store is not defined');
            }

            this.navigate('dashboard');

            // Listen for data changes to re-render
            document.addEventListener('dataChanged', () => {
                if (Store.currentUser) this.render();
            });
        } catch (e) {
            alert('App Init Error: ' + e.message);
            console.error(e);
        }
    },



    toggleTheme() {
        document.body.classList.toggle('theme-dark');
        const isDark = document.body.classList.contains('theme-dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.render(); // Re-render to update settings text
    },

    navigate(tab) {
        this.currentTab = tab;

        // Show Tab Bar
        document.getElementById('tab-bar').style.display = 'flex';

        // Update Tab Bar
        document.querySelectorAll('.tab-item').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === tab);
            // Update labels based on Lang
            const label = el.querySelector('span');
            if (label) label.textContent = Lang.t(el.dataset.tab);
        });

        this.render();
    },

    setPeriod(period) {
        this.currentPeriod = period;
        this.render();
    },

    render() {
        const main = document.getElementById('main-content');

        switch (this.currentTab) {
            case 'dashboard':
                main.innerHTML = UI.renderDashboard();
                break;
            case 'income':
                main.innerHTML = UI.renderIncomeList();
                break;
            case 'expenses':
                main.innerHTML = UI.renderExpensesList();
                break;
            case 'debts':
                main.innerHTML = UI.renderDebtsList();
                break;
            case 'savings':
                main.innerHTML = UI.renderSavingsList();
                break;
            case 'settings':
                main.innerHTML = UI.renderSettings(); // Need to implement this
                break;
        }

        // Re-initialize icons
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    // Modal Logic
    openModal(type, data = {}) {
        const modalContent = document.getElementById('modal-content');
        const overlay = document.getElementById('modal-overlay');

        // If editing, we need to pass the ID and existing values
        let formHtml = UI.getFormHtml(type, data);

        // Inject ID if editing
        if (data.id) {
            formHtml = formHtml.replace('<form', `<form data-edit-id="${data.id}"`);

            // Pre-fill logic (simple string replacement for now, or use JS to set values after render)
            // A better approach is to render, then populate.
        }

        modalContent.innerHTML = formHtml;

        // Populate values if editing
        if (data.id) {
            const form = modalContent.querySelector('form');
            for (const [key, value] of Object.entries(data)) {
                const input = form.elements[key];
                if (input) {
                    input.value = value;
                }
            }
        }

        overlay.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => overlay.classList.add('visible'), 10);

        // Re-init icons in modal
        if (window.lucide) lucide.createIcons();
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('visible');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    },

    openPaymentModal(debtId) {
        this.openModal('payment', { debtId });
    },

    // Voice Input Logic
    startVoiceInput(targetName) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = Lang.current === 'ar' ? 'ar-SA' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const btn = document.querySelector(`button[onclick = "app.startVoiceInput('${targetName}')"]`);
        if (btn) btn.style.color = 'red'; // Visual feedback

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.querySelector(`input[name = "${targetName}"]`);
            if (input) {
                input.value = transcript;
            }
            if (btn) btn.style.color = 'var(--ios-blue)';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (btn) btn.style.color = 'var(--ios-blue)';
        };

        recognition.onend = () => {
            if (btn) btn.style.color = 'var(--ios-blue)';
        };
    },

    // Form Handling
    handleSubmit(event, type) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        // Basic Validation
        if (data.amount && parseFloat(data.amount) <= 0 && type !== 'savings') {
            alert('Amount must be positive');
            return;
        }

        switch (type) {
            case 'income':
                Store.add('income', {
                    amount: parseFloat(data.amount),
                    date: data.date,
                    type: data.type,
                    description: data.description
                });
                break;

            case 'expense':
                Store.add('expenses', {
                    amount: parseFloat(data.amount),
                    date: data.date,
                    category: data.category,
                    note: data.note
                });
                break;

            case 'debt':
                Store.add('debts', {
                    name: data.name,
                    debt_type: data.debt_type,
                    original_amount: parseFloat(data.original_amount),
                    remaining_amount: parseFloat(data.original_amount), // Initially same as original
                    monthly_installment: parseFloat(data.monthly_installment),
                    start_date: data.start_date,
                    due_day: parseInt(data.due_day) || 1, // New field
                    status: 'Active'
                });
                break;

            case 'payment':
                Store.addDebtPayment({
                    debt_id: data.debt_id,
                    amount: parseFloat(data.amount),
                    date: data.date,
                    note: data.note
                });
                break;

            case 'savings':
                Store.add('savings', {
                    amount: parseFloat(data.amount),
                    date: data.date,
                    note: data.note
                });
                break;
        }

        this.closeModal();
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
