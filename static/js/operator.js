/* ==========================================================================
   OPERATOR SHELL - ENGINE (operator.js)
   ========================================================================== */

let toastTimer;

/**
 * CORE RENDERER
 * Filters the lowercase 'masterdata' based on UI state and renders to the DOM
 */
function runUpdate() {
    // 1. Get current filter states from the UI
    const platformFilter = document.getElementById('os-filter').value;
    const svcFilter = document.getElementById('service-filter').value;
    const search = document.getElementById('search-input').value.toLowerCase();
    const showCmds = document.getElementById('cmd-toggle').checked;
    const priorityOnly = document.getElementById('priority-toggle').checked;
    
    // 2. Get Variable states for command replacement
    const vars = {
        lhost: document.getElementById('lhost-input').value || "LHOST",
        lport: document.getElementById('lport-input').value || "LPORT",
        rhost: document.getElementById('rhost-input').value || "TARGET",
        rport: document.getElementById('rport-input').value || "PORT"
    };
    
    const render = document.getElementById('checklist-render');
    if (!render) return;

    // 3. Filtering Logic (Targeting lowercase masterdata)
    if (typeof masterdata === 'undefined') {
        console.error("Variable 'masterdata' is missing!");
        return;
    }

    const filtered = masterdata.filter(i => {
        const matchPlatform = (platformFilter === 'all' || i.os === 'all' || i.os === platformFilter);
        const matchSvc = (svcFilter === 'all' || i.service === 'all' || i.service === svcFilter);
        
        // Logical "Inclusive" check for web apps
        const forceShowApps = (i.os === 'apps' && (platformFilter === 'apps' || (platformFilter === 'all' && svcFilter === 'http')));

        const matchSearch = i.task.toLowerCase().includes(search) || i.category.toLowerCase().includes(search);
        const matchPriority = priorityOnly ? (i.priority === 'high') : true;

        return ((matchPlatform && matchSvc) || forceShowApps) && matchSearch && matchPriority;
    });

    // 4. Group by Category
    const categories = [...new Set(filtered.map(i => i.category))].sort();

    // 5. Generate HTML
    render.innerHTML = categories.map(cat => `
        <div class="category-block">
            <div class="category-title">${cat}</div>
            ${filtered.filter(i => i.category === cat).map(item => {
                // Command Placeholder Replacement
                let cmd = (item.command || "")
                    .replace(/LHOST|ATTACKER_IP/gi, vars.lhost)
                    .replace(/LPORT|ATTACKER_PORT/gi, vars.lport)
                    .replace(/TARGET|RHOST/gi, vars.rhost)
                    .replace(/PORT|RPORT/gi, vars.rport);

                const isChecked = localStorage.getItem(item.task) === 'true' ? 'checked' : '';
                const priorityClass = item.priority === 'high' ? 'priority-high' : '';

                return `
                <div class="item-row ${priorityClass}">
                    <div class="priority-border"></div> 
                    <input type="checkbox" id="${item.task}" ${isChecked} onchange="saveCheck(this)">
                    <span class="os-tag">${item.os.toUpperCase()}</span>
                    <div class="task-text">${item.task}</div>
                    ${(cmd && showCmds) ? `<div class="cmd-box" onclick="copyToClipboard(this)">${cmd.trim()}</div>` : ''}
                </div>`;
            }).join('')}
        </div>
    `).join('');
}

/**
 * NMAP HEURISTIC ANALYZER
 */
function analyzeNmap() {
    const rawData = document.getElementById('nmap-input').value;
    const svcField = document.getElementById('service-filter');
    const platformField = document.getElementById('os-filter');
    const rhostField = document.getElementById('rhost-input');
    
    // IP Extraction
    const ipMatch = rawData.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    if (ipMatch) rhostField.value = ipMatch[0];

    // Identify OS (Windows, Linux, or Apps)
    const isWindows = /Service Info: OS: Windows|Microsoft Windows|ms-wbt-server|microsoft-ds/i.test(rawData);
    const isLinux = /Linux|Ubuntu|Debian|CentOS/i.test(rawData);
    
    if (isWindows) {
        platformField.value = 'windows';
    } else if (isLinux) {
        platformField.value = 'linux';
    }

    // Identify Service
    if (/389\/tcp\s+open|445\/tcp\s+open|88\/tcp\s+open/i.test(rawData)) {
        svcField.value = 'ad';
    } else if (/80\/tcp\s+open|443\/tcp\s+open|8080\/tcp\s+open/i.test(rawData)) {
        svcField.value = 'http';
    }

    runUpdate();
    triggerToast("HEURISTIC_COMPLETE");
}

/**
 * UTILITIES
 */
function saveCheck(el) { 
    localStorage.setItem(el.id, el.checked); 
}

function copyToClipboard(el) {
    navigator.clipboard.writeText(el.innerText.trim()).then(() => {
        triggerToast("COMMAND_COPIED");
    });
}

function triggerToast(msg) {
    const toast = document.getElementById('copy-toast');
    if (!toast) return;

    toast.innerText = msg;
    toast.style.setProperty('display', 'block', 'important');

    if (toastTimer) clearTimeout(toastTimer);
    
    toastTimer = setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
    }, 3000);
}

function clearProgress() {
    if(confirm("Confirm Wipe? All checkboxes and settings will be reset.")) { 
        localStorage.clear(); 
        runUpdate(); 
    }
}

/**
 * INITIALIZATION
 * Waits for DOM and checks for masterdata constant
 */
function init() {
    if (typeof masterdata !== 'undefined') {
        runUpdate();
    } else {
        console.error("masterdata is undefined. Ensure masterdata.js is loaded first.");
    }
}

// Execution
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}