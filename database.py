"""
Database Module for SQLite Persistence.

Stores:
- Jobs and requirements
- Candidate parsed details, scores, and match explanations
- Skill mappings for indexed queries
- Screening history sessions
"""

import sqlite3
import os
import json
from typing import Dict, List, Any, Optional

if os.environ.get("VERCEL"):
    DB_DIR = "/tmp/database"
    DB_PATH = os.path.join(DB_DIR, "resumes.db")
    src_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database", "resumes.db")
    if not os.path.exists(DB_PATH) and os.path.exists(src_db):
        import shutil
        os.makedirs(DB_DIR, exist_ok=True)
        shutil.copy2(src_db, DB_PATH)
else:
    DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database")
    DB_PATH = os.path.join(DB_DIR, "resumes.db")


def get_db_connection() -> sqlite3.Connection:
    """Creates a connection to the SQLite database with Row factory."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Jobs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_title TEXT NOT NULL,
            job_description TEXT NOT NULL,
            required_skills TEXT,
            required_experience REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Candidates Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            education TEXT,
            experience_years REAL DEFAULT 0,
            resume_filename TEXT,
            match_score REAL DEFAULT 0,
            skill_score REAL DEFAULT 0,
            exp_score REAL DEFAULT 0,
            edu_score REAL DEFAULT 0,
            tfidf_score REAL DEFAULT 0,
            badge TEXT,
            badge_class TEXT,
            matched_skills TEXT,
            missing_skills TEXT,
            additional_skills TEXT,
            explanations_json TEXT,
            raw_text TEXT,
            projects TEXT,
            certifications TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
        )
    """)

    # 3. Candidate Skills Relational Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidate_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER,
            skill_name TEXT NOT NULL,
            is_matched INTEGER DEFAULT 0,
            FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
        )
    """)

    # 4. Screening Sessions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS screening_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            total_resumes INTEGER DEFAULT 0,
            avg_score REAL DEFAULT 0,
            top_score REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


def save_job(job_title: str, job_description: str, required_skills: List[str], required_experience: float) -> int:
    """Inserts a new job record and returns its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO jobs (job_title, job_description, required_skills, required_experience)
        VALUES (?, ?, ?, ?)
    """, (
        job_title,
        job_description,
        json.dumps(required_skills),
        required_experience
    ))
    job_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return job_id


def save_candidate(job_id: int, parsed_resume: Dict[str, Any], match_results: Dict[str, Any]) -> int:
    """Inserts a candidate and their skill associations."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO candidates (
            job_id, name, email, phone, education, experience_years,
            resume_filename, match_score, skill_score, exp_score,
            edu_score, tfidf_score, badge, badge_class,
            matched_skills, missing_skills, additional_skills,
            explanations_json, raw_text, projects, certifications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_id,
        parsed_resume.get("name", "Not Available"),
        parsed_resume.get("email", "Not Available"),
        parsed_resume.get("phone", "Not Available"),
        parsed_resume.get("education", "Not Available"),
        parsed_resume.get("experience_years", 0.0),
        parsed_resume.get("resume_filename", ""),
        match_results.get("final_score", 0.0),
        match_results.get("skill_score", 0.0),
        match_results.get("exp_score", 0.0),
        match_results.get("edu_score", 0.0),
        match_results.get("tfidf_score", 0.0),
        match_results.get("badge", "Moderate Match"),
        match_results.get("badge_class", "badge-moderate"),
        json.dumps(match_results.get("matched_skills", [])),
        json.dumps(match_results.get("missing_skills", [])),
        json.dumps(match_results.get("additional_skills", [])),
        json.dumps(match_results.get("explanations", [])),
        parsed_resume.get("raw_text", ""),
        parsed_resume.get("projects", "Not Available"),
        parsed_resume.get("certifications", "Not Available")
    ))
    candidate_id = cursor.lastrowid

    # Insert individual skill records
    matched_set = set(s.lower() for s in match_results.get("matched_skills", []))
    for skill in parsed_resume.get("skills", []):
        is_matched = 1 if skill.lower() in matched_set else 0
        cursor.execute("""
            INSERT INTO candidate_skills (candidate_id, skill_name, is_matched)
            VALUES (?, ?, ?)
        """, (candidate_id, skill, is_matched))

    conn.commit()
    conn.close()
    return candidate_id


def save_session(job_id: int, total_resumes: int, avg_score: float, top_score: float) -> int:
    """Records a summary screening session."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO screening_sessions (job_id, total_resumes, avg_score, top_score)
        VALUES (?, ?, ?, ?)
    """, (job_id, total_resumes, avg_score, top_score))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id


def get_job(job_id: int) -> Optional[Dict[str, Any]]:
    """Fetches job record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    res["required_skills"] = json.loads(res["required_skills"]) if res["required_skills"] else []
    return res


def get_all_jobs() -> List[Dict[str, Any]]:
    """Returns list of all historical jobs with candidate count."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT j.*, COUNT(c.id) as candidate_count, MAX(c.match_score) as top_score, AVG(c.match_score) as avg_score
        FROM jobs j
        LEFT JOIN candidates c ON j.id = c.job_id
        GROUP BY j.id
        ORDER BY j.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    jobs = []
    for r in rows:
        d = dict(r)
        d["required_skills"] = json.loads(d["required_skills"]) if d["required_skills"] else []
        d["avg_score"] = round(d["avg_score"], 1) if d["avg_score"] is not None else 0.0
        d["top_score"] = round(d["top_score"], 1) if d["top_score"] is not None else 0.0
        jobs.append(d)
    return jobs


def get_candidates_for_job(job_id: int) -> List[Dict[str, Any]]:
    """Returns all candidates evaluated for a specific job."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE job_id = ? ORDER BY match_score DESC", (job_id,))
    rows = cursor.fetchall()
    conn.close()
    candidates = []
    for r in rows:
        d = dict(r)
        d["matched_skills"] = json.loads(d["matched_skills"]) if d["matched_skills"] else []
        d["missing_skills"] = json.loads(d["missing_skills"]) if d["missing_skills"] else []
        d["additional_skills"] = json.loads(d["additional_skills"]) if d["additional_skills"] else []
        d["explanations"] = json.loads(d["explanations_json"]) if d["explanations_json"] else []
        d["skills"] = d["matched_skills"] + d["additional_skills"]
        candidates.append(d)
    return candidates


def get_candidate_by_id(candidate_id: int) -> Optional[Dict[str, Any]]:
    """Fetches full candidate profile by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["matched_skills"] = json.loads(d["matched_skills"]) if d["matched_skills"] else []
    d["missing_skills"] = json.loads(d["missing_skills"]) if d["missing_skills"] else []
    d["additional_skills"] = json.loads(d["additional_skills"]) if d["additional_skills"] else []
    d["explanations"] = json.loads(d["explanations_json"]) if d["explanations_json"] else []
    d["skills"] = d["matched_skills"] + d["additional_skills"]
    return d


def delete_candidate(candidate_id: int) -> bool:
    """Deletes a candidate record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
    cursor.execute("DELETE FROM candidate_skills WHERE candidate_id = ?", (candidate_id,))
    conn.commit()
    conn.close()
    return True


def delete_job(job_id: int) -> bool:
    """Deletes a job and all linked candidates."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM candidates WHERE job_id = ?", (job_id,))
    cursor.execute("DELETE FROM screening_sessions WHERE job_id = ?", (job_id,))
    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()
    return True


def clear_all_data() -> bool:
    """Resets the entire database for a fresh demonstration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM candidate_skills")
    cursor.execute("DELETE FROM candidates")
    cursor.execute("DELETE FROM screening_sessions")
    cursor.execute("DELETE FROM jobs")
    conn.commit()
    conn.close()
    return True
