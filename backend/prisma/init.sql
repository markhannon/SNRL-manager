-- PostgreSQL initialization script
-- This file is run when the database container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database and user are already created by the POSTGRES_USER and POSTGRES_DB env vars
-- This file is for any additional setup needed
