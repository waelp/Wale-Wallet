const Lang = {
    current: 'ar', // 'ar' or 'en'

    init() {
        const saved = localStorage.getItem('app_lang');
        if (saved) {
            this.current = saved;
        }
        this.applyDirection();
    },

    setLanguage(lang) {
        this.current = lang;
        localStorage.setItem('app_lang', lang);
        this.applyDirection();
        // Trigger re-render
        location.reload();
    },

    applyDirection() {
        document.documentElement.lang = this.current;
        document.documentElement.dir = this.current === 'ar' ? 'rtl' : 'ltr';
    },

    t(key) {
        const keys = key.split('.');
        let value = this.dictionary[this.current];
        for (const k of keys) {
            value = value[k];
            if (!value) return key;
        }
        return value;
    },

    dictionary: {
        ar: {
            app_name: 'Your Wallet',
            dashboard: 'الرئيسية',
            income: 'الدخل',
            expenses: 'المصاريف',
            debts: 'الديون',
            savings: 'الادخار',
            settings: 'الإعدادات',
            wallet: 'المحفظة',
            total_balance: 'إجمالي الرصيد',
            cash: 'نقدية',
            saved: 'مدخرات',
            expenses_period: 'مصاريف الفترة',
            outstanding_debts: 'الديون المتبقية',
            savings_target: 'هدف الادخار (٢٥٪)',
            target: 'المستهدف',
            achieved_target: 'أحسنت، حققت هدف الادخار.',
            below_target: 'أنت أقل من الهدف بقيمة',
            add: 'إضافة',
            save: 'حفظ',
            cancel: 'إلغاء',
            theme: 'المظهر',
            light: 'فاتح (أزرق/أبيض)',
            dark: 'داكن (رمادي/أزرق)',
            edit: 'تعديل',
            delete: 'حذف',
            pay: 'سداد',
            date: 'التاريخ',
            amount: 'المبلغ',
            note: 'ملاحظة',
            description: 'الوصف',
            category: 'الفئة',
            type: 'النوع',
            salary: 'راتب',
            other: 'أخرى',
            login: 'تسجيل الدخول',
            register: 'إنشاء حساب',
            username: 'اسم المستخدم',
            password: 'كلمة المرور',
            logout: 'تسجيل خروج',
            export_csv: 'تصدير إلى Excel/CSV',
            language: 'اللغة',
            english: 'English',
            arabic: 'العربية',
            voice_input: 'إدخال صوتي',
            listening: 'جاري الاستماع...',
            due_day: 'يوم الاستحقاق',
            debt_warning: 'تنبيه: قسط مستحق غداً!',
            debt_warning_desc: 'لديك قسط دين يستحق الدفع غداً. يرجى مراجعة قائمة الديون.',
            categories: {
                personal: 'شخصية',
                groceries: 'مقاضي البيت',
                schools: 'المدارس',
                wife: 'زوجتي',
                kids: 'الأولاد',
                rent: 'الإيجار',
                appliances: 'أجهزة منزلية',
                other: 'أخرى'
            }
        },
        en: {
            app_name: 'Personal Wallet',
            dashboard: 'Dashboard',
            income: 'Income',
            expenses: 'Expenses',
            debts: 'Debts',
            savings: 'Savings',
            settings: 'Settings',
            wallet: 'Wallet',
            total_balance: 'Total Balance',
            cash: 'Cash',
            saved: 'Savings',
            expenses_period: 'Period Expenses',
            outstanding_debts: 'Outstanding Debts',
            savings_target: 'Savings Target (25%)',
            target: 'Target',
            achieved_target: 'Great! Target achieved.',
            below_target: 'Below target by',
            add: 'Add',
            save: 'Save',
            cancel: 'Cancel',
            theme: 'Theme',
            light: 'Light (Blue/White)',
            dark: 'Dark (Gray/Blue)',
            edit: 'Edit',
            delete: 'Delete',
            pay: 'Pay',
            date: 'Date',
            amount: 'Amount',
            note: 'Note',
            description: 'Description',
            category: 'Category',
            type: 'Type',
            salary: 'Salary',
            other: 'Other',
            login: 'Login',
            register: 'Register',
            username: 'Username',
            password: 'Password',
            logout: 'Logout',
            export_csv: 'Export to Excel/CSV',
            language: 'Language',
            english: 'English',
            arabic: 'Arabic',
            voice_input: 'Voice Input',
            listening: 'Listening...',
            due_day: 'Due Day',
            debt_warning: 'Warning: Installment due tomorrow!',
            debt_warning_desc: 'You have a debt installment due tomorrow. Please check your debts.',
            categories: {
                personal: 'Personal',
                groceries: 'Groceries',
                schools: 'Schools',
                wife: 'Wife',
                kids: 'Kids',
                rent: 'Rent',
                appliances: 'Appliances',
                other: 'Other'
            }
        }
    }
};

Lang.init();
