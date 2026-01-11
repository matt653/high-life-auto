const COSTS = {
    TARGET_PROFIT: 750,
    LABOR_RATE: 50
};

// Simulated Internal Dealership Data
// Simulated Internal Dealership Data
const PAST_SALES = [
    { model: 'CAVALIER', year: 1995, days: 95, profit: 400 },
    { model: 'F-150', year: 2018, days: 20, profit: 1200 },
    { model: 'CAMRY', year: 2015, days: 30, profit: 900 },
    { model: 'CIVIC', year: 2016, days: 25, profit: 1000 },
    { model: 'SIERRA', year: 2019, days: 45, profit: 800 }
];

const KEYWORD_DATA = {
    'tire': { hours: 0.5, parts: 150 }, 'tires': { hours: 1, parts: 600 },
    'detail': { hours: 3, parts: 0 },
    'oil': { hours: 0.5, parts: 40 },
    'brake': { hours: 2, parts: 100 }, 'brakes': { hours: 3, parts: 200 },
    'scratch': { hours: 1, parts: 50 },
    'dent': { hours: 2, parts: 100 },
    'bumper': { hours: 3, parts: 300 },
    'glass': { hours: 2, parts: 200 },
    'transmission': { hours: 8, parts: 1500 },
    'engine': { hours: 12, parts: 2000 }
};

let currentVehicle = { year: 0, make: '', model: '' };
let reconItems = [{ name: 'Detail', hours: 3, parts: 20 }, { name: 'Oil Service', hours: 0.5, parts: 30 }];

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        vin: document.getElementById('vin'),
        decodeBtn: document.getElementById('decode-btn'),
        vehicleInfo: document.getElementById('vehicle-info'),
        getDataBtn: document.getElementById('get-data-btn'),
        retailVal: document.getElementById('retail-val'),
        miles: document.getElementById('miles'),
        wholesaleLogic: document.getElementById('wholesale-logic'),
        issuesPanel: document.getElementById('issues-panel'),
        nhtsaList: document.getElementById('nhtsa-list'),
        micBtn: document.getElementById('mic-btn'),
        reconList: document.getElementById('recon-list'),
        addReconBtn: document.getElementById('add-recon-btn'),
        reconTotalDisplay: document.getElementById('recon-total-display'),
        // Live Outputs
        liveStreet: document.getElementById('live-street'),
        liveMileageAdj: document.getElementById('live-mileage-adj'),
        liveWholesale: document.getElementById('live-wholesale'),
        liveRecon: document.getElementById('live-recon'),
        maxBidValue: document.getElementById('max-bid-value'),
        riskGaugeFill: document.getElementById('risk-gauge-fill'),
        riskScoreDisplay: document.getElementById('risk-score-display'),
        riskLabelText: document.getElementById('risk-label-text'),
        riskFactorsList: document.getElementById('risk-factors'), // New V7
        histDays: document.getElementById('hist-days'),
        histProfit: document.getElementById('hist-profit'),
        histContext: document.getElementById('hist-context'),
        // Scanner
        scanBtn: document.getElementById('scan-btn'),
        scannerModal: document.getElementById('scanner-modal'),
        closeScannerBtn: document.getElementById('close-scanner')
    };

    // --- Core Reactive Logic ---
    const updateDashboard = () => {
        // Gathering Inputs
        let streetPrice = parseFloat(elements.retailVal.value) || 0;
        const miles = parseFloat(elements.miles.value) || 0;
        const wholesaleRatio = parseFloat(elements.wholesaleLogic.value);

        // 1. Mileage Adjustment (V6)
        // Logic: Standard 12k/year. excess depreciates slightly. 
        // Or simpler: If miles > 150k, punish value.
        let mileageAdjFactor = 1.0;
        const age = new Date().getFullYear() - (currentVehicle.year || 2010);
        const avgMiles = age * 12000;

        if (miles > 0 && avgMiles > 0) {
            const ratio = miles / avgMiles;
            if (ratio > 1.2) mileageAdjFactor = 0.9; // 10% hit
            if (ratio > 1.5) mileageAdjFactor = 0.8; // 20% hit
            if (ratio > 2.0) mileageAdjFactor = 0.7; // 30% hit
        }

        // Effective Street Price
        const effectiveStreet = streetPrice * mileageAdjFactor;

        // 2. Risk Calculation (0-100%)
        let riskScore = 15; // Base risk
        let riskNotes = [];

        // Factor: Mileage
        if (miles > 150000) { riskScore += 25; riskNotes.push('High Mileage'); }
        else if (miles > 100000) { riskScore += 15; }

        // Factor: Dealership History (Internal Data)
        // Factor: Dealership History (Internal Data - 10 Year Range)
        const targetYear = currentVehicle.year || 2010;
        const past = PAST_SALES.find(s => {
            const sameModel = currentVehicle.model && s.model.includes(currentVehicle.model.toUpperCase().split(' ')[0]);
            const yearDiff = Math.abs(s.year - targetYear);
            return sameModel && yearDiff <= 5;
        });

        if (past) {
            elements.histDays.textContent = past.days + ' Days';
            elements.histProfit.textContent = '$' + past.profit;
            const rangeStart = targetYear - 5;
            const rangeEnd = targetYear + 5;
            elements.histContext.textContent = `Matches ${past.model} (${rangeStart}-${rangeEnd})`;

            if (past.days > 60) { riskScore += 30; riskNotes.push('Slow Seller (>60 days)'); }
            if (past.profit < 500) { riskScore += 20; riskNotes.push('Low Margin history'); }
            if (past.days < 30) { riskScore -= 10; riskNotes.push('Fast Seller!'); } // Demand bonus
        } else {
            elements.histDays.textContent = '-';
            elements.histProfit.textContent = '-';
            elements.histContext.textContent = 'No sales in +/- 5yr range';
        }

        // Cap Risk
        if (riskScore > 100) riskScore = 100;
        if (riskScore < 0) riskScore = 0;

        // 3. Totals
        const wholesaleCap = effectiveStreet * wholesaleRatio;
        const reconTotal = reconItems.reduce((acc, item) => acc + (item.hours * COSTS.LABOR_RATE) + item.parts, 0);

        const maxBid = wholesaleCap - reconTotal - COSTS.TARGET_PROFIT;

        // Render Live
        elements.liveStreet.textContent = `$${Math.round(effectiveStreet).toLocaleString()}`;
        elements.liveMileageAdj.textContent = mileageAdjFactor < 1 ? `-${Math.round((1 - mileageAdjFactor) * 100)}% (Miles)` : '0%';
        elements.liveWholesale.textContent = `$${Math.round(wholesaleCap).toLocaleString()}`;
        elements.liveRecon.textContent = `-$${Math.round(reconTotal).toLocaleString()}`;

        // V7 Change: Display WHOLESALE CAP as the main value
        // The Recon/Profit are now just visual subtractions in the list
        elements.maxBidValue.textContent = `$${Math.round(wholesaleCap).toLocaleString()}`;
        elements.maxBidValue.style.color = 'var(--primary)'; // Changed to blue/primary to signify it's a value, not a net bid

        // Render Risk
        elements.riskScoreDisplay.textContent = `${riskScore}%`;
        elements.riskGaugeFill.style.width = `${riskScore}%`;

        if (riskScore < 30) {
            elements.riskLabelText.textContent = 'Low Risk ✅';
            elements.riskLabelText.style.color = 'var(--success)';
        } else if (riskScore < 60) {
            elements.riskLabelText.textContent = 'Medium Risk ⚠️';
            elements.riskLabelText.style.color = 'var(--warning)';
        } else {
            elements.riskLabelText.textContent = 'High Risk 🛑';
            elements.riskLabelText.style.color = 'var(--danger)';
        }

        // Render Risk Factors
        elements.riskFactorsList.innerHTML = '';
        if (riskNotes.length > 0) {
            riskNotes.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note;
                li.style.color = 'var(--text-muted)';
                li.style.fontSize = '0.8rem';
                elements.riskFactorsList.appendChild(li);
            });
        }

    };

    // --- Inputs Listeners for Reactive Updates ---
    elements.retailVal.addEventListener('input', updateDashboard);
    elements.miles.addEventListener('input', updateDashboard);
    elements.wholesaleLogic.addEventListener('change', updateDashboard);

    // --- Recon Logic ---
    const renderRecon = () => {
        elements.reconList.innerHTML = '';
        let grandTotal = 0;

        reconItems.forEach((item, index) => {
            const row = document.createElement('tr');

            // Item Name
            const tdName = document.createElement('td');
            const inpName = document.createElement('input'); inpName.type = 'text'; inpName.value = item.name;
            inpName.style.width = '100%';
            inpName.addEventListener('change', (e) => { reconItems[index].name = e.target.value; updateDashboard(); });
            tdName.appendChild(inpName);

            // Hours
            const tdHrs = document.createElement('td');
            const inpHrs = document.createElement('input'); inpHrs.type = 'number'; inpHrs.value = item.hours; inpHrs.step = '0.5';
            inpHrs.style.width = '100%';
            inpHrs.addEventListener('input', (e) => { reconItems[index].hours = parseFloat(e.target.value) || 0; renderRecon(); });
            tdHrs.appendChild(inpHrs);

            // Parts
            const tdPrts = document.createElement('td');
            const inpPrts = document.createElement('input'); inpPrts.type = 'number'; inpPrts.value = item.parts;
            inpPrts.style.width = '100%';
            inpPrts.addEventListener('input', (e) => { reconItems[index].parts = parseFloat(e.target.value) || 0; renderRecon(); });
            tdPrts.appendChild(inpPrts);

            // Total
            const tdTot = document.createElement('td');
            const total = (item.hours * COSTS.LABOR_RATE) + item.parts;
            grandTotal += total;
            tdTot.textContent = `$${Math.round(total)}`;
            tdTot.style.fontSize = '0.85rem';

            // Delete
            const tdDel = document.createElement('td');
            const btnDel = document.createElement('button'); btnDel.innerHTML = '&times;'; btnDel.className = 'delete-row';
            btnDel.addEventListener('click', () => { reconItems.splice(index, 1); renderRecon(); });
            tdDel.appendChild(btnDel);

            row.append(tdName, tdHrs, tdPrts, tdTot, tdDel);
            elements.reconList.appendChild(row);
        });

        elements.reconTotalDisplay.textContent = `$${Math.round(grandTotal)}`;
        updateDashboard(); // Trigger dashboard update whenever recon changes
        return grandTotal;
    };

    elements.addReconBtn.addEventListener('click', () => {
        reconItems.push({ name: '', hours: 0, parts: 0 });
        renderRecon();
    });

    // --- VIN Decode ---
    elements.decodeBtn.addEventListener('click', async () => {
        const vin = elements.vin.value.trim();
        if (vin.length !== 17) return;
        elements.decodeBtn.textContent = '...';
        try {
            const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
            const data = await res.json();
            const results = data.Results;
            const yearStr = results.find(r => r.Variable === 'Model Year')?.Value;
            currentVehicle = {
                year: parseInt(yearStr) || 2010,
                make: results.find(r => r.Variable === 'Make')?.Value || '',
                model: results.find(r => r.Variable === 'Model')?.Value || ''
            };
            elements.vehicleInfo.textContent = `${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}`;
            elements.vehicleInfo.classList.remove('hidden');
            updateDashboard(); // Check if history exists for this model
        } catch (e) { console.error(e); } finally { elements.decodeBtn.textContent = 'Decode'; }
    });

    // --- Automated Data Fetch ---
    elements.getDataBtn.addEventListener('click', async () => {
        if (!currentVehicle.make) return;
        elements.getDataBtn.textContent = 'Thinking...';

        // Value Heuristic
        const age = new Date().getFullYear() - currentVehicle.year;
        let baseMSRP = 28000;
        if (['BMW', 'MERCEDES'].includes(currentVehicle.make.toUpperCase())) baseMSRP = 50000;
        let val = baseMSRP * Math.pow(0.85, age);
        if (val < 1000) val = 1000;
        elements.retailVal.value = Math.round(val);

        // NHTSA Fetch
        try {
            const u = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${currentVehicle.make}&model=${currentVehicle.model}&modelYear=${currentVehicle.year}`;
            const r = await fetch(u);
            const d = await r.json();
            elements.nhtsaList.innerHTML = '';
            const c = d.results || [];
            if (c.length === 0) elements.nhtsaList.innerHTML = '<div class="issue-item">No major complaints.</div>';
            else {
                const counts = {}; c.forEach(x => counts[x.component] = (counts[x.component] || 0) + 1);
                Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([comp, cnt]) => {
                    const div = document.createElement('div'); div.className = 'issue-item';
                    div.innerHTML = `<span>${comp}</span><span class="issue-count">${cnt}</span>`;
                    elements.nhtsaList.appendChild(div);
                });
            }
            elements.issuesPanel.classList.remove('hidden');
        } catch (e) { }

        elements.getDataBtn.textContent = 'Data Loaded';
        updateDashboard();
    });

    // --- Voice ---
    if ('webkitSpeechRecognition' in window) {
        const r = new webkitSpeechRecognition(); r.lang = 'en-US';
        elements.micBtn.addEventListener('click', () => { elements.micBtn.classList.add('listening'); r.start(); });
        r.onresult = (e) => {
            elements.micBtn.classList.remove('listening');
            const txt = e.results[0][0].transcript.toLowerCase();
            for (const [k, d] of Object.entries(KEYWORD_DATA)) {
                if (txt.includes(k)) reconItems.push({ name: k.charAt(0).toUpperCase() + k.slice(1), hours: d.hours, parts: d.parts });
            }
            renderRecon();
        };
    }

    // --- Init ---
    renderRecon();
});
