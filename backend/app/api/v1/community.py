# @AI-HINT: Community Hub API - Q&A, Playbooks, Office Hours for freelancer community
"""
Community Hub API
Enables community-driven learning and collaboration through:
- Q&A StackOverflow-style questions and answers
- Playbooks - curated guides by top freelancers
- Office Hours - scheduled AMA/consultation sessions
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import json
import logging

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Pydantic Models ====================

# Q&A Models
class QuestionCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    content: str = Field(..., min_length=30, max_length=10000)
    tags: List[str] = Field(default=[], max_length=5)
    category: Optional[str] = Field(None, max_length=50)


class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    content: Optional[str] = Field(None, min_length=30, max_length=10000)
    tags: Optional[List[str]] = Field(None, max_length=5)


class AnswerCreate(BaseModel):
    content: str = Field(..., min_length=30, max_length=10000)


class AnswerUpdate(BaseModel):
    content: str = Field(..., min_length=30, max_length=10000)


class VoteCreate(BaseModel):
    vote_type: str = Field(..., pattern="^(upvote|downvote)$")


# Playbook Models
class PlaybookCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    description: str = Field(..., min_length=50, max_length=1000)
    content: str = Field(..., min_length=100, max_length=50000)
    category: str = Field(..., max_length=50)
    tags: List[str] = Field(default=[], max_length=10)
    difficulty_level: str = Field("intermediate", pattern="^(beginner|intermediate|advanced|expert)$")


class PlaybookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=1000)
    content: Optional[str] = Field(None, min_length=100, max_length=50000)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = Field(None, max_length=10)
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced|expert)$")


# Office Hours Models
class OfficeHoursCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    description: str = Field(..., min_length=50, max_length=2000)
    scheduled_at: datetime
    duration_minutes: int = Field(60, ge=15, le=180)
    max_attendees: int = Field(50, ge=1, le=500)
    category: Optional[str] = Field(None, max_length=50)
    is_public: bool = True


class OfficeHoursUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=2000)
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    max_attendees: Optional[int] = Field(None, ge=1, le=500)
    is_public: Optional[bool] = None


# ==================== Helper Functions ====================

def _get_val(row: list, idx: int):
    """Extract value from database row"""
    if idx >= len(row):
        return None
    cell = row[idx]
    if isinstance(cell, dict):
        if cell.get("type") == "null":
            return None
        return cell.get("value")
    return cell


def _ensure_community_tables():
    """Create community tables if they don't exist"""
    # Questions table
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT,
            category TEXT,
            status TEXT DEFAULT 'open',
            view_count INTEGER DEFAULT 0,
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            answer_count INTEGER DEFAULT 0,
            accepted_answer_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])
    
    # Answers table
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            is_accepted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES community_questions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])
    
    # Votes table
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            vote_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, target_type, target_id)
        )
    """, [])
    
    # Playbooks table
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_playbooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT,
            difficulty_level TEXT DEFAULT 'intermediate',
            status TEXT DEFAULT 'draft',
            view_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            bookmark_count INTEGER DEFAULT 0,
            published_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
    """, [])
    
    # Office Hours table
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_office_hours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            host_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 60,
            max_attendees INTEGER DEFAULT 50,
            category TEXT,
            status TEXT DEFAULT 'scheduled',
            is_public INTEGER DEFAULT 1,
            recording_url TEXT,
            attendee_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (host_id) REFERENCES users(id)
        )
    """, [])
    
    # Office Hours Registrations
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_oh_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_hours_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            registered_at TEXT NOT NULL,
            attended INTEGER DEFAULT 0,
            UNIQUE(office_hours_id, user_id),
            FOREIGN KEY (office_hours_id) REFERENCES community_office_hours(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])


# Initialize tables on module load
try:
    _ensure_community_tables()
except Exception as e:
    logger.warning(f"Could not initialize community tables: {e}")


# ==================== Q&A Endpoints ====================

@router.post("/questions", status_code=status.HTTP_201_CREATED)
async def create_question(
    question: QuestionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new community question."""
    now = datetime.utcnow().isoformat()
    tags_json = json.dumps(question.tags) if question.tags else "[]"
    
    execute_query("""
        INSERT INTO community_questions (user_id, title, content, tags, category, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
    """, [current_user.id, question.title, question.content, tags_json, question.category, now, now])
    
    # Get created question
    result = execute_query("""
        SELECT q.id, q.user_id, u.full_name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.user_id = ? ORDER BY q.id DESC LIMIT 1
    """, [current_user.id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to create question")
    
    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "user_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "content": _get_val(row, 4),
        "tags": json.loads(_get_val(row, 5) or "[]"),
        "category": _get_val(row, 6),
        "status": _get_val(row, 7),
        "view_count": _get_val(row, 8) or 0,
        "upvotes": _get_val(row, 9) or 0,
        "downvotes": _get_val(row, 10) or 0,
        "answer_count": _get_val(row, 11) or 0,
        "accepted_answer_id": _get_val(row, 12),
        "created_at": _get_val(row, 13),
        "updated_at": _get_val(row, 14)
    }


@router.get("/questions")
async def list_questions(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(open|closed|answered)$"),
    sort_by: str = Query("recent", pattern="^(recent|popular|unanswered)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """List community questions with filters."""
    sql = """
        SELECT q.id, q.user_id, u.full_name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if category:
        sql += " AND q.category = ?"
        params.append(category)
    
    if tag:
        sql += " AND q.tags LIKE ?"
        params.append(f"%{tag}%")
    
    if status_filter:
        sql += " AND q.status = ?"
        params.append(status_filter)
    
    # Sorting
    if sort_by == "popular":
        sql += " ORDER BY (q.upvotes - q.downvotes) DESC, q.view_count DESC"
    elif sort_by == "unanswered":
        sql += " AND q.answer_count = 0 ORDER BY q.created_at DESC"
    else:  # recent
        sql += " ORDER BY q.created_at DESC"
    
    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = execute_query(sql, params)
    
    questions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            questions.append({
                "id": _get_val(row, 0),
                "user_id": _get_val(row, 1),
                "author_name": _get_val(row, 2),
                "title": _get_val(row, 3),
                "content": _get_val(row, 4)[:300] + "..." if len(_get_val(row, 4) or "") > 300 else _get_val(row, 4),
                "tags": json.loads(_get_val(row, 5) or "[]"),
                "category": _get_val(row, 6),
                "status": _get_val(row, 7),
                "view_count": _get_val(row, 8) or 0,
                "upvotes": _get_val(row, 9) or 0,
                "downvotes": _get_val(row, 10) or 0,
                "answer_count": _get_val(row, 11) or 0,
                "has_accepted_answer": _get_val(row, 12) is not None,
                "created_at": _get_val(row, 13)
            })
    
    return {"questions": questions, "total": len(questions)}


@router.get("/questions/{question_id}")
async def get_question(question_id: int):
    """Get a specific question with its answers."""
    # Increment view count
    execute_query("UPDATE community_questions SET view_count = view_count + 1 WHERE id = ?", [question_id])
    
    # Get question
    result = execute_query("""
        SELECT q.id, q.user_id, u.full_name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = ?
    """, [question_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Question not found")
    
    row = result["rows"][0]
    question = {
        "id": _get_val(row, 0),
        "user_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "content": _get_val(row, 4),
        "tags": json.loads(_get_val(row, 5) or "[]"),
        "category": _get_val(row, 6),
        "status": _get_val(row, 7),
        "view_count": _get_val(row, 8) or 0,
        "upvotes": _get_val(row, 9) or 0,
        "downvotes": _get_val(row, 10) or 0,
        "answer_count": _get_val(row, 11) or 0,
        "accepted_answer_id": _get_val(row, 12),
        "created_at": _get_val(row, 13),
        "updated_at": _get_val(row, 14)
    }
    
    # Get answers
    answers_result = execute_query("""
        SELECT a.id, a.user_id, u.full_name, a.content, a.upvotes, a.downvotes,
               a.is_accepted, a.created_at, a.updated_at
        FROM community_answers a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.question_id = ?
        ORDER BY a.is_accepted DESC, (a.upvotes - a.downvotes) DESC, a.created_at ASC
    """, [question_id])
    
    answers = []
    if answers_result and answers_result.get("rows"):
        for arow in answers_result["rows"]:
            answers.append({
                "id": _get_val(arow, 0),
                "user_id": _get_val(arow, 1),
                "author_name": _get_val(arow, 2),
                "content": _get_val(arow, 3),
                "upvotes": _get_val(arow, 4) or 0,
                "downvotes": _get_val(arow, 5) or 0,
                "is_accepted": bool(_get_val(arow, 6)),
                "created_at": _get_val(arow, 7),
                "updated_at": _get_val(arow, 8)
            })
    
    question["answers"] = answers
    return question


@router.post("/questions/{question_id}/answers", status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: int,
    answer: AnswerCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Submit an answer to a question."""
    # Check question exists
    result = execute_query("SELECT id FROM community_questions WHERE id = ?", [question_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Question not found")
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        INSERT INTO community_answers (question_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, [question_id, current_user.id, answer.content, now, now])
    
    # Update answer count
    execute_query("""
        UPDATE community_questions SET answer_count = answer_count + 1, updated_at = ? WHERE id = ?
    """, [now, question_id])
    
    return {"message": "Answer submitted successfully"}


@router.post("/questions/{question_id}/vote")
async def vote_question(
    question_id: int,
    vote: VoteCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Vote on a question."""
    now = datetime.utcnow().isoformat()
    
    # Check existing vote
    existing = execute_query("""
        SELECT id, vote_type FROM community_votes 
        WHERE user_id = ? AND target_type = 'question' AND target_id = ?
    """, [current_user.id, question_id])
    
    if existing and existing.get("rows"):
        old_vote = _get_val(existing["rows"][0], 1)
        if old_vote == vote.vote_type:
            # Remove vote
            execute_query("""
                DELETE FROM community_votes WHERE user_id = ? AND target_type = 'question' AND target_id = ?
            """, [current_user.id, question_id])
            
            if vote.vote_type == "upvote":
                execute_query("UPDATE community_questions SET upvotes = upvotes - 1 WHERE id = ?", [question_id])
            else:
                execute_query("UPDATE community_questions SET downvotes = downvotes - 1 WHERE id = ?", [question_id])
            
            return {"message": "Vote removed"}
        else:
            # Change vote
            execute_query("""
                UPDATE community_votes SET vote_type = ?, created_at = ? 
                WHERE user_id = ? AND target_type = 'question' AND target_id = ?
            """, [vote.vote_type, now, current_user.id, question_id])
            
            if vote.vote_type == "upvote":
                execute_query("UPDATE community_questions SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", [question_id])
            else:
                execute_query("UPDATE community_questions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?", [question_id])
            
            return {"message": "Vote changed"}
    else:
        # New vote
        execute_query("""
            INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
            VALUES (?, 'question', ?, ?, ?)
        """, [current_user.id, question_id, vote.vote_type, now])
        
        if vote.vote_type == "upvote":
            execute_query("UPDATE community_questions SET upvotes = upvotes + 1 WHERE id = ?", [question_id])
        else:
            execute_query("UPDATE community_questions SET downvotes = downvotes + 1 WHERE id = ?", [question_id])
        
        return {"message": "Vote recorded"}


@router.post("/answers/{answer_id}/accept")
async def accept_answer(
    answer_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Accept an answer (only question author can do this)."""
    # Get answer and question
    result = execute_query("""
        SELECT a.question_id, q.user_id
        FROM community_answers a
        JOIN community_questions q ON a.question_id = q.id
        WHERE a.id = ?
    """, [answer_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Answer not found")
    
    row = result["rows"][0]
    question_id = _get_val(row, 0)
    question_author = _get_val(row, 1)
    
    if current_user.id != question_author:
        raise HTTPException(status_code=403, detail="Only the question author can accept answers")
    
    now = datetime.utcnow().isoformat()
    
    # Unaccept any previously accepted answer
    execute_query("UPDATE community_answers SET is_accepted = 0 WHERE question_id = ?", [question_id])
    
    # Accept this answer
    execute_query("UPDATE community_answers SET is_accepted = 1, updated_at = ? WHERE id = ?", [now, answer_id])
    
    # Update question
    execute_query("""
        UPDATE community_questions SET accepted_answer_id = ?, status = 'answered', updated_at = ? WHERE id = ?
    """, [answer_id, now, question_id])
    
    return {"message": "Answer accepted"}


# ==================== Playbook Endpoints ====================

@router.post("/playbooks", status_code=status.HTTP_201_CREATED)
async def create_playbook(
    playbook: PlaybookCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new playbook (guide/tutorial)."""
    now = datetime.utcnow().isoformat()
    tags_json = json.dumps(playbook.tags) if playbook.tags else "[]"
    
    execute_query("""
        INSERT INTO community_playbooks (author_id, title, description, content, category, tags, difficulty_level, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    """, [current_user.id, playbook.title, playbook.description, playbook.content, 
          playbook.category, tags_json, playbook.difficulty_level, now, now])
    
    return {"message": "Playbook created as draft. Submit for review to publish."}


@router.get("/playbooks")
async def list_playbooks(
    category: Optional[str] = None,
    difficulty: Optional[str] = Query(None, pattern="^(beginner|intermediate|advanced|expert)$"),
    author_id: Optional[int] = None,
    status_filter: Optional[str] = Query("published", alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """List published playbooks."""
    sql = """
        SELECT p.id, p.author_id, u.full_name, p.title, p.description, p.category,
               p.tags, p.difficulty_level, p.view_count, p.like_count, p.bookmark_count,
               p.published_at, p.created_at
        FROM community_playbooks p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = ?
    """
    params = [status_filter]
    
    if category:
        sql += " AND p.category = ?"
        params.append(category)
    
    if difficulty:
        sql += " AND p.difficulty_level = ?"
        params.append(difficulty)
    
    if author_id:
        sql += " AND p.author_id = ?"
        params.append(author_id)
    
    sql += " ORDER BY p.like_count DESC, p.view_count DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = execute_query(sql, params)
    
    playbooks = []
    if result and result.get("rows"):
        for row in result["rows"]:
            playbooks.append({
                "id": _get_val(row, 0),
                "author_id": _get_val(row, 1),
                "author_name": _get_val(row, 2),
                "title": _get_val(row, 3),
                "description": _get_val(row, 4),
                "category": _get_val(row, 5),
                "tags": json.loads(_get_val(row, 6) or "[]"),
                "difficulty_level": _get_val(row, 7),
                "view_count": _get_val(row, 8) or 0,
                "like_count": _get_val(row, 9) or 0,
                "bookmark_count": _get_val(row, 10) or 0,
                "published_at": _get_val(row, 11),
                "created_at": _get_val(row, 12)
            })
    
    return {"playbooks": playbooks, "total": len(playbooks)}


@router.get("/playbooks/{playbook_id}")
async def get_playbook(playbook_id: int):
    """Get a specific playbook with full content."""
    # Increment view count
    execute_query("UPDATE community_playbooks SET view_count = view_count + 1 WHERE id = ?", [playbook_id])
    
    result = execute_query("""
        SELECT p.id, p.author_id, u.full_name, p.title, p.description, p.content, p.category,
               p.tags, p.difficulty_level, p.status, p.view_count, p.like_count, p.bookmark_count,
               p.published_at, p.created_at, p.updated_at
        FROM community_playbooks p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
    """, [playbook_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "author_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "content": _get_val(row, 5),
        "category": _get_val(row, 6),
        "tags": json.loads(_get_val(row, 7) or "[]"),
        "difficulty_level": _get_val(row, 8),
        "status": _get_val(row, 9),
        "view_count": _get_val(row, 10) or 0,
        "like_count": _get_val(row, 11) or 0,
        "bookmark_count": _get_val(row, 12) or 0,
        "published_at": _get_val(row, 13),
        "created_at": _get_val(row, 14),
        "updated_at": _get_val(row, 15)
    }


@router.post("/playbooks/{playbook_id}/publish")
async def publish_playbook(
    playbook_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Publish a draft playbook."""
    result = execute_query("SELECT author_id, status FROM community_playbooks WHERE id = ?", [playbook_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    row = result["rows"][0]
    if _get_val(row, 0) != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can publish this playbook")
    
    if _get_val(row, 1) == "published":
        raise HTTPException(status_code=400, detail="Playbook is already published")
    
    now = datetime.utcnow().isoformat()
    execute_query("""
        UPDATE community_playbooks SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?
    """, [now, now, playbook_id])
    
    return {"message": "Playbook published successfully"}


@router.post("/playbooks/{playbook_id}/like")
async def like_playbook(
    playbook_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Like or unlike a playbook."""
    now = datetime.utcnow().isoformat()
    
    existing = execute_query("""
        SELECT id FROM community_votes WHERE user_id = ? AND target_type = 'playbook' AND target_id = ?
    """, [current_user.id, playbook_id])
    
    if existing and existing.get("rows"):
        # Unlike
        execute_query("""
            DELETE FROM community_votes WHERE user_id = ? AND target_type = 'playbook' AND target_id = ?
        """, [current_user.id, playbook_id])
        execute_query("UPDATE community_playbooks SET like_count = like_count - 1 WHERE id = ?", [playbook_id])
        return {"message": "Like removed", "liked": False}
    else:
        # Like
        execute_query("""
            INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
            VALUES (?, 'playbook', ?, 'like', ?)
        """, [current_user.id, playbook_id, now])
        execute_query("UPDATE community_playbooks SET like_count = like_count + 1 WHERE id = ?", [playbook_id])
        return {"message": "Playbook liked", "liked": True}


# ==================== Office Hours Endpoints ====================

@router.post("/office-hours", status_code=status.HTTP_201_CREATED)
async def create_office_hours(
    oh: OfficeHoursCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Schedule an office hours session."""
    if oh.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Office hours must be scheduled in the future")
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        INSERT INTO community_office_hours (host_id, title, description, scheduled_at, duration_minutes, 
                                            max_attendees, category, is_public, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    """, [current_user.id, oh.title, oh.description, oh.scheduled_at.isoformat(), 
          oh.duration_minutes, oh.max_attendees, oh.category, 1 if oh.is_public else 0, now, now])
    
    return {"message": "Office hours scheduled successfully"}


@router.get("/office-hours")
async def list_office_hours(
    status_filter: Optional[str] = Query("upcoming", alias="status", pattern="^(upcoming|past|all)$"),
    host_id: Optional[int] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """List office hours sessions."""
    now = datetime.utcnow().isoformat()
    
    sql = """
        SELECT oh.id, oh.host_id, u.full_name, oh.title, oh.description, oh.scheduled_at,
               oh.duration_minutes, oh.max_attendees, oh.category, oh.status, oh.is_public,
               oh.attendee_count, oh.created_at
        FROM community_office_hours oh
        LEFT JOIN users u ON oh.host_id = u.id
        WHERE oh.is_public = 1
    """
    params = []
    
    if status_filter == "upcoming":
        sql += " AND oh.scheduled_at > ? AND oh.status = 'scheduled'"
        params.append(now)
    elif status_filter == "past":
        sql += " AND (oh.scheduled_at < ? OR oh.status = 'completed')"
        params.append(now)
    
    if host_id:
        sql += " AND oh.host_id = ?"
        params.append(host_id)
    
    if category:
        sql += " AND oh.category = ?"
        params.append(category)
    
    sql += " ORDER BY oh.scheduled_at " + ("ASC" if status_filter == "upcoming" else "DESC")
    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = execute_query(sql, params)
    
    sessions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            sessions.append({
                "id": _get_val(row, 0),
                "host_id": _get_val(row, 1),
                "host_name": _get_val(row, 2),
                "title": _get_val(row, 3),
                "description": _get_val(row, 4),
                "scheduled_at": _get_val(row, 5),
                "duration_minutes": _get_val(row, 6),
                "max_attendees": _get_val(row, 7),
                "category": _get_val(row, 8),
                "status": _get_val(row, 9),
                "is_public": bool(_get_val(row, 10)),
                "attendee_count": _get_val(row, 11) or 0,
                "created_at": _get_val(row, 12)
            })
    
    return {"office_hours": sessions, "total": len(sessions)}


@router.get("/office-hours/{oh_id}")
async def get_office_hours(oh_id: int):
    """Get details of a specific office hours session."""
    result = execute_query("""
        SELECT oh.id, oh.host_id, u.full_name, oh.title, oh.description, oh.scheduled_at,
               oh.duration_minutes, oh.max_attendees, oh.category, oh.status, oh.is_public,
               oh.recording_url, oh.attendee_count, oh.created_at, oh.updated_at
        FROM community_office_hours oh
        LEFT JOIN users u ON oh.host_id = u.id
        WHERE oh.id = ?
    """, [oh_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Office hours not found")
    
    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "host_id": _get_val(row, 1),
        "host_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "scheduled_at": _get_val(row, 5),
        "duration_minutes": _get_val(row, 6),
        "max_attendees": _get_val(row, 7),
        "category": _get_val(row, 8),
        "status": _get_val(row, 9),
        "is_public": bool(_get_val(row, 10)),
        "recording_url": _get_val(row, 11),
        "attendee_count": _get_val(row, 12) or 0,
        "created_at": _get_val(row, 13),
        "updated_at": _get_val(row, 14)
    }


@router.post("/office-hours/{oh_id}/register")
async def register_for_office_hours(
    oh_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Register for an office hours session."""
    # Check session exists and has capacity
    result = execute_query("""
        SELECT max_attendees, attendee_count, status, scheduled_at FROM community_office_hours WHERE id = ?
    """, [oh_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Office hours not found")
    
    row = result["rows"][0]
    max_attendees = _get_val(row, 0) or 50
    attendee_count = _get_val(row, 1) or 0
    status = _get_val(row, 2)
    scheduled_at = _get_val(row, 3)
    
    if status != "scheduled":
        raise HTTPException(status_code=400, detail="Registration is closed for this session")
    
    if attendee_count >= max_attendees:
        raise HTTPException(status_code=400, detail="This session is full")
    
    now = datetime.utcnow().isoformat()
    
    # Check if already registered
    existing = execute_query("""
        SELECT id FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, current_user.id])
    
    if existing and existing.get("rows"):
        raise HTTPException(status_code=400, detail="You are already registered")
    
    # Register
    execute_query("""
        INSERT INTO community_oh_registrations (office_hours_id, user_id, registered_at)
        VALUES (?, ?, ?)
    """, [oh_id, current_user.id, now])
    
    # Update count
    execute_query("UPDATE community_office_hours SET attendee_count = attendee_count + 1 WHERE id = ?", [oh_id])
    
    return {"message": "Successfully registered for office hours", "scheduled_at": scheduled_at}


@router.delete("/office-hours/{oh_id}/register")
async def unregister_from_office_hours(
    oh_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Unregister from an office hours session."""
    result = execute_query("""
        SELECT id FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, current_user.id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=400, detail="You are not registered for this session")
    
    execute_query("""
        DELETE FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, current_user.id])
    
    execute_query("UPDATE community_office_hours SET attendee_count = MAX(0, attendee_count - 1) WHERE id = ?", [oh_id])
    
    return {"message": "Successfully unregistered"}


# ==================== Community Stats ====================

@router.get("/stats")
async def get_community_stats():
    """Get community statistics."""
    stats = {}
    
    # Questions stats
    q_result = execute_query("SELECT COUNT(*), SUM(answer_count) FROM community_questions", [])
    if q_result and q_result.get("rows"):
        row = q_result["rows"][0]
        stats["total_questions"] = _get_val(row, 0) or 0
        stats["total_answers"] = _get_val(row, 1) or 0
    
    # Playbooks stats
    p_result = execute_query("SELECT COUNT(*) FROM community_playbooks WHERE status = 'published'", [])
    if p_result and p_result.get("rows"):
        stats["total_playbooks"] = _get_val(p_result["rows"][0], 0) or 0
    
    # Office hours stats
    oh_result = execute_query("""
        SELECT COUNT(*), SUM(attendee_count) FROM community_office_hours WHERE status = 'completed'
    """, [])
    if oh_result and oh_result.get("rows"):
        row = oh_result["rows"][0]
        stats["completed_sessions"] = _get_val(row, 0) or 0
        stats["total_attendees"] = _get_val(row, 1) or 0
    
    # Upcoming sessions
    now = datetime.utcnow().isoformat()
    upcoming_result = execute_query("""
        SELECT COUNT(*) FROM community_office_hours WHERE scheduled_at > ? AND status = 'scheduled'
    """, [now])
    if upcoming_result and upcoming_result.get("rows"):
        stats["upcoming_sessions"] = _get_val(upcoming_result["rows"][0], 0) or 0
    
    return stats


@router.get("/trending-tags")
async def get_trending_tags(limit: int = Query(10, ge=1, le=50)):
    """Get trending tags from questions."""
    result = execute_query("SELECT tags FROM community_questions ORDER BY created_at DESC LIMIT 100", [])
    
    tag_counts = {}
    if result and result.get("rows"):
        for row in result["rows"]:
            tags = json.loads(_get_val(row, 0) or "[]")
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    return {"trending_tags": [{"tag": t, "count": c} for t, c in sorted_tags]}
