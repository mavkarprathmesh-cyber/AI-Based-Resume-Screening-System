/**
 * ResumeAI - Enterprise SaaS Client Interaction Engine
 * Features:
 * 1. Collapsible Sidebar & Mobile Drawer Navigation
 * 2. Drag & Drop File Upload with Size Format & File Removal
 * 3. Real-Time Candidate Search, Score Filter & Multi-Skill Filtering
 * 4. 1-Click Automated Sample Demonstration Engine
 * 5. Accessible Modal Dialogs (Delete Candidate, Delete Job, Reset DB)
 * 6. Client-Side Data Export (CSV & JSON)
 * 7. Lucide Icons Dynamic Hydration
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Setup Sidebar Toggle & Persistence
    initSidebar();

    // 3. Setup File Upload Dropzone
    initDropzone();

    // 4. Setup Results Filtering & Sorting
    initResultsFilter();

    // 5. Setup Demo Button Triggers
    initDemoTriggers();

    // 6. Setup Flash Auto-dismiss
    initFlashAlerts();
});

// Helper to refresh icons whenever DOM updates
function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/* ==========================================================================
   1. SIDEBAR TOGGLE & MOBILE DRAWER
   ========================================================================== */
function initSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const mobileToggleBtn = document.getElementById('mobileMenuToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!sidebar) return;

    // Restore desktop collapsed state from localStorage
    const isCollapsed = localStorage.getItem('resumeai_sidebar_collapsed') === 'true';
    if (isCollapsed && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
    }

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const state = sidebar.classList.contains('collapsed');
            localStorage.setItem('resumeai_sidebar_collapsed', state);
            refreshIcons();
        });
    }

    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        });
    }
}

/* ==========================================================================
   2. DRAG AND DROP FILE UPLOADER
   ========================================================================== */
let uploadedFilesStore = [];

function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('resumesInput');
    const queueWrap = document.getElementById('fileQueueWrap');
    const queueList = document.getElementById('fileQueueList');
    const fileCountBadge = document.getElementById('fileCountBadge');
    const screeningForm = document.getElementById('screeningForm');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files.length > 0) {
            handleNewFiles(dt.files);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleNewFiles(fileInput.files);
        }
    });

    function handleNewFiles(files) {
        Array.from(files).forEach(file => {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                // Avoid duplicates by name
                if (!uploadedFilesStore.some(f => f.name === file.name)) {
                    uploadedFilesStore.push(file);
                }
            } else {
                showToast(`"${file.name}" is not a PDF. Only PDF files are supported.`, 'error');
            }
        });

        syncFileInput();
        renderQueue();
    }

    function syncFileInput() {
        // Create DataTransfer object to sync files with the hidden file input
        try {
            const dt = new DataTransfer();
            uploadedFilesStore.forEach(f => dt.items.add(f));
            fileInput.files = dt.files;
        } catch (err) {
            console.warn("DataTransfer sync:", err);
        }
    }

    window.removeQueuedFile = function(index) {
        uploadedFilesStore.splice(index, 1);
        syncFileInput();
        renderQueue();
    };

    function renderQueue() {
        if (!queueWrap || !queueList) return;

        if (uploadedFilesStore.length === 0) {
            queueWrap.style.display = 'none';
            if (fileCountBadge) fileCountBadge.textContent = '0 files';
            return;
        }

        queueWrap.style.display = 'block';
        if (fileCountBadge) {
            fileCountBadge.textContent = `${uploadedFilesStore.length} file${uploadedFilesStore.length > 1 ? 's' : ''}`;
        }

        queueList.innerHTML = uploadedFilesStore.map((file, idx) => `
            <div class="file-queue-item">
                <div class="file-queue-left">
                    <i data-lucide="file-text" style="width: 16px; height: 16px; color: var(--primary);"></i>
                    <span class="file-queue-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    <span class="file-queue-size">(${formatBytes(file.size)})</span>
                </div>
                <button type="button" class="file-queue-remove" onclick="removeQueuedFile(${idx})" title="Remove">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `).join('');

        refreshIcons();
    }

    // Intercept form submit to show animated processing overlay
    if (screeningForm) {
        screeningForm.addEventListener('submit', (e) => {
            const desc = document.getElementById('jobDescription');
            if (desc && desc.value.trim().length < 20) {
                e.preventDefault();
                showToast("Please provide a job description with at least 20 characters.", "error");
                return;
            }

            if (uploadedFilesStore.length === 0 && (!fileInput.files || fileInput.files.length === 0)) {
                e.preventDefault();
                showToast("Please select at least one PDF resume.", "error");
                return;
            }

            showLoadingOverlay(
                "Analyzing Resumes...",
                `Extracting entities, computing TF-IDF vectors, and ranking ${uploadedFilesStore.length || 'uploaded'} candidate(s)...`
            );
        });
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/* ==========================================================================
   3. RESULTS TABLE SEARCH, FILTER & SORT
   ========================================================================== */
function initResultsFilter() {
    const searchInput = document.getElementById('candidateSearch');
    const scoreSelect = document.getElementById('scoreFilterSelect');
    const sortSelect = document.getElementById('rankSortSelect');
    const tableBody = document.getElementById('candidateTableBody');
    const rows = tableBody ? Array.from(tableBody.querySelectorAll('.candidate-row')) : [];
    const countDisplay = document.getElementById('visibleCandidateCount');
    const emptyRow = document.getElementById('noResultsRow');

    if (!tableBody || rows.length === 0) return;

    let activeSkill = null;

    // Filter Pills
    const skillPills = document.querySelectorAll('.filter-skill-pill');
    skillPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const skill = pill.getAttribute('data-skill');
            if (activeSkill === skill) {
                activeSkill = null;
                pill.classList.remove('active');
            } else {
                skillPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeSkill = skill;
            }
            applyFilters();
        });
    });

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (scoreSelect) scoreSelect.addEventListener('change', applyFilters);
    if (sortSelect) sortSelect.addEventListener('change', applySort);

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const scoreFilter = scoreSelect ? scoreSelect.value : 'all';
        let visibleCount = 0;

        rows.forEach(row => {
            const name = row.getAttribute('data-name') || '';
            const email = row.getAttribute('data-email') || '';
            const score = parseFloat(row.getAttribute('data-score') || '0');
            const skills = (row.getAttribute('data-skills') || '').toLowerCase();

            // 1. Text Query
            const matchesText = !query || name.includes(query) || email.includes(query);

            // 2. Score Range
            let matchesScore = true;
            if (scoreFilter === 'strong') matchesScore = score >= 75;
            else if (scoreFilter === 'moderate') matchesScore = score >= 50 && score < 75;
            else if (scoreFilter === 'low') matchesScore = score < 50;

            // 3. Skill filter
            let matchesSkill = true;
            if (activeSkill) {
                matchesSkill = skills.includes(activeSkill.toLowerCase());
            }

            if (matchesText && matchesScore && matchesSkill) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        if (countDisplay) {
            countDisplay.textContent = visibleCount;
        }

        if (emptyRow) {
            emptyRow.style.display = visibleCount === 0 ? '' : 'none';
        }
    }

    function applySort() {
        const sortMode = sortSelect ? sortSelect.value : 'rank';
        const sorted = [...rows].sort((a, b) => {
            if (sortMode === 'score-desc') {
                return parseFloat(b.getAttribute('data-score')) - parseFloat(a.getAttribute('data-score'));
            } else if (sortMode === 'score-asc') {
                return parseFloat(a.getAttribute('data-score')) - parseFloat(b.getAttribute('data-score'));
            } else if (sortMode === 'name-asc') {
                return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
            } else if (sortMode === 'exp-desc') {
                return parseFloat(b.getAttribute('data-exp') || '0') - parseFloat(a.getAttribute('data-exp') || '0');
            }
            return parseInt(a.getAttribute('data-rank') || '0') - parseInt(b.getAttribute('data-rank') || '0');
        });

        sorted.forEach(row => tableBody.appendChild(row));
    }
}

/* ==========================================================================
   4. 1-CLICK SAMPLE DEMONSTRATION ENGINE
   ========================================================================== */
function initDemoTriggers() {
    const demoButtons = document.querySelectorAll('.btn-run-demo');
    demoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            runSampleEvaluation();
        });
    });
}

function runSampleEvaluation() {
    showLoadingOverlay(
        "Initializing Sample Evaluation...",
        "Generating realistic candidate PDF resumes and running NLP screening against Senior Python & AI Developer role..."
    );

    fetch('/api/load-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.redirect_url) {
            updateLoadingMessage("Ranking Candidates...", "Applying custom Merge Sort on candidate match vectors...");
            setTimeout(() => {
                window.location.href = data.redirect_url;
            }, 600);
        } else {
            hideLoadingOverlay();
            showToast(data.message || "Failed to load sample evaluation.", "error");
        }
    })
    .catch(err => {
        hideLoadingOverlay();
        showToast("Error executing demo: " + err.message, "error");
    });
}

/* ==========================================================================
   5. MODAL DIALOG CONTROLLERS (Delete Candidate, Delete Job, Reset DB)
   ========================================================================== */
let activeModalAction = null;

window.openConfirmModal = function(title, message, confirmBtnText, isDanger, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    const confirmBtn = document.getElementById('confirmModalSubmitBtn');

    confirmBtn.textContent = confirmBtnText || 'Confirm';
    confirmBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    activeModalAction = onConfirm;
    modal.classList.add('active');
    refreshIcons();
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('active');
    activeModalAction = null;
};

// Global confirm button listener
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'confirmModalSubmitBtn') {
        if (typeof activeModalAction === 'function') {
            activeModalAction();
        }
        closeConfirmModal();
    }
});

// API helper: Delete individual candidate
window.confirmDeleteCandidate = function(candId, candName) {
    openConfirmModal(
        "Delete Candidate Record",
        `Are you sure you want to delete ${candName || 'this candidate'} from this screening session? This action cannot be undone.`,
        "Delete Candidate",
        true,
        () => {
            fetch(`/api/delete-candidate/${candId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.reload();
                } else {
                    showToast(data.message || "Failed to delete candidate.", "error");
                }
            })
            .catch(err => showToast("Error: " + err.message, "error"));
        }
    );
};

// API helper: Delete screening session
window.confirmDeleteJob = function(jobId, jobTitle) {
    openConfirmModal(
        "Delete Screening Session",
        `Are you sure you want to delete "${jobTitle || 'this screening session'}" and all of its evaluated candidate records?`,
        "Delete Session",
        true,
        () => {
            fetch(`/api/delete-job/${jobId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    showToast(data.message || "Failed to delete session.", "error");
                }
            })
            .catch(err => showToast("Error: " + err.message, "error"));
        }
    );
};

// API helper: Clear all data
window.confirmClearAllData = function() {
    openConfirmModal(
        "Reset All Screening Data",
        "WARNING: This will permanently delete all jobs, candidates, and uploaded files from the SQLite database. Are you sure you want to reset?",
        "Reset All Data",
        true,
        () => {
            showLoadingOverlay("Resetting System Database...", "Clearing database tables and uploads folder...");
            fetch('/api/clear-data', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                hideLoadingOverlay();
                showToast("System database reset successfully.", "success");
                setTimeout(() => window.location.href = '/', 800);
            })
            .catch(err => {
                hideLoadingOverlay();
                showToast("Error: " + err.message, "error");
            });
        }
    );
};

/* ==========================================================================
   6. CLIENT-SIDE EXPORT (CSV & JSON)
   ========================================================================== */
window.exportResultsCSV = function(jobTitle) {
    const rows = Array.from(document.querySelectorAll('#candidateTableBody .candidate-row'));
    if (rows.length === 0) {
        showToast("No candidate records available to export.", "error");
        return;
    }

    const headers = ["Rank", "Candidate Name", "Email", "Phone", "Experience (Years)", "Match Score (%)", "Status", "Matched Skills", "Missing Skills"];
    const csvRows = [headers.join(',')];

    rows.forEach(r => {
        const rank = r.getAttribute('data-rank') || '';
        const name = `"${(r.getAttribute('data-name') || '').replace(/"/g, '""')}"`;
        const email = `"${(r.getAttribute('data-email') || '').replace(/"/g, '""')}"`;
        const phone = `"${(r.getAttribute('data-phone') || '').replace(/"/g, '""')}"`;
        const exp = r.getAttribute('data-exp') || '0';
        const score = r.getAttribute('data-score') || '0';
        const status = `"${(r.getAttribute('data-status') || '').replace(/"/g, '""')}"`;
        const matched = `"${(r.getAttribute('data-matched') || '').replace(/"/g, '""')}"`;
        const missing = `"${(r.getAttribute('data-missing') || '').replace(/"/g, '""')}"`;

        csvRows.push([rank, name, email, phone, exp, score, status, matched, missing].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResumeAI_${(jobTitle || 'Candidates').replace(/[^a-zA-Z0-9]/g, '_')}_Results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV report generated and downloaded.", "success");
};

window.exportResultsJSON = function(jobTitle) {
    const rows = Array.from(document.querySelectorAll('#candidateTableBody .candidate-row'));
    if (rows.length === 0) {
        showToast("No candidate records available to export.", "error");
        return;
    }

    const data = rows.map(r => ({
        rank: parseInt(r.getAttribute('data-rank') || '0'),
        name: r.getAttribute('data-name') || '',
        email: r.getAttribute('data-email') || '',
        phone: r.getAttribute('data-phone') || '',
        experience_years: parseFloat(r.getAttribute('data-exp') || '0'),
        match_score: parseFloat(r.getAttribute('data-score') || '0'),
        status: r.getAttribute('data-status') || '',
        matched_skills: (r.getAttribute('data-matched') || '').split(', ').filter(Boolean),
        missing_skills: (r.getAttribute('data-missing') || '').split(', ').filter(Boolean)
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResumeAI_${(jobTitle || 'Candidates').replace(/[^a-zA-Z0-9]/g, '_')}_Results.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON export generated and downloaded.", "success");
};

/* ==========================================================================
   7. UI HELPERS (Loading Overlay, Toasts, Escape)
   ========================================================================== */
function showLoadingOverlay(title, subtitle) {
    const overlay = document.getElementById('loadingOverlay');
    const t = document.getElementById('loadingTitle');
    const s = document.getElementById('loadingSubtitle');
    if (t && title) t.textContent = title;
    if (s && subtitle) s.textContent = subtitle;
    if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'flex';
    }
}

function updateLoadingMessage(title, subtitle) {
    const t = document.getElementById('loadingTitle');
    const s = document.getElementById('loadingSubtitle');
    if (t && title) t.textContent = title;
    if (s && subtitle) s.textContent = subtitle;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    const isSuccess = type === 'success';

    toast.style.cssText = `
        background: ${isError ? '#ef4444' : isSuccess ? '#10b981' : '#0f172a'};
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.86rem;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.25s ease;
        opacity: 0;
        transform: translateY(10px);
    `;

    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 250);
    }, 3800);
}

function initFlashAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.4s ease';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 400);
        }, 5000);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
