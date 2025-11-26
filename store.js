const Store = {
    // Base key prefix
    BASE_KEY: 'finance_app_data_',
    currentUser: null,

    data: {
        income: [],
        expenses: [],
        debts: [],
        debtPayments: [],
        savings: [],
        settings: {
            currency: 'SAR',
            salaryDay: 1
        }
    },

    init() {
        // Default to a single user for local-only usage
        this.currentUser = 'default_user';
        this.loadData();
    },

    // Auth Methods Removed


    // Data Methods
    getKey() {
        return this.BASE_KEY + (this.currentUser || 'guest');
    },

    getEmptyData() {
        return {
            income: [],
            expenses: [],
            debts: [],
            debtPayments: [],
            savings: [],
            settings: { currency: 'SAR', salaryDay: 1 }
        };
    },

    loadData() {
        if (!this.currentUser) return;
        const stored = localStorage.getItem(this.getKey());
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            this.data = this.getEmptyData();
            this.save();
        }
        document.dispatchEvent(new CustomEvent('dataChanged'));
        document.dispatchEvent(new CustomEvent('authChanged'));
    },

    save() {
        if (!this.currentUser) return;
        localStorage.setItem(this.getKey(), JSON.stringify(this.data));
        document.dispatchEvent(new CustomEvent('dataChanged'));
    },

    // Generic Add
    add(collection, item) {
        if (!this.data[collection]) return;
        item.id = item.id || Utils.generateId(); // Allow passing ID for edits
        this.data[collection].push(item);
        this.save();
    },

    // Generic Update (Edit)
    update(collection, id, updates) {
        const index = this.data[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[collection][index] = { ...this.data[collection][index], ...updates };
            this.save();
        }
    },

    // Generic Delete
    delete(collection, id) {
        this.data[collection] = this.data[collection].filter(item => item.id !== id);
        this.save();
    },

    // Specific Logic for Debts
    addDebtPayment(payment) {
        this.add('debtPayments', payment);

        // Update debt remaining amount
        const debt = this.data.debts.find(d => d.id === payment.debt_id);
        if (debt) {
            const newRemaining = parseFloat(debt.remaining_amount) - parseFloat(payment.amount);
            let newStatus = debt.status;
            if (newRemaining <= 0) {
                newStatus = 'Closed';
            }
            this.update('debts', debt.id, {
                remaining_amount: newRemaining,
                status: newStatus
            });
        }
    },

    // Calculations
    getCalculations(period = 'thisMonth') {
        const data = this.data || this.getEmptyData();
        const income = data.income || [];
        const expenses = data.expenses || [];
        const debts = data.debts || [];
        const debtPayments = data.debtPayments || [];
        const savings = data.savings || [];

        // Helper to sum
        const sum = (arr, field = 'amount') => arr.reduce((acc, item) => acc + parseFloat(item[field] || 0), 0);

        // Filter by period
        const filterByPeriod = (arr) => arr.filter(item => Utils.isDateInPeriod(item.date, period));

        // 1. Totals (All Time for Wallet Balance)
        const totalIncome = sum(income);
        const totalExpenses = sum(expenses);
        const totalDebtPayments = sum(debtPayments);
        const totalSavingsBalance = sum(savings); // deposits positive, withdrawals negative

        // Cash Balance Logic:
        const cashBalance = totalIncome - totalExpenses - totalDebtPayments - totalSavingsBalance;

        const walletBalance = cashBalance + totalSavingsBalance;

        // 2. Period Specifics
        const periodExpenses = filterByPeriod(expenses);
        const expensesThisPeriod = sum(periodExpenses);

        const activeDebts = debts.filter(d => d.status === 'Active');
        const outstandingDebts = sum(activeDebts, 'remaining_amount');
        const expectedInstallments = sum(activeDebts, 'monthly_installment');

        // Savings Target (25% of Salary)
        const periodIncome = filterByPeriod(income);
        const salaryIncome = periodIncome.filter(i => i.type === 'Salary');
        const salaryThisPeriod = sum(salaryIncome);

        const periodSavings = filterByPeriod(savings);
        const savingsThisPeriod = sum(periodSavings.filter(s => s.amount > 0)); // Only count deposits for target

        const savingTarget = salaryThisPeriod * 0.25;

        // Debt Reminders
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDate();

        const dueDebts = activeDebts.filter(d => d.due_day === tomorrowDay);
        const debtWarning = dueDebts.length > 0;

        return {
            cashBalance,
            savingsBalance: totalSavingsBalance,
            walletBalance,
            expensesThisPeriod,
            totalExpensesAllTime: totalExpenses,
            outstandingDebts,
            expectedInstallments,
            salaryThisPeriod,
            savingsThisPeriod,
            savingTarget,
            debtWarning
        };
    },

    // Export Data to CSV
    exportData() {
        const { income, expenses, debts } = this.data;
        let csv = '\uFEFF'; // BOM for Excel UTF-8

        csv += 'Type,Date,Amount,Category/Description,Note\n';

        income.forEach(i => csv += `Income, ${i.date},${i.amount},${i.type},${i.description || ''} \n`);
        expenses.forEach(e => csv += `Expense, ${e.date},${e.amount},${e.category},${e.note || ''} \n`);
        debts.forEach(d => csv += `Debt, ${d.start_date},${d.original_amount},${d.name},${d.debt_type} \n`);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `finance_data_${this.currentUser}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
};

// Initialize on load
Store.init();
