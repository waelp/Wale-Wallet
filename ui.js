```javascript
const UI = {
    renderDashboard() {
        const period = app.currentPeriod || 'thisMonth';
        const calc = Store.getCalculations(period);

        // Debt Warning Alert
        let alertHtml = '';
        if (calc.debtWarning) {
            alertHtml = `
    < div class="card" style = "background-color: var(--ios-red); color: white; margin-bottom: 16px;" >
                    <div class="flex-row">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="alert-triangle"></i>
                            <span style="font-weight: 600;">${Lang.t('debt_warning')}</span>
                        </div>
                    </div>
                    <p style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
                        ${Lang.t('debt_warning_desc')}
                    </p>
                </div >
    `;
        }

        const htmlContent = `
    < div class="header" >
                <h1>المحفظة</h1>
                <div class="period-selector">
                    <select id="period-select" onchange="app.setPeriod(this.value)" class="input-field" style="width: auto; padding: 8px;">
                        <option value="thisMonth" ${period === 'thisMonth' ? 'selected' : ''}>هذا الشهر</option>
                        <option value="lastMonth" ${period === 'lastMonth' ? 'selected' : ''}>الشهر الماضي</option>
                        <option value="thisYear" ${period === 'thisYear' ? 'selected' : ''}>هذا العام</option>
                    </select>
                </div>
            </div >

    ${ alertHtml }

            < !--Wallet Card-- >
            <div class="card" style="background: linear-gradient(135deg, var(--ios-blue), var(--ios-indigo)); color: white;">
                <h3 style="opacity: 0.8; margin-bottom: 10px;">إجمالي الرصيد</h3>
                <div style="font-size: 36px; font-weight: 700; margin-bottom: 20px;" class="amount">
                    ${Utils.formatCurrency(calc.walletBalance)}
                </div>
                <div class="flex-row">
                    <div>
                        <div style="font-size: 13px; opacity: 0.8;">نقدية</div>
                        <div class="amount" style="font-size: 17px;">${Utils.formatCurrency(calc.cashBalance)}</div>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 13px; opacity: 0.8;">مدخرات</div>
                        <div class="amount" style="font-size: 17px;">${Utils.formatCurrency(calc.savingsBalance)}</div>
                    </div>
                </div>
            </div>

            <!--KPIs -->
            <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="card" style="margin: 0;">
                    <div class="text-caption">مصاريف الفترة</div>
                    <div class="amount text-red" style="font-size: 20px; margin-top: 4px;">
                        ${Utils.formatCurrency(calc.expensesThisPeriod)}
                    </div>
                </div>
                <div class="card" style="margin: 0;">
                    <div class="text-caption">الديون المتبقية</div>
                    <div class="amount text-orange" style="font-size: 20px; margin-top: 4px;">
                        ${Utils.formatCurrency(calc.outstandingDebts)}
                    </div>
                </div>
            </div>

            <!--Savings Target-- >
            <div class="card">
                <h3>${Lang.t('savings_target')}</h3>
                <div style="margin-top: 10px;">
                    <div class="flex-row" style="margin-bottom: 8px;">
                        <span class="text-secondary">${Lang.t('target')}: ${Utils.formatCurrency(calc.savingTarget)}</span>
                        <span class="amount ${calc.savingsThisPeriod >= calc.savingTarget ? 'text-green' : 'text-orange'}">
                            ${Utils.formatCurrency(calc.savingsThisPeriod)}
                        </span>
                    </div>
                    <div style="background: var(--ios-gray5); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="
                            width: ${Math.min((calc.savingsThisPeriod / (calc.savingTarget || 1)) * 100, 100)}%; 
                            background: ${calc.savingsThisPeriod >= calc.savingTarget ? 'var(--ios-green)' : 'var(--ios-orange)'}; 
                            height: 100%;
                        "></div>
                    </div>
                    <p class="text-caption" style="margin-top: 8px;">
                        ${calc.savingsThisPeriod >= calc.savingTarget
                ? Lang.t('achieved_target')
                : Lang.t('below_target') + ' ' + Utils.formatCurrency(calc.savingTarget - calc.savingsThisPeriod)
            }
                    </p>
                </div>
            </div>

            <!--Charts -->
            <div class="card">
                <h3>${Lang.t('expenses')}</h3>
                <canvas id="expensesChart" width="100%" height="200"></canvas>
            </div>
            <div class="card">
                <h3>${Lang.t('income')} vs ${Lang.t('expenses')}</h3>
                <canvas id="trendChart" width="100%" height="200"></canvas>
            </div>
`;

        // Initialize Charts after render
        setTimeout(() => {
            UI.initCharts(calc);
        }, 100);

        return htmlContent;
    },

    initCharts(calc) {
        // Expenses Pie Chart
        const ctxPie = document.getElementById('expensesChart');
        if (ctxPie) {
            // Group expenses by category
            const expenses = Store.data.expenses.filter(e => Utils.isDateInPeriod(e.date, app.currentPeriod));
            const categories = {};
            expenses.forEach(e => {
                const cat = Lang.t('categories.' + Object.keys(Lang.dictionary.en.categories).find(key => Lang.dictionary.ar.categories[key] === e.category || Lang.dictionary.en.categories[key] === e.category) || 'other');
                categories[cat] = (categories[cat] || 0) + parseFloat(e.amount);
            });

            new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: [
                            '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right', labels: { font: { family: '-apple-system' } } }
                    }
                }
            });
        }

        // Trend Bar Chart
        const ctxBar = document.getElementById('trendChart');
        if (ctxBar) {
            new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: [Lang.t('income'), Lang.t('expenses'), Lang.t('debts')],
                    datasets: [{
                        label: Lang.t('amount'),
                        data: [calc.salaryThisPeriod, calc.expensesThisPeriod, calc.outstandingDebts],
                        backgroundColor: ['#34C759', '#FF3B30', '#FF9500'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    },

    renderIncomeList() {
        const list = Store.data.income.sort((a, b) => new Date(b.date) - new Date(a.date));
        return `
    < div class="header flex-row" >
                <h1>${Lang.t('income')}</h1>
                <button class="btn" style="width: auto; padding: 8px 16px;" onclick="app.openModal('income')">
                    <i data-lucide="plus"></i> ${Lang.t('add')}
                </button>
            </div >
    <div class="card">
        ${list.length ? list.map(item => `
                    <div class="list-item" onclick="app.openModal('income', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        <div>
                            <div style="font-weight: 600;">${item.type === 'Salary' ? Lang.t('salary') : Lang.t('other')}</div>
                            <div class="text-caption">${item.description || '-'}</div>
                            <div class="text-caption">${Utils.formatDate(item.date)}</div>
                        </div>
                        <div class="amount text-green">+${Utils.formatCurrency(item.amount)}</div>
                    </div>
                `).join('') : '<p class="text-secondary" style="text-align: center; padding: 20px;">' + Lang.t('no_records') + '</p>'}
    </div>
`;
    },

    renderExpensesList() {
        const list = Store.data.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        return `
    < div class="header flex-row" >
                <h1>${Lang.t('expenses')}</h1>
                <button class="btn" style="width: auto; padding: 8px 16px;" onclick="app.openModal('expense')">
                    <i data-lucide="plus"></i> ${Lang.t('add')}
                </button>
            </div >
    <div class="card">
        ${list.length ? list.map(item => `
                    <div class="list-item" onclick="app.openModal('expense', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        <div>
                            <div style="font-weight: 600;">${Lang.t('categories.' + Object.keys(Lang.dictionary.en.categories).find(key => Lang.dictionary.ar.categories[key] === item.category || Lang.dictionary.en.categories[key] === item.category) || 'other')}</div>
                            <div class="text-caption">${item.note || '-'}</div>
                            <div class="text-caption">${Utils.formatDate(item.date)}</div>
                        </div>
                        <div class="amount text-red">-${Utils.formatCurrency(item.amount)}</div>
                    </div>
                `).join('') : '<p class="text-secondary" style="text-align: center; padding: 20px;">' + Lang.t('no_records') + '</p>'}
    </div>
`;
    },

    renderDebtsList() {
        const list = Store.data.debts;
        return `
    < div class="header flex-row" >
                <h1>${Lang.t('debts')}</h1>
                <button class="btn" style="width: auto; padding: 8px 16px;" onclick="app.openModal('debt')">
                    <i data-lucide="plus"></i> ${Lang.t('add')}
                </button>
            </div >

    ${
    list.map(debt => `
                <div class="card">
                    <div class="flex-row" style="margin-bottom: 8px;">
                        <h3 style="color: ${debt.status === 'Closed' ? 'var(--ios-green)' : 'inherit'}">
                            ${debt.name} (${debt.status === 'Active' ? Lang.t('active') : Lang.t('closed')})
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" style="width: auto; padding: 4px 12px; font-size: 13px;" 
                                onclick="app.openModal('debt', ${JSON.stringify(debt).replace(/"/g, '&quot;')})">
                                ${Lang.t('edit')}
                            </button>
                            <button class="btn btn-secondary" style="width: auto; padding: 4px 12px; font-size: 13px;" 
                                onclick="app.openPaymentModal('${debt.id}')"
                                ${debt.status === 'Closed' ? 'disabled' : ''}>
                                ${Lang.t('pay')}
                            </button>
                        </div>
                    </div>
                    <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
                        <div class="text-secondary">${Lang.t('original')}: <span class="amount text-primary">${Utils.formatCurrency(debt.original_amount)}</span></div>
                        <div class="text-secondary">${Lang.t('remaining')}: <span class="amount text-primary">${Utils.formatCurrency(debt.remaining_amount)}</span></div>
                        <div class="text-secondary">${Lang.t('installment')}: <span class="amount text-primary">${Utils.formatCurrency(debt.monthly_installment)}</span></div>
                        <div class="text-secondary">${Lang.t('due_day')}: ${debt.due_day || 1}</div>
                    </div>
                </div>
            `).join('')
}
            ${ list.length === 0 ? '<div class="card"><p class="text-secondary" style="text-align: center; padding: 20px;">' + Lang.t('no_records') + '</p></div>' : '' }
`;
    },

    renderSavingsList() {
        const list = Store.data.savings.sort((a, b) => new Date(b.date) - new Date(a.date));
        return `
    < div class="header flex-row" >
                <h1>${Lang.t('savings')}</h1>
                <button class="btn" style="width: auto; padding: 8px 16px;" onclick="app.openModal('savings')">
                    <i data-lucide="plus"></i> ${Lang.t('add')}
                </button>
            </div >
    <div class="card">
        ${list.length ? list.map(item => `
                    <div class="list-item" onclick="app.openModal('savings', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        <div>
                            <div style="font-weight: 600;">${parseFloat(item.amount) >= 0 ? Lang.t('deposit') : Lang.t('withdrawal')}</div>
                            <div class="text-caption">${item.note || '-'}</div>
                            <div class="text-caption">${Utils.formatDate(item.date)}</div>
                        </div>
                        <div class="amount ${parseFloat(item.amount) >= 0 ? 'text-green' : 'text-red'}">
                            ${parseFloat(item.amount) >= 0 ? '+' : ''}${Utils.formatCurrency(item.amount)}
                        </div>
                    </div>
                `).join('') : '<p class="text-secondary" style="text-align: center; padding: 20px;">' + Lang.t('no_records') + '</p>'}
    </div>
`;
    },

    // Forms
    getFormHtml(type, data = {}) {
        const today = Utils.getTodayDateInput();

        if (type === 'income') {
            return `
    < h2 > إضافة دخل</h2 >
        <form onsubmit="app.handleSubmit(event, 'income')">
            <div class="input-group">
                <label class="input-label">المبلغ</label>
                <input type="number" step="0.01" name="amount" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">التاريخ</label>
                <input type="date" name="date" value="${today}" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">النوع</label>
                <select name="type" class="input-field">
                    <option value="Salary">راتب</option>
                    <option value="Other">أخرى</option>
                </select>
            </div>
            <div class="input-group">
                <label class="input-label">الوصف</label>
                <input type="text" name="description" class="input-field">
            </div>
            <button type="submit" class="btn">حفظ</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()" style="margin-top: 8px;">إلغاء</button>
        </form>
`;
        }

        if (type === 'expense') {
            return `
    < h2 > إضافة مصروف</h2 >
        <form onsubmit="app.handleSubmit(event, 'expense')">
            <div class="input-group">
                <label class="input-label">المبلغ</label>
                <input type="number" step="0.01" name="amount" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">التاريخ</label>
                <input type="date" name="date" value="${today}" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">الفئة</label>
                <select name="category" class="input-field">
                    <option value="شخصية">شخصية</option>
                    <option value="مقاضي البيت">مقاضي البيت</option>
                    <option value="المدارس">المدارس</option>
                    <option value="زوجتي">زوجتي</option>
                    <option value="الأولاد">الأولاد</option>
                    <option value="الإيجار">الإيجار</option>
                    <option value="أجهزة منزلية">أجهزة منزلية</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </div>
            <div class="input-group">
                <label class="input-label">ملاحظة</label>
                <input type="text" name="note" class="input-field">
            </div>
            <button type="submit" class="btn">حفظ</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()" style="margin-top: 8px;">إلغاء</button>
        </form>
`;
        }

        if (type === 'debt') {
            return `
    < h2 > إضافة دين جديد</h2 >
        <form onsubmit="app.handleSubmit(event, 'debt')">
            <div class="input-group">
                <label class="input-label">اسم الدين</label>
                <input type="text" name="name" class="input-field" placeholder="مثال: قرض سيارة" required>
            </div>
            <div class="input-group">
                <label class="input-label">نوع الدين</label>
                <select name="debt_type" class="input-field">
                    <option value="بطاقات ائتمانية">بطاقات ائتمانية</option>
                    <option value="قروض خارجية">قروض خارجية</option>
                    <option value="قرض من الشركة">قرض من الشركة</option>
                    <option value="جمعية مع الأصدقاء">جمعية مع الأصدقاء</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </div>
            <div class="input-group">
                <label class="input-label">أصل المبلغ</label>
                <input type="number" step="0.01" name="original_amount" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">القسط الشهري</label>
                <input type="number" step="0.01" name="monthly_installment" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">تاريخ البداية</label>
                <input type="date" name="start_date" value="${today}" class="input-field" required>
            </div>
            <button type="submit" class="btn">حفظ</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()" style="margin-top: 8px;">إلغاء</button>
        </form>
`;
        }

        if (type === 'payment') {
            return `
    < h2 > تسجيل دفعة</h2 >
        <form onsubmit="app.handleSubmit(event, 'payment')">
            <input type="hidden" name="debt_id" value="${data.debtId}">
                <div class="input-group">
                    <label class="input-label">المبلغ</label>
                    <input type="number" step="0.01" name="amount" class="input-field" required>
                </div>
                <div class="input-group">
                    <label class="input-label">التاريخ</label>
                    <input type="date" name="date" value="${today}" class="input-field" required>
                </div>
                <div class="input-group">
                    <label class="input-label">ملاحظة</label>
                    <input type="text" name="note" class="input-field">
                </div>
                <button type="submit" class="btn">حفظ</button>
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()" style="margin-top: 8px;">إلغاء</button>
        </form>
`;
        }

        if (type === 'savings') {
            return `
    < h2 > ${ Lang.t('add') } ${ Lang.t('savings') }</h2 >
        <form onsubmit="app.handleSubmit(event, 'savings')">
            <div class="input-group">
                <label class="input-label">${Lang.t('amount')} (${Lang.t('savings_hint') || 'Positive for deposit, Negative for withdrawal'})</label>
                <input type="number" step="0.01" name="amount" class="input-field" placeholder="500" required>
            </div>
            <div class="input-group">
                <label class="input-label">${Lang.t('date')}</label>
                <input type="date" name="date" value="${today}" class="input-field" required>
            </div>
            <div class="input-group">
                <label class="input-label">${Lang.t('note')}</label>
                <input type="text" name="note" class="input-field">
                    ${UI.getVoiceButton('note')}
            </div>
            <button type="submit" class="btn">${Lang.t('save')}</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()" style="margin-top: 8px;">${Lang.t('cancel')}</button>
        </form>
`;
        }
    },

    renderSettings() {
        return `
    < div class="header" >
        <h1>${Lang.t('settings')}</h1>
            </div >
            
            <div class="card">
                <div class="list-item" onclick="Lang.setLanguage(Lang.current === 'ar' ? 'en' : 'ar')">
                    <div class="flex-row" style="width: 100%;">
                        <span>${Lang.t('language')}</span>
                        <span class="text-secondary">${Lang.current === 'ar' ? 'العربية' : 'English'}</span>
                    </div>
                </div>

                <div class="list-item" onclick="app.toggleTheme()">
                    <div class="flex-row" style="width: 100%;">
                        <span>${Lang.t('theme')}</span>
                        <span class="text-secondary">${document.body.classList.contains('theme-dark') ? Lang.t('dark') : Lang.t('light')}</span>
                    </div>
                </div>
                
                <div class="list-item" onclick="Store.exportData()">
                    <div class="flex-row" style="width: 100%;">
                        <span>${Lang.t('export_csv')}</span>
                        <i data-lucide="download" style="color: var(--ios-blue);"></i>
                    </div>
                </div>


            </div>

            <div style="text-align: center; margin-top: 20px; color: var(--text-secondary); font-size: 13px;">
                Version 2.0.0
            </div>
`;
    },



    getVoiceButton(targetName) {
        return `
    < button type = "button" class="voice-btn" onclick = "app.startVoiceInput('${targetName}')" style = "position: absolute; left: 10px; top: 35px; background: none; border: none; color: var(--ios-blue);" >
        <i data-lucide="mic"></i>
            </button >
    `;
    }
};
