/**
 * Schema Context - Infrastructure Config
 * Database schema loaded for AI context
 * 
 * NOTE: For MVP, we embed a summary. In Phase 2, this will use keyword lookup.
 */

export const SCHEMA_CONTEXT = `
-- PostgreSQL Database Schema Summary
-- This database contains 40+ tables for a company management system

-- CORE TABLES:
CREATE TABLE users (id uuid, email text, name text, role text, created_at timestamp);
CREATE TABLE teams (id uuid, name text, description text, created_by uuid);
CREATE TABLE team_members (team_id uuid, user_id uuid, role text);

-- TASK MANAGEMENT:
CREATE TABLE tasks (id uuid, title text, description text, process text, created_by uuid, work_id uuid, start_date timestamp, due_date timestamp);
-- process: 'Resources', 'Idea', 'Todo', 'Doing', 'Done', 'Performance', 'Released'
CREATE TABLE task_comments (id uuid, task_id uuid, author_id uuid, comment text, created_at timestamp);
CREATE TABLE task_attachments (id uuid, task_id uuid, file_name text, file_url text);
CREATE TABLE works (id uuid, title text, description text, team_id uuid);

-- ACTIVITY & ANALYTICS:
CREATE TABLE activity_events (id uuid, actor_user_id uuid, entity_id uuid, entity_type text, action text, event_name text, created_at timestamp);
CREATE TABLE member_activity_daily (id uuid, user_id uuid, date date, task_updates_count int, task_completes_count int, activity_score numeric);
CREATE TABLE team_energy_daily (id uuid, team_id uuid, date date, energy_score numeric, active_members_count int);

-- HR & TIME OFF:
CREATE TABLE time_off_requests (id uuid, requester_id uuid, start_date date, end_date date, reason text, status text);
-- status: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'

-- TRAINING & LEARNING:
CREATE TABLE training_videos (id uuid, title text, description text, video_url text, duration int);
CREATE TABLE training_assignments (id uuid, training_video_id uuid, name text, description text);
CREATE TABLE learning_docs (id uuid, title text, content text, folder_id uuid, created_by uuid);
CREATE TABLE learning_folders (id uuid, name text, parent_id uuid);

-- INTERVIEWS & ASSESSMENTS:
CREATE TABLE interview_assessments (id uuid, title text, target_role text, duration int);
CREATE TABLE interview_questions (id uuid, assessment_id uuid, text text, type text, format text);
CREATE TABLE interview_results (id uuid, assessment_id uuid, user_id uuid, skill_scores jsonb, ai_summary text);

-- NOTIFICATIONS:
CREATE TABLE notifications (id uuid, user_id uuid, event text, metadata jsonb, delivered boolean, created_at timestamp);
CREATE TABLE notification_topics (id text, name text, description text, default_channels text[]);

-- CHAT:
CREATE TABLE chat_sessions (id uuid, user_id uuid, title text, created_at timestamp);
CREATE TABLE chat_messages (id uuid, session_id uuid, content text, is_user boolean, created_at timestamp);

-- EVENTS:
CREATE TABLE events (id uuid, title text, description text, start_time timestamp, end_time timestamp, location text, type text);

-- FEEDBACK:
CREATE TABLE feedback (id uuid, user_id uuid, rating int, feedback_text text, category text, created_at timestamp);

-- IMPORTANT RELATIONSHIPS:
-- users.id -> tasks.created_by, team_members.user_id, activity_events.actor_user_id
-- teams.id -> works.team_id, team_members.team_id
-- works.id -> tasks.work_id
-- tasks.id -> task_comments.task_id, task_attachments.task_id
`;
