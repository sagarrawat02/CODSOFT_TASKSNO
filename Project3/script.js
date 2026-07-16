let transactions = JSON.parse(localStorage.getItem('smart_wallet_txs')) || [];
let editTargetId = null;
let categoryPieChart = null;
let monthlyBarChart = null;

document.addEventListener('DOMContentLoaded', () => {
    runOpeningSequence();
    initializeEventListeners();
});
function runOpeningSequence() {
    const title = document.querySelector('.intro-title');
    const subtitle = document.querySelector('.intro-subtitle');
    const tagline = document.querySelector('.intro-tagline');
    const walletWrapper = document.querySelector('.wallet-wrapper');
    const ctaBtn = document.getElementById('get-started-btn');
    setTimeout(() => {
        walletWrapper.classList.add('pop-out-items');
    }, 1800);

    setTimeout(() => {
        title.classList.add('fade-in');
        subtitle.classList.add('fade-in');
        tagline.classList.add('fade-in');
    }, 2400);

    setTimeout(() => {
        ctaBtn.classList.add('show');
    }, 3200);
}
function initializeEventListeners() {
    document.getElementById('get-started-btn').addEventListener('click', transitionToDashboard);
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);
    document.getElementById('search-bar').addEventListener('input', renderLedger);
    document.getElementById('filter-type').addEventListener('change', renderLedger);
    document.getElementById('filter-cat').addEventListener('change', renderLedger);
    document.getElementById('theme-toggle').addEventListener('click', toggleThemeMode);
    document.getElementById('export-btn').addEventListener('click', exportToCSV);
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('click', createButtonRippleEffect);
    });
}
function transitionToDashboard() {
    const intro = document.getElementById('intro-screen');
    const app = document.getElementById('app-dashboard');

    intro.classList.add('slide-away');
    app.classList.remove('hidden');
    recalculateFinancials();
    renderLedger();
}
function recalculateFinancials() {
    let incomeSum = 0;
    let expenseSum = 0;

    transactions.forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (tx.type === 'income') {
            incomeSum += amt;
        } else {
            expenseSum += amt;
        }
    });

    const netBalance = incomeSum - expenseSum;
    const spentPercentage = incomeSum > 0 ? Math.min(Math.round((expenseSum / incomeSum) * 100), 100) : 0;
    animateValueCounter('total-income', incomeSum, true);
    animateValueCounter('total-expenses', expenseSum, true);
    animateValueCounter('current-balance', netBalance, true);
    animateValueCounter('tx-count', transactions.length, false);

    document.getElementById('expense-pct').innerText = `Spent: ${spentPercentage}%`;
    const warningBanner = document.getElementById('budget-warning');
    if (expenseSum > incomeSum && incomeSum > 0) {
        warningBanner.classList.remove('hidden');
    } else {
        warningBanner.classList.add('hidden');
    }
    updateChartsData(incomeSum, expenseSum);
}
function animateValueCounter(elementId, targetVal, isCurrency) {
    const targetObj = document.getElementById(elementId);
    if (!targetObj) return;

    let startTimestamp = null;
    const currentText = targetObj.innerText.replace(/[₹,]/g, '');
    const startVal = parseFloat(currentText) || 0;
    const executionDuration = 800; // ms

    function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const processProgress = Math.min((timestamp - startTimestamp) / executionDuration, 1);
        const incrementalVal = startVal + processProgress * (targetVal - startVal);
        
        if (isCurrency) {
            targetObj.innerText = `₹${incrementalVal.toFixed(2)}`;
        } else {
            targetObj.innerText = Math.floor(incrementalVal);
        }

        if (processProgress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}
function handleFormSubmit(e) {
    e.preventDefault();

    const amt = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;
    const cat = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;
    const desc = document.getElementById('tx-desc').value.trim() || `${cat} Transaction`;

    if (isNaN(amt) || amt <= 0) return alert('Please input valid transactions data criteria.');

    if (editTargetId) {
        transactions = transactions.map(tx => tx.id === editTargetId ? { id: editTargetId, amount: amt, type, category: cat, date, description: desc } : tx);
        editTargetId = null;
        document.getElementById('submit-btn').innerText = 'Save Transaction';
        document.getElementById('cancel-edit-btn').classList.add('hidden');
        document.getElementById('form-title').innerText = 'Add Transaction';
    } else {
        const newTransaction = {
            id: 'tx_uuid_' + Date.now(),
            amount: amt,
            type,
            category: cat,
            date,
            description: desc
        };
        transactions.unshift(newTransaction);
    }

    commitStateToDisk();
    recalculateFinancials();
    renderLedger();
    resetForm();
}
function resetForm() {
    document.getElementById('transaction-form').reset();
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    editTargetId = null;
    document.getElementById('submit-btn').innerText = 'Save Transaction';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('form-title').innerText = 'Add Transaction';
}
function renderLedger() {
    const searchVal = document.getElementById('search-bar').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const catFilter = document.getElementById('filter-cat').value;
    const tbody = document.getElementById('ledger-body');
    const emptyState = document.getElementById('empty-state');

    tbody.innerHTML = '';

    const trackingSubset = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchVal) || tx.category.toLowerCase().includes(searchVal);
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        const matchesCat = catFilter === 'all' || tx.category === catFilter;
        return matchesSearch && matchesType && matchesCat;
    });

    if (trackingSubset.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    trackingSubset.forEach(tx => {
        const tr = document.createElement('tr');
        tr.id = tx.id;
        
        const sign = tx.type === 'income' ? '+' : '-';
        const displayClass = tx.type === 'income' ? 'tx-income-row' : 'tx-expense-row';

        tr.innerHTML = `
            <td>${formatDisplayDate(tx.date)}</td>
            <td><span class="category-badge">${tx.category}</span></td>
            <td>${tx.description}</td>
            <td class="${displayClass}">${tx.type.toUpperCase()}</td>
            <td class="${displayClass}">₹${parseFloat(tx.amount).toFixed(2)}</td>
            <td class="text-center">
                <div class="action-btns">
                    <button class="btn-icon-only edit-action" onclick="initializeTransactionEdit('${tx.id}')" title="Edit row"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon-only delete-action" onclick="executeRowRemovalAnimation('${tx.id}')" title="Delete row"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
window.initializeTransactionEdit = function(id) {
    const match = transactions.find(t => t.id === id);
    if (!match) return;

    editTargetId = id;
    document.getElementById('tx-amount').value = match.amount;
    document.getElementById('tx-type').value = match.type;
    document.getElementById('tx-category').value = match.category;
    document.getElementById('tx-date').value = match.date;
    document.getElementById('tx-desc').value = match.description;

    document.getElementById('submit-btn').innerText = 'Update Details';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    document.getElementById('form-title').innerText = 'Modify Transaction';
    
    document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
};
window.executeRowRemovalAnimation = function(id) {
    const element = document.getElementById(id);
    if (!element) return;

    if(confirm("Are you sure you want to delete this transaction?")) {
        element.classList.add('row-collapse');
        setTimeout(() => {
            transactions = transactions.filter(t => t.id !== id);
            commitStateToDisk();
            recalculateFinancials();
            renderLedger();
        }, 400);
    }
};
function commitStateToDisk() {
    localStorage.setItem('smart_wallet_txs', JSON.stringify(transactions));
}
function updateChartsData(incomeTotal, expenseTotal) {
    const categoriesList = ['Salary', 'Food', 'Shopping', 'Travel', 'Bills', 'Entertainment', 'Education', 'Medical', 'Others'];
    const categoryValues = Array(categoriesList.length).fill(0);

    transactions.filter(t => t.type === 'expense').forEach(tx => {
        const index = categoriesList.indexOf(tx.category);
        if (index !== -1) categoryValues[index] += parseFloat(tx.amount);
    });
    const isDark = document.body.classList.contains('dark-theme');
    const labelColor = isDark ? '#FFFFFF' : '#1C2833';
    const ctxPie = document.getElementById('categoryPieChart').getContext('2d');
    if (categoryPieChart) categoryPieChart.destroy();
    
    categoryPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: categoriesList,
            datasets: [{
                data: categoryValues,
                backgroundColor: ['#4CAF50', '#FF5722', '#E91E63', '#03A9F4', '#9C27B0', '#FF9800', '#00BCD4', '#FFEB3B', '#9E9E9E'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: labelColor, font: { family: 'Poppins' } } },
                title: { display: true, text: 'Expenses by Category', color: labelColor, font: { size: 14, family: 'Poppins', weight: 'bold' } }
            }
        }
    });
    const ctxBar = document.getElementById('monthlyBarChart').getContext('2d');
    if (monthlyBarChart) monthlyBarChart.destroy();

    monthlyBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Cashflow Spread',
                data: [incomeTotal, expenseTotal],
                backgroundColor: ['#00C853', '#FF3D00']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Income vs Expense Structure', color: labelColor, font: { size: 14, family: 'Poppins', weight: 'bold' } }
            },
            scales: {
                y: { ticks: { color: labelColor }, grid: { color: 'rgba(255,255,255,0.08)' } },
                x: { ticks: { color: labelColor }, grid: { display: false } }
            }
        }
    });
}
function toggleThemeMode() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');

    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeIcon.className = 'fas fa-moon';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
    }
    recalculateFinancials();
}
function exportToCSV() {
    if (transactions.length === 0) return alert('No historical data points located to generate exports.');

    let csvContent = "data:text/csv;charset=utf-8,ID,Date,Category,Description,Type,Amount\n";

    transactions.forEach(tx => {
        csvContent += `"${tx.id}","${tx.date}","${tx.category}","${tx.description.replace(/"/g, '""')}","${tx.type}",${tx.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartWallet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`; 
}
function createButtonRippleEffect(e) {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - (btn.getBoundingClientRect().left + radius)}px`;
    circle.style.top = `${e.clientY - (btn.getBoundingClientRect().top + radius)}px`;
    circle.classList.add('ripple');

    const internalRipple = btn.getElementsByClassName('ripple')[0];
    if (internalRipple) internalRipple.remove();

    btn.appendChild(circle);
}