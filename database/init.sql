-- ====================================================================
-- MASTER DATABASE INITIALIZATION SCRIPT (init.sql)
-- Intelligent Enterprise Email Automation & Helpdesk CRM
-- (PostgreSQL 16 Enterprise DB)
-- ====================================================================

-- 1. CORE SCHEMA (Shared infrastructure)
\ir 00_core_schema.sql

-- 2. MEMBER 1: Triage & Tickets
\ir 01_member1_tickets.sql

-- 3. MEMBER 2: Knowledge Base, Email Drafts & Daily Summaries
\ir 02_member2_knowledge_drafts.sql

-- 4. MEMBER 3: CRM Leads & Finance Invoices
\ir 03_member3_crm_invoices.sql
