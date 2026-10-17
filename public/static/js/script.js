/**
 * AI-Based Resume Screening System - Interactive Client Scripts
 */

// Selected files store
let selectedFilesList = [];
let activeSkillFilters = new Set();

// ==========================================
// 1. DRAG AND DROP & FILE UPLOAD HANDLING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            const fileInput = document.getElementById('resumesInput');
            if (fileInput && files.length > 0) {
                fileInput.files = files;
                handleFileSelect(files);
            }
        }, false);
    }
});

function handleFileSelect(files) {
    const container = document.getElementById('fileListContainer');
    const itemsList = document.getElementById('fileItemsList');
    const countBadge = document.getElementById('fileCountBadge');

    if (!files || files.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }

    selectedFilesList = Array.from(files);
    let validPdfCount = 0;
    itemsList.innerHTML = '';

    selectedFilesList.forEach((file, index) => {
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) validPdfCount++;

        const sizeKb = Math.round(file.size / 1024);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'file-item-chip';
        itemDiv.innerHTML = `
            <span>
                <i class="fa-solid fa-file-pdf ${isPdf ? 'text-danger' : 'text-muted'}"></i> 
                <strong>${file.name}</strong> (${sizeKb} KB)
                ${!isPdf ? '<span class="text-danger font-semibold ml-1">[Invalid: PDF required]</span>' : ''}
            </span>
        `;
        itemsList.appendChild(itemDiv);
    });

    countBadge.textContent = `${validPdfCount} PDF file(s) selected`;
    container.style.display = 'block';
}

function clearSelectedFiles() {
    const fileInput = document.getElementById('resumesInput');
    const container = document.getElementById('fileListContainer');
    if (fileInput) fileInput.value = '';
    selectedFilesList = [];
    if (container) container.style.display = 'none';
}

function handleFormSubmit(e) {
    const fileInput = document.getElementById('resumesInput');
    const jdInput = document.getElementById('job_description');

    if (!jdInput || !jdInput.value.trim()) {
        alert("Please enter a Job Description before proceeding.");
        return false;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please select at least one PDF resume to screen.");
        return false;
    }

    // Show loading overlay
    showLoading("Extracting & Scoring Resumes...", "Running PDF text extraction, TF-IDF cosine matching, and Merge Sort ranking.");
    return true;
}

// ==========================================
// 2. 1-CLICK DEMO & SAMPLE LOADER
// ==========================================

function triggerSampleDemo() {
    showLoading("Generating Demonstration Resumes...", "Creating 5 sample PDF candidate profiles across different experience tiers and executing AI ranking.");
    
    fetch('/api/load-sample', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = data.redirect_url;
        } else {
            hideLoading();
            alert("Demo error: " + data.message);
        }
    })
    .catch(err => {
        hideLoading();
        alert("Failed to load demo: " + err);
    });
}

function fillSampleJobData() {
    const titleInput = document.getElementById('job_title');
    const jdInput = document.getElementById('job_description');

    if (titleInput) titleInput.value = "Senior Python & AI Developer";
    if (jdInput) {
        jdInput.value = `We are seeking a Senior Python & AI Developer with 3+ years of experience in building scalable backend systems and machine learning workflows.

Key Requirements:
- Strong proficiency in Python, SQL, and REST API development with Flask or FastAPI.
- Hands-on experience with Machine Learning libraries including Pandas, NumPy, Scikit-Learn, and NLP.
- Practical knowledge of PostgreSQL, SQLite, and Docker for containerized deployment.
- Experience with Git version control, Unit Testing, and Agile practices.
- Education: Bachelor's degree (B.Tech / B.E. / B.Sc) or Master's in Computer Science, Data Science, or related discipline.`;
    }
}

function confirmClearData() {
    if (confirm("Are you sure you want to reset all stored screening sessions and resume data?")) {
        showLoading("Resetting Database...", "Clearing stored candidates, jobs, and upload cache.");
        fetch('/api/clear-data', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                window.location.href = '/';
            })
            .catch(err => {
                hideLoading();
                alert("Failed to reset: " + err);
            });
    }
}

// ==========================================
// 3. RESULTS TABLE SEARCH, FILTER & SORT
// ==========================================

function filterCandidatesTable() {
    const searchInput = document.getElementById('candidateSearchInput');
    const scoreFilter = document.getElementById('scoreFilter');
    const tableBody = document.getElementById('candidatesTableBody');
    const countBadge = document.getElementById('filteredCountBadge');

    if (!tableBody) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const minScore = scoreFilter ? parseFloat(scoreFilter.value) || 0 : 0;
    const rows = tableBody.getElementsByClassName('candidate-row');

    let visibleCount = 0;

    Array.from(rows).forEach(row => {
        const name = row.getAttribute('data-name') || '';
        const email = row.getAttribute('data-email') || '';
        const skills = row.getAttribute('data-skills') || '';
        const score = parseFloat(row.getAttribute('data-score')) || 0;

        // Search Match
        const matchesQuery = !query || name.includes(query) || email.includes(query) || skills.includes(query);

        // Score Threshold Match
        const matchesScore = score >= minScore;

        // Skill Pill Filters Match
        let matchesSkillPills = true;
        if (activeSkillFilters.size > 0) {
            matchesSkillPills = Array.from(activeSkillFilters).every(skill => skills.includes(skill));
        }

        if (matchesQuery && matchesScore && matchesSkillPills) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    if (countBadge) {
        countBadge.textContent = `Showing ${visibleCount} candidate(s)`;
    }
}

function sortCandidatesTable() {
    const sortSelector = document.getElementById('sortSelector');
    const tableBody = document.getElementById('candidatesTableBody');
    if (!sortSelector || !tableBody) return;

    const mode = sortSelector.value;
    const rows = Array.from(tableBody.getElementsByClassName('candidate-row'));

    rows.sort((a, b) => {
        const scoreA = parseFloat(a.getAttribute('data-score')) || 0;
        const scoreB = parseFloat(b.getAttribute('data-score')) || 0;
        const nameA = (a.getAttribute('data-name') || '').toLowerCase();
        const nameB = (b.getAttribute('data-name') || '').toLowerCase();

        if (mode === 'score_desc') return scoreB - scoreA;
        if (mode === 'score_asc') return scoreA - scoreB;
        if (mode === 'name_asc') return nameA.localeCompare(nameB);
        return 0;
    });

    rows.forEach(row => tableBody.appendChild(row));
}

function toggleSkillFilter(btn, skill) {
    if (activeSkillFilters.has(skill)) {
        activeSkillFilters.delete(skill);
        btn.classList.remove('active');
    } else {
        activeSkillFilters.add(skill);
        btn.classList.add('active');
    }
    filterCandidatesTable();
}

// ==========================================
// 4. DELETION ACTIONS
// ==========================================

function deleteCandidate(candidateId) {
    if (confirm("Are you sure you want to remove this candidate from the screening leaderboard?")) {
        fetch(`/api/delete-candidate/${candidateId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.reload();
                } else {
                    alert("Error: " + data.message);
                }
            });
    }
}

function deleteJob(jobId) {
    if (confirm("Are you sure you want to delete this entire job session and all linked candidates?")) {
        fetch(`/api/delete-job/${jobId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.reload();
                }
            });
    }
}

// ==========================================
// 5. LOADING OVERLAY HELPERS
// ==========================================

function showLoading(title, subtitle) {
    const overlay = document.getElementById('loadingOverlay');
    const titleEl = document.getElementById('loadingTitle');
    const subEl = document.getElementById('loadingSubtitle');

    if (titleEl && title) titleEl.textContent = title;
    if (subEl && subtitle) subEl.textContent = subtitle;
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}
