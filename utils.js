const Utils = {
    formatCurrency: (amount, currency = 'SAR') => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    },

    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Helper to get current date in YYYY-MM-DD for inputs
    getTodayDateInput: () => {
        return new Date().toISOString().split('T')[0];
    },

    // Helper to check if a date is within a range
    isDateInPeriod: (dateStr, period) => {
        const date = new Date(dateStr);
        const now = new Date();

        if (period === 'thisMonth') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        if (period === 'lastMonth') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
        }
        if (period === 'thisYear') {
            return date.getFullYear() === now.getFullYear();
        }
        // Custom period logic would go here
        return true; // Default to all time if no match
    }
};
