/**
 * SoleLedger PWA - Footwear Daily Sales & 20% Profit Tracker
 * Professional Accounting Application for Footwear Business Owners
 */

// ========================================================
// 1. CONSTANTS & CATEGORY DATA
// ========================================================
const CATEGORIES = {
  General: { name: 'General Sales', icon: '📦' },
  Sneakers: { name: 'Sneakers & Sports', icon: '👟' },
  Formal: { name: 'Formal & Office', icon: '👞' },
  Sandals: { name: 'Sandals & Slippers', icon: '👡' },
  Casual: { name: 'Casuals & Loafers', icon: '👟' },
  WomenFashion: { name: "Women's Fashion / Heels", icon: '👠' },
  KidsSchool: { name: 'Kids & School Shoes', icon: '🧒' },
  Boots: { name: 'Boots & Workwear', icon: '🥾' },
  Accessories: { name: 'Socks & Accessories', icon: '🧦' }
};

const PAYMENT_MODES = {
  UPI: { name: 'UPI / Online', icon: '📱' },
  Cash: { name: 'Cash', icon: '💵' },
  Card: { name: 'Card / POS', icon: '💳' },
  Credit: { name: 'Credit / Udhaar', icon: '🤝' }
};

const STORAGE_KEYS = {
  ENTRIES: 'soleledger_sales_entries_v1',
  SETTINGS: 'soleledger_settings_v1'
};

// ========================================================
// 2. APPLICATION STATE
// ========================================================
const state = {
  entries: [],
  settings: {
    shopName: 'SoleLedger Footwear',
    currency: '₹',
    profitMargin: 20, // Default 20% profit margin as requested
    theme: 'dark'
  },
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1, // 1-12
  chartMode: 'daily', // 'daily' or 'cumulative'
  searchQuery: '',
  filterCategory: 'ALL',
  filterPayment: 'ALL',
  deferredInstallPrompt: null
};

// ========================================================
// 3. INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  registerServiceWorker();
  setupInstallPrompt();
  bindEventListeners();
  applyTheme(state.settings.theme);
  updateMonthSelectorUI();
  renderAll();

  // If URL has query action=add, open modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openSaleModal();
  }
});

// Load entries and settings from localStorage
function loadStoredData() {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }

  try {
    const savedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (savedEntries) {
      state.entries = JSON.parse(savedEntries);
    } else {
      // If first time opening, load realistic sample data so it's not empty!
      loadSampleData(false);
    }
  } catch (e) {
    console.error('Error loading entries:', e);
    state.entries = [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
  } catch (e) {
    console.error('Error saving entries:', e);
    showToast('Failed to save to local storage.');
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// ========================================================
// 4. SERVICE WORKER & PWA INSTALLATION
// ========================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.log('[PWA] Service Worker registration failed:', err);
      });
  }
}

function setupInstallPrompt() {
  const installBtn = document.getElementById('installAppBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden');
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!state.deferredInstallPrompt) {
        showToast('To install, use browser menu -> "Add to Home Screen"');
        return;
      }
      state.deferredInstallPrompt.prompt();
      const { outcome } = await state.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Thank you for installing SoleLedger!');
      }
      state.deferredInstallPrompt = null;
      installBtn.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    if (installBtn) installBtn.classList.add('hidden');
  });
}

// ========================================================
// 5. EVENT LISTENERS
// ========================================================
function bindEventListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
      state.settings.theme = newTheme;
      saveSettings();
      applyTheme(newTheme);
    });
  }

  // Month navigation
  document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));
  document.getElementById('todayQuickBtn').addEventListener('click', () => jumpToCurrentMonth());

  const monthPicker = document.getElementById('monthPickerInput');
  if (monthPicker) {
    monthPicker.addEventListener('change', (e) => {
      if (e.target.value) {
        const [y, m] = e.target.value.split('-').map(Number);
        state.currentYear = y;
        state.currentMonth = m;
        updateMonthSelectorUI();
        renderAll();
      }
    });
  }

  // Add Sales buttons (Header, Banner, FAB, Nav)
  document.getElementById('headerAddBtn').addEventListener('click', () => openSaleModal());
  document.getElementById('fabAddSale').addEventListener('click', () => openSaleModal());
  document.getElementById('navAddBtn').addEventListener('click', () => openSaleModal());
  document.getElementById('quickAddTodayBtn').addEventListener('click', () => openSaleModal(getTodayString()));
  document.getElementById('quickAddPastBtn').addEventListener('click', () => openSaleModal(getYesterdayString()));

  // Navigation items
  document.getElementById('navDashboardBtn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('navLogBtn').addEventListener('click', () => {
    document.querySelector('.entries-card').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('navSettingsBtn').addEventListener('click', () => openSettingsModal());

  // Modal controls
  document.getElementById('closeModalBtn').addEventListener('click', closeSaleModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeSaleModal);
  document.getElementById('saleForm').addEventListener('submit', handleSaleFormSubmit);

  // Quick Date Chips in modal
  document.getElementById('chipToday').addEventListener('click', () => {
    document.getElementById('saleDate').value = getTodayString();
  });
  document.getElementById('chipYesterday').addEventListener('click', () => {
    document.getElementById('saleDate').value = getYesterdayString();
  });
  document.getElementById('chipDayBefore').addEventListener('click', () => {
    document.getElementById('saleDate').value = getOffsetDateString(-2);
  });

  // Real-time Profit Calculation on amount input
  const amountInput = document.getElementById('saleAmount');
  amountInput.addEventListener('input', () => {
    updateLiveProfitPreview(parseFloat(amountInput.value) || 0);
  });

  // Settings Modal controls
  document.getElementById('openSettingsBtn').addEventListener('click', openSettingsModal);
  document.getElementById('closeSettingsModalBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('closeSettingsBottomBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('saveStoreSettingsBtn').addEventListener('click', handleSaveStoreSettings);

  // Backup & Restore
  document.getElementById('downloadBackupBtn').addEventListener('click', exportBackupJson);
  document.getElementById('restoreFileInput').addEventListener('change', importBackupJson);
  document.getElementById('loadSampleDataBtn').addEventListener('click', () => {
    if (confirm('Load realistic sample footwear sales data? This will add demonstration records for this month.')) {
      loadSampleData(true);
      closeSettingsModal();
      showToast('Sample footwear data loaded successfully!');
    }
  });
  document.getElementById('clearAllDataBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL sales records? This cannot be undone.')) {
      state.entries = [];
      saveEntries();
      renderAll();
      closeSettingsModal();
      showToast('All sales records have been cleared.');
    }
  });

  // Export CSV & Print Statement
  document.getElementById('exportCsvBtn').addEventListener('click', exportMonthlyCsv);
  document.getElementById('printReportBtn').addEventListener('click', printMonthlyStatement);

  // Chart view toggle
  document.getElementById('chartViewDaily').addEventListener('click', () => setChartMode('daily'));
  document.getElementById('chartViewCumulative').addEventListener('click', () => setChartMode('cumulative'));

  // Filters & Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderEntriesList();
  });
  document.getElementById('filterCategory').addEventListener('change', (e) => {
    state.filterCategory = e.target.value;
    renderEntriesList();
  });
  document.getElementById('filterPayment').addEventListener('change', (e) => {
    state.filterPayment = e.target.value;
    renderEntriesList();
  });

  // Close modals on backdrop click
  const saleModal = document.getElementById('saleModal');
  saleModal.addEventListener('click', (e) => {
    if (e.target === saleModal) closeSaleModal();
  });
  const settingsModal = document.getElementById('settingsModal');
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });
}

// ========================================================
// 6. DATE & MONTH HELPERS
// ========================================================
function formatMonthKey(year, month) {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}`;
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayString() {
  return getOffsetDateString(-1);
}

function getOffsetDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthName(monthNumber) {
  const date = new Date(2026, monthNumber - 1, 1);
  return date.toLocaleString('en-US', { month: 'long' });
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatCurrency(amount) {
  const curr = state.settings.currency || '₹';
  const val = Number(amount) || 0;
  // Format with commas according to locale
  return `${curr}${val.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;
}

function changeMonth(direction) {
  state.currentMonth += direction;
  if (state.currentMonth > 12) {
    state.currentMonth = 1;
    state.currentYear += 1;
  } else if (state.currentMonth < 1) {
    state.currentMonth = 12;
    state.currentYear -= 1;
  }
  updateMonthSelectorUI();
  renderAll();
}

function jumpToCurrentMonth() {
  const now = new Date();
  state.currentYear = now.getFullYear();
  state.currentMonth = now.getMonth() + 1;
  updateMonthSelectorUI();
  renderAll();
}

function updateMonthSelectorUI() {
  const monthName = getMonthName(state.currentMonth);
  const monthLabel = `${monthName} ${state.currentYear}`;
  document.getElementById('currentMonthLabel').textContent = monthLabel;
  document.getElementById('chartSubtitle').textContent = `Daily sales & 20% profit for ${monthLabel}`;

  const monthInput = document.getElementById('monthPickerInput');
  if (monthInput) {
    monthInput.value = formatMonthKey(state.currentYear, state.currentMonth);
  }
}

// ========================================================
// 7. PROFIT CALCULATIONS (20% MARGIN)
// ========================================================
function computeFinancials(amount) {
  const amt = Number(amount) || 0;
  const marginPercent = Number(state.settings.profitMargin) || 20;
  const profit = Math.round(amt * (marginPercent / 100));
  const cost = amt - profit;
  return {
    gross: amt,
    profit,
    cost,
    marginPercent
  };
}

function updateLiveProfitPreview(amount) {
  const { gross, profit, cost } = computeFinancials(amount);
  document.getElementById('previewGross').textContent = formatCurrency(gross);
  document.getElementById('previewProfit').textContent = formatCurrency(profit);
  document.getElementById('previewCost').textContent = formatCurrency(cost);
}

// ========================================================
// 8. DATA FILTERING & AGGREGATION
// ========================================================
function getMonthlyEntries() {
  const prefix = formatMonthKey(state.currentYear, state.currentMonth);
  return state.entries.filter(e => e.date && e.date.startsWith(prefix));
}

function calculateMonthlyStats(monthlyEntries) {
  let totalSales = 0;
  let totalProfit = 0;
  let totalCost = 0;
  let totalPairs = 0;
  const activeDaysSet = new Set();
  const dailyTotals = {};

  monthlyEntries.forEach(entry => {
    const amt = Number(entry.amount) || 0;
    const profit = Number(entry.profit) || (amt * 0.20);
    const cost = amt - profit;
    const pairs = Number(entry.pairs) || 0;

    totalSales += amt;
    totalProfit += profit;
    totalCost += cost;
    totalPairs += pairs;

    if (entry.date) {
      activeDaysSet.add(entry.date);
      dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + amt;
    }
  });

  const activeDays = activeDaysSet.size;
  const avgDailySales = activeDays > 0 ? Math.round(totalSales / activeDays) : 0;
  const avgDailyProfit = activeDays > 0 ? Math.round(totalProfit / activeDays) : 0;
  const avgPricePerPair = totalPairs > 0 ? Math.round(totalSales / totalPairs) : 0;

  // Best day calculation
  let bestDayDate = null;
  let bestDaySales = 0;
  Object.entries(dailyTotals).forEach(([date, sales]) => {
    if (sales > bestDaySales) {
      bestDaySales = sales;
      bestDayDate = date;
    }
  });

  return {
    totalSales,
    totalProfit,
    totalCost,
    totalPairs,
    activeDays,
    avgDailySales,
    avgDailyProfit,
    avgPricePerPair,
    bestDayDate,
    bestDaySales
  };
}

// ========================================================
// 9. RENDERING
// ========================================================
function renderAll() {
  // Update header store title & prefix
  document.getElementById('displayShopName').textContent = state.settings.shopName || 'SoleLedger';
  document.getElementById('formCurrencyPrefix').textContent = state.settings.currency || '₹';
  document.getElementById('profitRateBadge').textContent = `${state.settings.profitMargin || 20}% Profit`;

  const monthlyEntries = getMonthlyEntries();
  const stats = calculateMonthlyStats(monthlyEntries);

  renderKpis(stats);
  renderChart(monthlyEntries);
  renderCategoryBreakdown(monthlyEntries, stats.totalSales);
  renderPaymentBreakdown(monthlyEntries, stats.totalSales);
  renderEntriesList();
}

// Render KPI Cards
function renderKpis(stats) {
  document.getElementById('kpiTotalSales').textContent = formatCurrency(stats.totalSales);
  document.getElementById('kpiSalesDays').textContent = `${stats.activeDays} active sales days`;
  document.getElementById('kpiAvgDailySales').textContent = `Avg ${formatCurrency(stats.avgDailySales)}/day`;

  document.getElementById('kpiTotalProfit').textContent = formatCurrency(stats.totalProfit);
  document.getElementById('kpiAvgDailyProfit').textContent = `Avg Profit: ${formatCurrency(stats.avgDailyProfit)}/day`;

  document.getElementById('kpiTotalCost').textContent = formatCurrency(stats.totalCost);

  document.getElementById('kpiTotalPairs').innerHTML = `${stats.totalPairs.toLocaleString('en-IN')} <small class="unit">pairs</small>`;
  document.getElementById('kpiAvgPairPrice').textContent = stats.totalPairs > 0 ? `Avg ${formatCurrency(stats.avgPricePerPair)}/pair` : 'Avg -';

  if (stats.bestDayDate) {
    const dayNum = parseInt(stats.bestDayDate.split('-')[2], 10);
    document.getElementById('kpiBestDay').textContent = `Best: Day ${dayNum} (${formatCurrency(stats.bestDaySales)})`;
  } else {
    document.getElementById('kpiBestDay').textContent = 'Best: -';
  }
}

// Render Pure SVG Interactive Chart (Zero CDN required - 100% offline ready)
function renderChart(monthlyEntries) {
  const svg = document.getElementById('salesChartSvg');
  const tooltip = document.getElementById('chartTooltip');
  if (!svg) return;

  svg.innerHTML = '';

  const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
  const dailyData = {};

  // Initialize all days of month with 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${state.currentYear}-${String(state.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyData[dateStr] = {
      day: d,
      date: dateStr,
      sales: 0,
      profit: 0,
      pairs: 0
    };
  }

  // Aggregate monthly entries into days
  monthlyEntries.forEach(entry => {
    if (dailyData[entry.date]) {
      const amt = Number(entry.amount) || 0;
      const prof = Number(entry.profit) || (amt * 0.20);
      dailyData[entry.date].sales += amt;
      dailyData[entry.date].profit += prof;
      dailyData[entry.date].pairs += (Number(entry.pairs) || 0);
    }
  });

  const dayList = Object.values(dailyData);

  // Determine Max for scaling
  let maxVal = 1000;
  if (state.chartMode === 'cumulative') {
    let cum = 0;
    dayList.forEach(item => {
      cum += item.sales;
      item.cumulativeSales = cum;
      item.cumulativeProfit = cum * (state.settings.profitMargin / 100);
    });
    maxVal = Math.max(cum, 1000);
  } else {
    dayList.forEach(item => {
      if (item.sales > maxVal) maxVal = item.sales;
    });
  }

  // SVG Dimension Constants
  const width = 900;
  const height = 300;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Grid Lines & Y-Axis Labels
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = (maxVal / gridSteps) * (gridSteps - i);
    const yPos = padTop + (chartH / gridSteps) * i;

    // Line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padLeft);
    line.setAttribute('y1', yPos);
    line.setAttribute('x2', width - padRight);
    line.setAttribute('y2', yPos);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.07)');
    line.setAttribute('stroke-dasharray', i === gridSteps ? '0' : '4 4');
    svg.appendChild(line);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padLeft - 10);
    text.setAttribute('y', yPos + 4);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', '#94a3b8');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.textContent = formatCurrency(Math.round(yVal));
    svg.appendChild(text);
  }

  if (state.chartMode === 'daily') {
    // Render Bars
    const barWidth = Math.max(8, (chartW / daysInMonth) * 0.72);
    const stepX = chartW / daysInMonth;

    dayList.forEach((item, index) => {
      const centerX = padLeft + (index + 0.5) * stepX;
      const barX = centerX - barWidth / 2;
      const barH = maxVal > 0 ? (item.sales / maxVal) * chartH : 0;
      const barY = padTop + chartH - barH;

      const profitH = maxVal > 0 ? (item.profit / maxVal) * chartH : 0;
      const profitY = padTop + chartH - profitH;

      // Group for interactivity
      const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      barGroup.setAttribute('class', 'chart-bar-group');
      barGroup.style.cursor = 'pointer';

      // Background invisible hover target
      const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hitRect.setAttribute('x', centerX - stepX / 2);
      hitRect.setAttribute('y', padTop);
      hitRect.setAttribute('width', stepX);
      hitRect.setAttribute('height', chartH);
      hitRect.setAttribute('fill', 'transparent');
      barGroup.appendChild(hitRect);

      if (item.sales > 0) {
        // Sales Bar (Primary Indigo / Blue)
        const salesRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        salesRect.setAttribute('x', barX);
        salesRect.setAttribute('y', barY);
        salesRect.setAttribute('width', barWidth);
        salesRect.setAttribute('height', barH);
        salesRect.setAttribute('rx', 4);
        salesRect.setAttribute('fill', '#6366f1');
        salesRect.setAttribute('opacity', '0.85');
        barGroup.appendChild(salesRect);

        // 20% Profit Segment (Emerald highlight on bottom)
        const profitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        profitRect.setAttribute('x', barX);
        profitRect.setAttribute('y', profitY);
        profitRect.setAttribute('width', barWidth);
        profitRect.setAttribute('height', profitH);
        profitRect.setAttribute('rx', 4);
        profitRect.setAttribute('fill', '#10b981');
        barGroup.appendChild(profitRect);
      } else {
        // Subtle dot for zero-sales day
        const emptyDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        emptyDot.setAttribute('cx', centerX);
        emptyDot.setAttribute('cy', padTop + chartH - 2);
        emptyDot.setAttribute('r', 2);
        emptyDot.setAttribute('fill', 'rgba(255, 255, 255, 0.15)');
        barGroup.appendChild(emptyDot);
      }

      // X-Axis Day Labels (every 2-3 days on desktop, or specific markers)
      if (item.day === 1 || item.day % 5 === 0 || item.day === daysInMonth) {
        const dayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dayLabel.setAttribute('x', centerX);
        dayLabel.setAttribute('y', padTop + chartH + 18);
        dayLabel.setAttribute('text-anchor', 'middle');
        dayLabel.setAttribute('fill', '#64748b');
        dayLabel.setAttribute('font-size', '11');
        dayLabel.setAttribute('font-family', 'var(--font-mono)');
        dayLabel.textContent = item.day;
        svg.appendChild(dayLabel);
      }

      // Tooltip Hover / Touch Events
      const handleEnter = (e) => {
        showChartTooltip(e, item);
      };
      const handleLeave = () => {
        hideChartTooltip();
      };

      barGroup.addEventListener('mouseenter', handleEnter);
      barGroup.addEventListener('mousemove', handleEnter);
      barGroup.addEventListener('mouseleave', handleLeave);
      barGroup.addEventListener('touchstart', handleEnter, { passive: true });

      svg.appendChild(barGroup);
    });

  } else {
    // Cumulative Mode: Smooth Area & Line
    const stepX = chartW / (daysInMonth - 1);
    let pathD = `M ${padLeft} ${padTop + chartH}`;
    let lineD = '';
    let profitLineD = '';

    dayList.forEach((item, index) => {
      const cx = padLeft + index * stepX;
      const cySales = padTop + chartH - ((item.cumulativeSales || 0) / maxVal) * chartH;
      const cyProfit = padTop + chartH - ((item.cumulativeProfit || 0) / maxVal) * chartH;

      if (index === 0) {
        pathD += ` L ${cx} ${cySales}`;
        lineD += `M ${cx} ${cySales}`;
        profitLineD += `M ${cx} ${cyProfit}`;
      } else {
        pathD += ` L ${cx} ${cySales}`;
        lineD += ` L ${cx} ${cySales}`;
        profitLineD += ` L ${cx} ${cyProfit}`;
      }

      if (item.day === 1 || item.day % 5 === 0 || item.day === daysInMonth) {
        const dayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dayLabel.setAttribute('x', cx);
        dayLabel.setAttribute('y', padTop + chartH + 18);
        dayLabel.setAttribute('text-anchor', 'middle');
        dayLabel.setAttribute('fill', '#64748b');
        dayLabel.setAttribute('font-size', '11');
        dayLabel.setAttribute('font-family', 'var(--font-mono)');
        dayLabel.textContent = item.day;
        svg.appendChild(dayLabel);
      }
    });

    const lastX = padLeft + (daysInMonth - 1) * stepX;
    pathD += ` L ${lastX} ${padTop + chartH} Z`;

    // Shaded Area under sales curve
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', pathD);
    areaPath.setAttribute('fill', 'rgba(99, 102, 241, 0.12)');
    svg.appendChild(areaPath);

    // Sales Cumulative Line
    const salesPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    salesPath.setAttribute('d', lineD);
    salesPath.setAttribute('fill', 'none');
    salesPath.setAttribute('stroke', '#6366f1');
    salesPath.setAttribute('stroke-width', '3');
    salesPath.setAttribute('stroke-linecap', 'round');
    svg.appendChild(salesPath);

    // Profit Cumulative Line
    const profitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    profitPath.setAttribute('d', profitLineD);
    profitPath.setAttribute('fill', 'none');
    profitPath.setAttribute('stroke', '#10b981');
    profitPath.setAttribute('stroke-width', '3');
    profitPath.setAttribute('stroke-linecap', 'round');
    svg.appendChild(profitPath);

    // Data points & interaction
    dayList.forEach((item, index) => {
      const cx = padLeft + index * stepX;
      const cySales = padTop + chartH - ((item.cumulativeSales || 0) / maxVal) * chartH;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cySales);
      circle.setAttribute('r', item.sales > 0 ? '5' : '2');
      circle.setAttribute('fill', item.sales > 0 ? '#10b981' : '#64748b');
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';

      circle.addEventListener('mouseenter', (e) => showChartTooltip(e, item, true));
      circle.addEventListener('mouseleave', hideChartTooltip);
      svg.appendChild(circle);
    });
  }
}

function showChartTooltip(e, item, isCumulative = false) {
  const tooltip = document.getElementById('chartTooltip');
  const container = document.getElementById('chartContainer');
  if (!tooltip || !container) return;

  const rect = container.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  let posX = clientX - rect.left + 15;
  let posY = clientY - rect.top - 70;

  if (posX + 180 > rect.width) posX = clientX - rect.left - 185;
  if (posY < 10) posY = 15;

  const dow = getDayOfWeek(item.date);
  const salesVal = isCumulative ? item.cumulativeSales : item.sales;
  const profitVal = isCumulative ? item.cumulativeProfit : item.profit;

  tooltip.innerHTML = `
    <div class="tooltip-date">📅 ${formatDateDisplay(item.date)}</div>
    <div class="tooltip-row">
      <span>${isCumulative ? 'Total to Date' : 'Daily Sales'}:</span>
      <strong>${formatCurrency(salesVal)}</strong>
    </div>
    <div class="tooltip-row profit-row">
      <span>20% Profit:</span>
      <strong>${formatCurrency(profitVal)}</strong>
    </div>
    ${item.pairs > 0 ? `
    <div class="tooltip-row">
      <span>Footwear Pairs:</span>
      <span>${item.pairs} pairs</span>
    </div>` : ''}
  `;

  tooltip.style.left = `${posX}px`;
  tooltip.style.top = `${posY}px`;
  tooltip.classList.remove('hidden');
}

function hideChartTooltip() {
  const tooltip = document.getElementById('chartTooltip');
  if (tooltip) tooltip.classList.add('hidden');
}

function setChartMode(mode) {
  state.chartMode = mode;
  document.getElementById('chartViewDaily').classList.toggle('active', mode === 'daily');
  document.getElementById('chartViewCumulative').classList.toggle('active', mode === 'cumulative');
  renderChart(getMonthlyEntries());
}

// Category & Payment Insights
function renderCategoryBreakdown(monthlyEntries, totalSales) {
  const container = document.getElementById('categoryBreakdownList');
  const badge = document.getElementById('categoryCountBadge');
  if (!container) return;

  const catMap = {};
  monthlyEntries.forEach(entry => {
    const cat = entry.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + (Number(entry.amount) || 0);
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  if (badge) badge.textContent = `${sorted.length} Active Categories`;

  if (sorted.length === 0 || totalSales === 0) {
    container.innerHTML = `<div class="empty-state-sm">No sales data recorded yet for this month.</div>`;
    return;
  }

  container.innerHTML = sorted.map(([catKey, amt]) => {
    const catInfo = CATEGORIES[catKey] || { name: catKey, icon: '📦' };
    const pct = ((amt / totalSales) * 100).toFixed(1);
    const profit = Math.round(amt * (state.settings.profitMargin / 100));

    return `
      <div class="breakdown-item">
        <div class="breakdown-meta">
          <div class="breakdown-label">
            <span>${catInfo.icon}</span>
            <span>${catInfo.name}</span>
          </div>
          <div class="breakdown-values">
            <span>${formatCurrency(amt)}</span>
            <span class="badge badge-profit">${pct}%</span>
          </div>
        </div>
        <div class="breakdown-progress-track">
          <div class="breakdown-progress-bar" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPaymentBreakdown(monthlyEntries, totalSales) {
  const container = document.getElementById('paymentBreakdownList');
  if (!container) return;

  const payMap = {};
  monthlyEntries.forEach(entry => {
    const mode = entry.payment || 'Cash';
    payMap[mode] = (payMap[mode] || 0) + (Number(entry.amount) || 0);
  });

  const sorted = Object.entries(payMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0 || totalSales === 0) {
    container.innerHTML = `<div class="empty-state-sm">No payment records found for this month.</div>`;
    return;
  }

  container.innerHTML = sorted.map(([modeKey, amt]) => {
    const modeInfo = PAYMENT_MODES[modeKey] || { name: modeKey, icon: '💳' };
    const pct = ((amt / totalSales) * 100).toFixed(1);

    return `
      <div class="breakdown-item">
        <div class="breakdown-meta">
          <div class="breakdown-label">
            <span>${modeInfo.icon}</span>
            <span>${modeInfo.name}</span>
          </div>
          <div class="breakdown-values">
            <span>${formatCurrency(amt)}</span>
            <span class="badge">${pct}%</span>
          </div>
        </div>
        <div class="breakdown-progress-track">
          <div class="breakdown-progress-bar" style="width: ${pct}%; background: linear-gradient(90deg, #3b82f6, #10b981);"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Daily Sales Log with grouping by day
function renderEntriesList() {
  const container = document.getElementById('entriesList');
  if (!container) return;

  const monthlyEntries = getMonthlyEntries();

  // Filter based on user search & dropdowns
  const filtered = monthlyEntries.filter(entry => {
    if (state.filterCategory !== 'ALL' && entry.category !== state.filterCategory) {
      return false;
    }
    if (state.filterPayment !== 'ALL' && entry.payment !== state.filterPayment) {
      return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery;
      const inNote = (entry.note || '').toLowerCase().includes(q);
      const inCat = (entry.category || '').toLowerCase().includes(q);
      const inPay = (entry.payment || '').toLowerCase().includes(q);
      const inAmt = String(entry.amount).includes(q);
      if (!inNote && !inCat && !inPay && !inAmt) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-entries">
        <div class="empty-entries-icon">👟</div>
        <h3>No Sales Records Found</h3>
        <p>No transactions match your current month or search filters. Record your daily footwear sales now!</p>
        <button class="btn btn-primary" onclick="openSaleModal()">+ Add Sales Record</button>
      </div>
    `;
    return;
  }

  // Group by date (newest date first)
  const grouped = {};
  filtered.forEach(entry => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  container.innerHTML = sortedDates.map(dateStr => {
    const dayEntries = grouped[dateStr];
    let daySales = 0;
    let dayProfit = 0;
    let dayPairs = 0;

    dayEntries.forEach(item => {
      daySales += Number(item.amount) || 0;
      dayProfit += Number(item.profit) || (Number(item.amount) * 0.20);
      dayPairs += Number(item.pairs) || 0;
    });

    const dayNum = parseInt(dateStr.split('-')[2], 10);
    const dow = getDayOfWeek(dateStr);

    let relativeBadge = '';
    if (dateStr === todayStr) relativeBadge = '<span class="day-relative">⚡ Today</span>';
    else if (dateStr === yesterdayStr) relativeBadge = '<span class="day-relative">Yesterday</span>';

    const itemsHtml = dayEntries.map(entry => {
      const cat = CATEGORIES[entry.category] || { name: entry.category, icon: '📦' };
      const pay = PAYMENT_MODES[entry.payment] || { name: entry.payment, icon: '💳' };
      const profit = Number(entry.profit) || Math.round(Number(entry.amount) * (state.settings.profitMargin / 100));

      return `
        <div class="entry-item" data-id="${entry.id}">
          <div class="entry-left">
            <div class="entry-cat-icon">${cat.icon}</div>
            <div class="entry-details">
              <span class="entry-cat-title">${cat.name}</span>
              <div class="entry-meta-row">
                <span class="pill-sm">${pay.icon} ${pay.name}</span>
                ${entry.pairs ? `<span class="pill-sm">👟 ${entry.pairs} pairs</span>` : ''}
                ${entry.note ? `<span class="entry-note">“${escapeHtml(entry.note)}”</span>` : ''}
              </div>
            </div>
          </div>

          <div class="entry-right">
            <div class="entry-financials">
              <div class="entry-amount">${formatCurrency(entry.amount)}</div>
              <div class="entry-profit">+${formatCurrency(profit)} profit</div>
            </div>
            <div class="entry-actions">
              <button class="btn-action action-edit" title="Edit Entry" onclick="editSale('${entry.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-action action-delete" title="Delete Entry" onclick="deleteSale('${entry.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="day-group expanded">
        <div class="day-group-header" onclick="toggleDayGroup(this)">
          <div class="day-date-wrap">
            <div class="day-number-badge">
              <span class="day-number">${dayNum}</span>
              <span class="day-dow">${dow}</span>
            </div>
            <div>
              <div class="day-date-text">${formatDateDisplay(dateStr)} ${relativeBadge}</div>
              <small class="text-dim">${dayEntries.length} record(s) ${dayPairs > 0 ? `• ${dayPairs} pairs` : ''}</small>
            </div>
          </div>

          <div class="day-totals-wrap">
            <div class="day-sales-total">${formatCurrency(daySales)}</div>
            <div class="day-profit-total">+${formatCurrency(dayProfit)} Profit</div>
            <span class="day-expand-chevron">▲</span>
          </div>
        </div>

        <div class="day-items-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function toggleDayGroup(headerElem) {
  const group = headerElem.closest('.day-group');
  if (group) {
    group.classList.toggle('expanded');
    const chevron = group.querySelector('.day-expand-chevron');
    if (chevron) chevron.textContent = group.classList.contains('expanded') ? '▲' : '▼';
  }
}

// ========================================================
// 10. ADD & EDIT SALES MODAL LOGIC (PAST & PRESENT DAYS)
// ========================================================
function openSaleModal(presetDate = null, entryToEdit = null) {
  const modal = document.getElementById('saleModal');
  const title = document.getElementById('modalTitle');
  const dateInput = document.getElementById('saleDate');
  const amountInput = document.getElementById('saleAmount');
  const pairsInput = document.getElementById('salePairs');
  const catInput = document.getElementById('saleCategory');
  const payInput = document.getElementById('salePayment');
  const noteInput = document.getElementById('saleNote');
  const editIdInput = document.getElementById('editEntryId');
  const saveBtnText = document.getElementById('saveBtnText');

  document.getElementById('formCurrencyPrefix').textContent = state.settings.currency || '₹';

  if (entryToEdit) {
    title.textContent = 'Edit Footwear Sales Entry';
    saveBtnText.textContent = '💾 Update Sales Record';
    editIdInput.value = entryToEdit.id;
    dateInput.value = entryToEdit.date;
    amountInput.value = entryToEdit.amount;
    pairsInput.value = entryToEdit.pairs || '';
    catInput.value = entryToEdit.category || 'General';
    payInput.value = entryToEdit.payment || 'Cash';
    noteInput.value = entryToEdit.note || '';
    updateLiveProfitPreview(entryToEdit.amount);
  } else {
    title.textContent = 'Record Daily Footwear Sale';
    saveBtnText.textContent = '💾 Save Sales Record';
    editIdInput.value = '';
    dateInput.value = presetDate || getTodayString();
    amountInput.value = '';
    pairsInput.value = '';
    catInput.value = 'General';
    payInput.value = 'Cash';
    noteInput.value = '';
    updateLiveProfitPreview(0);
  }

  modal.showModal();
  setTimeout(() => amountInput.focus(), 80);
}

function closeSaleModal() {
  const modal = document.getElementById('saleModal');
  if (modal && modal.open) {
    modal.close();
  }
}

function handleSaleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('editEntryId').value;
  const dateVal = document.getElementById('saleDate').value;
  const amountVal = parseFloat(document.getElementById('saleAmount').value);
  const pairsVal = parseInt(document.getElementById('salePairs').value, 10) || 0;
  const catVal = document.getElementById('saleCategory').value;
  const payVal = document.getElementById('salePayment').value;
  const noteVal = document.getElementById('saleNote').value.trim();

  if (!dateVal) {
    showToast('Please select a date.');
    return;
  }

  if (isNaN(amountVal) || amountVal <= 0) {
    showToast('Please enter a valid sales amount.');
    return;
  }

  const { profit, cost } = computeFinancials(amountVal);

  if (editId) {
    // Edit existing entry
    const index = state.entries.findIndex(entry => entry.id === editId);
    if (index !== -1) {
      state.entries[index] = {
        ...state.entries[index],
        date: dateVal,
        amount: amountVal,
        profit,
        cost,
        pairs: pairsVal,
        category: catVal,
        payment: payVal,
        note: noteVal,
        updatedAt: new Date().toISOString()
      };
      showToast('Sales record updated successfully!');
    }
  } else {
    // New entry (past or present day)
    const newEntry = {
      id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: dateVal,
      amount: amountVal,
      profit,
      cost,
      pairs: pairsVal,
      category: catVal,
      payment: payVal,
      note: noteVal,
      createdAt: new Date().toISOString()
    };
    state.entries.push(newEntry);
    showToast(`Recorded sale of ${formatCurrency(amountVal)} for ${formatDateDisplay(dateVal)}!`);
  }

  saveEntries();

  // Jump to the entry's month so businessman sees his new entry immediately
  const [entryY, entryM] = dateVal.split('-').map(Number);
  state.currentYear = entryY;
  state.currentMonth = entryM;
  updateMonthSelectorUI();

  closeSaleModal();
  renderAll();
}

function editSale(id) {
  const entry = state.entries.find(e => e.id === id);
  if (entry) {
    openSaleModal(entry.date, entry);
  }
}

function deleteSale(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  if (confirm(`Delete sale of ${formatCurrency(entry.amount)} from ${formatDateDisplay(entry.date)}?`)) {
    state.entries = state.entries.filter(e => e.id !== id);
    saveEntries();
    renderAll();
    showToast('Record deleted.');
  }
}

// ========================================================
// 11. SETTINGS & CUSTOMIZATION MODAL
// ========================================================
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  document.getElementById('shopNameInput').value = state.settings.shopName || '';
  document.getElementById('currencySelect').value = state.settings.currency || '₹';
  document.getElementById('profitMarginInput').value = state.settings.profitMargin || 20;
  modal.showModal();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal && modal.open) {
    modal.close();
  }
}

function handleSaveStoreSettings() {
  const shopName = document.getElementById('shopNameInput').value.trim() || 'SoleLedger Footwear';
  const currency = document.getElementById('currencySelect').value || '₹';
  const profitMargin = parseFloat(document.getElementById('profitMarginInput').value) || 20;

  state.settings.shopName = shopName;
  state.settings.currency = currency;
  state.settings.profitMargin = profitMargin;

  // Recalculate profit for all existing entries if margin changed
  state.entries.forEach(e => {
    const amt = Number(e.amount) || 0;
    e.profit = Math.round(amt * (profitMargin / 100));
    e.cost = amt - e.profit;
  });

  saveSettings();
  saveEntries();
  renderAll();
  showToast('Store settings & 20% margin updated!');
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    document.getElementById('themeIconDark').classList.add('hidden');
    document.getElementById('themeIconLight').classList.remove('hidden');
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    document.getElementById('themeIconDark').classList.remove('hidden');
    document.getElementById('themeIconLight').classList.add('hidden');
  }
}

// ========================================================
// 12. EXPORT & BACKUP TOOLS
// ========================================================
function exportMonthlyCsv() {
  const monthly = getMonthlyEntries();
  if (monthly.length === 0) {
    showToast('No sales records to export for this month.');
    return;
  }

  const monthName = getMonthName(state.currentMonth);
  const filename = `SoleLedger_Sales_${monthName}_${state.currentYear}.csv`;

  // CSV headers with UTF-8 BOM
  let csvContent = '\uFEFFDate,Day,Sales Amount,Profit (20%),Inventory Cost (80%),Pairs,Category,Payment Mode,Remarks\n';

  // Sort chronological for CSV statement
  const sorted = [...monthly].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach(item => {
    const amt = item.amount;
    const prof = item.profit || (amt * 0.20);
    const cost = item.cost || (amt - prof);
    const dow = getDayOfWeek(item.date);
    const cat = (CATEGORIES[item.category] || {}).name || item.category;
    const pay = (PAYMENT_MODES[item.payment] || {}).name || item.payment;
    const note = `"${(item.note || '').replace(/"/g, '""')}"`;

    csvContent += `${item.date},${dow},${amt},${prof},${cost},${item.pairs || 0},"${cat}","${pay}",${note}\n`;
  });

  // Download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${monthly.length} records to ${filename}`);
}

function printMonthlyStatement() {
  const monthly = getMonthlyEntries();
  const stats = calculateMonthlyStats(monthly);

  document.getElementById('printShopTitle').textContent = state.settings.shopName || 'SoleLedger Footwear';
  document.getElementById('printMonthPeriod').textContent = `Statement for ${getMonthName(state.currentMonth)} ${state.currentYear}`;
  document.getElementById('printTotalSales').textContent = formatCurrency(stats.totalSales);
  document.getElementById('printTotalProfit').textContent = `${formatCurrency(stats.totalProfit)} (${state.settings.profitMargin}% Margin)`;
  document.getElementById('printTotalCost').textContent = formatCurrency(stats.totalCost);
  document.getElementById('printTotalPairs').textContent = `${stats.totalPairs} pairs`;

  const tbody = document.getElementById('printTableBody');
  const sorted = [...monthly].sort((a, b) => a.date.localeCompare(b.date));

  tbody.innerHTML = sorted.map(item => `
    <tr>
      <td>${item.date} (${getDayOfWeek(item.date)})</td>
      <td>${(CATEGORIES[item.category] || {}).name || item.category}</td>
      <td>${(PAYMENT_MODES[item.payment] || {}).name || item.payment}</td>
      <td>${item.pairs || 0}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${formatCurrency(item.profit || item.amount * 0.20)}</td>
      <td>${escapeHtml(item.note || '-')}</td>
    </tr>
  `).join('');

  window.print();
}

function exportBackupJson() {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    entries: state.entries
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `soleledger_backup_${getTodayString()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('JSON Backup downloaded.');
}

function importBackupJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data.entries)) {
        state.entries = data.entries;
        if (data.settings) state.settings = { ...state.settings, ...data.settings };
        saveEntries();
        saveSettings();
        renderAll();
        closeSettingsModal();
        showToast(`Successfully restored ${state.entries.length} sales records!`);
      } else {
        alert('Invalid backup file format.');
      }
    } catch (err) {
      alert('Error parsing JSON backup file.');
    }
  };
  reader.readAsText(file);
}

// ========================================================
// 13. SAMPLE FOOTWEAR DATA GENERATOR
// ========================================================
function loadSampleData(force = false) {
  if (state.entries.length > 0 && !force) return;

  const year = state.currentYear;
  const month = state.currentMonth;
  const daysInMonth = getDaysInMonth(year, month);
  const sampleEntries = [];

  const footwearSamples = [
    { cat: 'Sneakers', pay: 'UPI', pairs: 8, note: 'Nike & Puma running sneakers' },
    { cat: 'Formal', pay: 'Cash', pairs: 6, note: 'Leather formal oxfords' },
    { cat: 'Sandals', pay: 'Cash', pairs: 14, note: 'Daily comfort chappals' },
    { cat: 'Casual', pay: 'Card', pairs: 9, note: 'Loafers & slip-ons' },
    { cat: 'WomenFashion', pay: 'UPI', pairs: 7, note: 'Party heels & wedges' },
    { cat: 'KidsSchool', pay: 'Cash', pairs: 12, note: 'School uniform shoes' },
    { cat: 'Boots', pay: 'UPI', pairs: 4, note: 'Leather ankle boots' },
    { cat: 'Accessories', pay: 'Cash', pairs: 20, note: 'Socks bundle & shoe polish' }
  ];

  // Distribute realistic sales across 15 past/present days in this month
  const targetDays = [1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 22].filter(d => d <= daysInMonth);

  targetDays.forEach((dayNum, i) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const sample = footwearSamples[i % footwearSamples.length];

    // Realistic shoe store daily sales amounts
    const baseAmounts = [5800, 7200, 11500, 8900, 14200, 6500, 9800, 12600, 16800, 7400, 10200, 13400, 9100, 15000, 8400];
    const amount = baseAmounts[i % baseAmounts.length];
    const { profit, cost } = computeFinancials(amount);

    sampleEntries.push({
      id: 'sample_' + Date.now() + '_' + i,
      date: dateStr,
      amount,
      profit,
      cost,
      pairs: sample.pairs,
      category: sample.cat,
      payment: sample.pay,
      note: sample.note,
      createdAt: new Date().toISOString()
    });
  });

  state.entries = sampleEntries;
  saveEntries();
  renderAll();
}

// ========================================================
// 14. UI NOTIFICATION TOAST & UTILITIES
// ========================================================
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Make modal helper functions available globally on window
window.openSaleModal = openSaleModal;
window.editSale = editSale;
window.deleteSale = deleteSale;
window.toggleDayGroup = toggleDayGroup;
