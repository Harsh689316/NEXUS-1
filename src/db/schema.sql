-- ============================================================================
-- NEXUS: AI-Powered Criminal Network Analysis System
-- Production PostgreSQL Relational Schema
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE role_type AS ENUM ('investigator', 'senior_investigator', 'division_command', 'system_admin');
CREATE TYPE clearance_level AS ENUM ('L1_RESTRICTED', 'L2_SECRET', 'L3_TOP_SECRET');
CREATE TYPE person_status AS ENUM ('Person of Interest', 'Subject', 'Associated Person', 'Reported Connection', 'Background Monitor');
CREATE TYPE case_status AS ENUM ('Active', 'Under Investigation', 'Court Pending', 'Closed/Archived');
CREATE TYPE tip_status AS ENUM ('New', 'Under Review', 'Linked', 'Resolved');
CREATE TYPE relationship_type AS ENUM (
    'Known Associate', 'Communication', 'Shared Location', 'Shared Vehicle',
    'Financial Link', 'Case Association', 'Organization Association', 'Reported Relationship'
);

-- Table: Officers (Authorized Law Enforcement Users)
CREATE TABLE IF NOT EXISTS officers (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'INS-1042'
    name VARCHAR(128) NOT NULL,
    badge_number VARCHAR(64) UNIQUE NOT NULL,
    role role_type NOT NULL DEFAULT 'investigator',
    clearance_level clearance_level NOT NULL DEFAULT 'L1_RESTRICTED',
    department VARCHAR(128) NOT NULL,
    station VARCHAR(128) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Table: Persons of Interest / Subjects (Fictional Records)
CREATE TABLE IF NOT EXISTS persons (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'PER-01'
    full_name VARCHAR(128) NOT NULL,
    alias VARCHAR(64),
    age INT,
    dob DATE,
    gender VARCHAR(16),
    occupation VARCHAR(128),
    status person_status NOT NULL DEFAULT 'Person of Interest',
    risk_assessment VARCHAR(64) DEFAULT 'For Investigation Review',
    primary_city VARCHAR(64),
    network_group VARCHAR(128),
    summary TEXT,
    clearance_required clearance_level NOT NULL DEFAULT 'L1_RESTRICTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Person Identifiers & Channels
CREATE TABLE IF NOT EXISTS person_phone_numbers (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(32) REFERENCES persons(id) ON DELETE CASCADE,
    phone_number VARCHAR(32) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_emails (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(32) REFERENCES persons(id) ON DELETE CASCADE,
    email VARCHAR(128) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_vehicles (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(32) REFERENCES persons(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(32) NOT NULL,
    vehicle_model VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Investigation Cases
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'CASE-1001'
    title VARCHAR(256) NOT NULL,
    category VARCHAR(128) NOT NULL,
    status case_status NOT NULL DEFAULT 'Active',
    opened_date DATE NOT NULL,
    investigating_officer_id VARCHAR(32) REFERENCES officers(id),
    description TEXT,
    primary_jurisdiction VARCHAR(128),
    clearance_required clearance_level NOT NULL DEFAULT 'L1_RESTRICTED',
    financial_volume_inr NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Case Person Linkage (Junction)
CREATE TABLE IF NOT EXISTS case_persons (
    case_id VARCHAR(32) REFERENCES cases(id) ON DELETE CASCADE,
    person_id VARCHAR(32) REFERENCES persons(id) ON DELETE CASCADE,
    role_in_case VARCHAR(64) DEFAULT 'Subject',
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (case_id, person_id)
);

-- Table: Network Relationships (Graph Edges)
CREATE TABLE IF NOT EXISTS relationships (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'REL-001'
    source_id VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'person',
    target_type VARCHAR(32) NOT NULL DEFAULT 'person',
    relationship_type relationship_type NOT NULL,
    label VARCHAR(128),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),
    verification_status VARCHAR(32) DEFAULT 'Under Investigation',
    notes TEXT,
    first_observed DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Financial Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(32) PRIMARY KEY,
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    sender_name VARCHAR(128) NOT NULL,
    sender_person_id VARCHAR(32) REFERENCES persons(id),
    receiver_name VARCHAR(128) NOT NULL,
    receiver_person_id VARCHAR(32) REFERENCES persons(id),
    category VARCHAR(64),
    flag VARCHAR(32) DEFAULT 'Normal',
    bank_reference VARCHAR(64),
    channel VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Intelligence Tips (Anonymous Citizen Ingestion)
CREATE TABLE IF NOT EXISTS intelligence_tips (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'TIP-1001'
    category VARCHAR(128) NOT NULL,
    location VARCHAR(256),
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_type VARCHAR(64) DEFAULT 'Anonymous Web Portal',
    description TEXT NOT NULL,
    status tip_status NOT NULL DEFAULT 'New',
    assigned_officer_id VARCHAR(32) REFERENCES officers(id),
    urgency VARCHAR(16) DEFAULT 'Medium',
    verification_disclaimer TEXT DEFAULT 'Unverified intelligence — investigator review required.'
);

-- Table: Audit Trail (Tamper-Evident Hash Chain)
CREATE TABLE IF NOT EXISTS audit_logs (
    block_index BIGINT PRIMARY KEY,
    action_id VARCHAR(64) UNIQUE NOT NULL,
    officer_id VARCHAR(32) NOT NULL,
    officer_name VARCHAR(128) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource VARCHAR(256) NOT NULL,
    details TEXT,
    previous_hash VARCHAR(128) NOT NULL,
    current_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- CCTNS / e-FIR ingestion records (metadata + cryptographic proof only; raw evidence remains off-chain)
CREATE TABLE IF NOT EXISTS firs (
    id VARCHAR(64) PRIMARY KEY,
    fir_number VARCHAR(128) NOT NULL,
    source_system VARCHAR(32) NOT NULL DEFAULT 'CCTNS',
    police_station VARCHAR(128),
    district VARCHAR(128),
    state VARCHAR(128),
    incident_date DATE,
    sections TEXT[] DEFAULT '{}',
    narrative TEXT,
    complainant_name VARCHAR(256),
    payload_hash VARCHAR(128) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ingested_by VARCHAR(32) REFERENCES officers(id),
    UNIQUE(source_system, fir_number)
);

CREATE INDEX IF NOT EXISTS idx_firs_number ON firs(fir_number);
CREATE INDEX IF NOT EXISTS idx_firs_received_at ON firs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_firs_hash ON firs(payload_hash);

-- Indexes for Fast Investigative Search & Joins
CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(full_name);
CREATE INDEX IF NOT EXISTS idx_persons_alias ON persons(alias);
CREATE INDEX IF NOT EXISTS idx_persons_city ON persons(primary_city);
CREATE INDEX IF NOT EXISTS idx_persons_group ON persons(network_group);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_tips_status ON intelligence_tips(status);
CREATE INDEX IF NOT EXISTS idx_audit_action_id ON audit_logs(action_id);
