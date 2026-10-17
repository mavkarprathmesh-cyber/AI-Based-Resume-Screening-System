# AI Based Resume Screening System 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmavkarprathmesh-cyber%2FAI-Based-Resume-Screening-System)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/mavkarprathmesh-cyber/AI-Based-Resume-Screening-System)

**🌐 Live Demo Link:** [ai-based-resume-screening-system-prathmesh-mavkars-projects.vercel.app](https://ai-based-resume-screening-system-prathmesh-mavkars-projects.vercel.app) *(Deployed on Vercel)*

An AI-assisted web application developed for college mini-projects that streamlines and automates resume screening. The system analyzes multiple candidate resumes in PDF format against a provided Job Description using Natural Language Processing (NLP), evaluates candidates across four explainable weighted dimensions, and ranks them using deterministic Data Structures and Algorithms (DSA).

---

## 📌 1. Project Overview & Objective

Manual resume screening in technical recruitment is time-consuming and often biased. Recruiters often need to screen hundreds of resumes to identify candidates matching specific frameworks, programming languages, and experience criteria.

**Project Objective:**
- Automate resume text extraction directly from PDF documents.
- Process Job Descriptions (JD) and resumes using pure Natural Language Processing.
- Calculate an explainable **Match Score (0–100%)** combining Skill Match (50%), Experience (20%), Education (10%), and Semantic TF-IDF similarity (20%).
- Rank candidates deterministically using custom **Merge Sort** and **Max-Heap** algorithmic structures.
- Provide recruiters with an interactive leaderboard, live search/filtering tools, and in-depth candidate match reports.
- Run 100% locally and offline without external paid APIs.

---

## 🛠️ 2. Technology Stack

- **Backend:** Python 3 (Flask web framework)
- **PDF Extraction:** `pypdf`
- **Natural Language Processing:** Custom Python NLP Engine (Tokenization, Stopwords Removal, Skill Taxonomy Normalization, TF-IDF Vectorization, Cosine Similarity)
- **Data Structures & Algorithms:** Custom Python module (`algorithms.py`)
- **Database:** SQLite 3 (Relational persistence)
- **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Recruiter UI Design System), JavaScript (ES6)
- **Demo Data Generation:** `reportlab` (Automated generation of realistic PDF resumes)

---

## 🏗️ 3. System Architecture & Workflow

```
Recruiter Input
   ↓
[ Job Description & Title ]
   ↓
[ Upload Multiple PDF Resumes ]
   ↓
┌──────────────────────────────────────────────┐
│  1. PDF Text & Entity Parsing                │
│     (pypdf + Heuristic Regex Extractor)      │
├──────────────────────────────────────────────┤
│  2. NLP Processing & Skill Taxonomy          │
│     (Stopwords, Alias Mapping, TF-IDF Vector)│
├──────────────────────────────────────────────┤
│  3. Multi-Factor Scoring Engine              │
│     - Skill Match (50%)                      │
│     - Experience Match (20%)                 │
│     - Education Match (10%)                  │
│     - Semantic TF-IDF Similarity (20%)       │
├──────────────────────────────────────────────┤
│  4. Data Structures & Algorithms Module      │
│     - Merge Sort (O(N log N) Candidate Rank) │
│     - Max-Heap (Top Candidate Retrieval)     │
│     - Inverted Index (Skill-to-Candidate map)│
│     - Set Intersection (Skill Gap Analysis)  │
├──────────────────────────────────────────────┤
│  5. SQLite Relational Persistence            │
│     (resumes.db - jobs, candidates, skills)  │
└──────────────────────────────────────────────┘
   ↓
[ Interactive Recruiter Leaderboard & Reports ]
```

---

## 🧠 4. Core DSA Concepts Implemented (`algorithms.py`)

This project implements fundamental Data Structures and Algorithms manually to demonstrate academic rigor:

| Algorithm / Data Structure | Purpose in Project | Time Complexity |
| :--- | :--- | :--- |
| **Merge Sort** | Deterministic sorting of candidate match scores in descending order for the leaderboard | $O(N \log N)$ (Guaranteed, Stable) |
| **Quick Sort** | Alternative sorting partition algorithm for candidate names/scores | $O(N \log N)$ average |
| **Max-Heap (Priority Queue)** | Real-time extraction of Top-K highest matching candidates | $O(K \log N)$ |
| **Inverted Index (Hash Map)** | Maps detected skills to sets of candidate IDs for instant multi-skill queries | $O(1)$ lookup |
| **Binary Search** | Locates specific candidate records by name/ID in sorted collections | $O(\log N)$ |
| **Set Theory Operations** | Computes Matched Skills ($J \cap C$), Missing Skills ($J - C$), and Bonus Skills ($C - J$) | $O(S)$ where $S$ is skill count |

---

## 🤖 5. AI / NLP Techniques Implemented (`nlp_processor.py`)

1. **Text Preprocessing & Tokenization:**
   - Case normalization and punctuation stripping.
   - Stop-word filtering using a curated 150+ English NLP stopword dictionary.
2. **Skill Taxonomy & Normalization:**
   - 60+ canonical technologies mapped to aliases (e.g., `postgres` $\rightarrow$ `PostgreSQL`, `k8s` $\rightarrow$ `Kubernetes`, `ml` $\rightarrow$ `Machine Learning`).
3. **TF-IDF & Cosine Similarity:**
   - Computes Term Frequency ($TF(t, d) = \frac{f_{t,d}}{\sum f}$) and Inverse Document Frequency ($IDF(t) = \log\left(1 + \frac{N}{1 + DF_t}\right) + 1$).
   - Dot product Cosine Similarity $\text{Cosine}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$.
4. **Configurable Scoring Formula:**
   $$\text{Final Score} = (0.50 \times \text{Skill}) + (0.20 \times \text{Experience}) + (0.10 \times \text{Education}) + (0.20 \times \text{TF-IDF Similarity})$$
5. **Explainability Engine:**
   - Generates human-readable bullet points explaining the exact strengths and missing prerequisites for each applicant.

---

## 🗄️ 6. Database Schema (`database/resumes.db`)

- **`jobs`**: `id`, `job_title`, `job_description`, `required_skills`, `required_experience`, `created_at`
- **`candidates`**: `id`, `job_id`, `name`, `email`, `phone`, `education`, `experience_years`, `resume_filename`, `match_score`, `skill_score`, `exp_score`, `edu_score`, `tfidf_score`, `badge`, `matched_skills`, `missing_skills`, `additional_skills`, `explanations_json`, `raw_text`, `projects`, `certifications`, `created_at`
- **`candidate_skills`**: `id`, `candidate_id`, `skill_name`, `is_matched`
- **`screening_sessions`**: `id`, `job_id`, `total_resumes`, `avg_score`, `top_score`, `created_at`

---

## 💻 7. Installation & Setup Instructions

### Prerequisites
- Python 3.8+ installed on your system.

### Step 1: Clone or Open the Project Folder
```bash
cd "FAI Mini Project"
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the Application
```bash
python app.py
```

### Step 4: Open in Web Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🌟 8. Quick 1-Click Demonstration Guide

For practical project evaluation or college demonstrations:
1. Open `http://127.0.0.1:5000`.
2. Click the **"1-Click Demo"** button on the top navigation bar or landing page.
3. The system will automatically:
   - Generate 5 distinct, realistic PDF resumes across different experience levels (Senior ML Engineer, Data Scientist, Fullstack Developer, Fresher Data Analyst, DevOps Engineer).
   - Screen them against a "Senior Python & AI Developer" job description.
   - Execute the NLP and Merge Sort algorithms.
   - Display the ranked leaderboard with score badges and in-depth candidate reports!

---

## 🔒 9. Security & Error Handling

- **File Validation:** Strictly restricts uploads to `.pdf` extension and validates PDF structure.
- **Payload Limits:** Maximum 16 MB request limit to prevent memory exhaustion.
- **Secure File Handling:** Sanitizes uploaded filenames via `werkzeug.utils.secure_filename`.
- **Safe Fallbacks:** When information is missing in a resume, displays `"Not Available"` rather than hallucinating fake data.
- **Offline Security:** Operates 100% locally with zero external network dependencies.

---

## 🔮 10. Limitations & Future Scope

- **Limitations:** Currently processes text-based PDF resumes (does not perform OCR on scanned image-only PDFs).
- **Future Scope:**
  - Optical Character Recognition (OCR) support for scanned image resumes via Tesseract.
  - Automated interview question generation based on missing skills.
  - Support for `.docx` and `.txt` resume formats.
