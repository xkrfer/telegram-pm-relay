-- Migration: 0004_init_config
-- Created at: 2026-01-13
-- Description: Initialize default system configuration

INSERT INTO system_config (verification, updated_at, updated_by)
VALUES (
  '{"enabled":true,"method":"math","timeout":900}',
  unixepoch(),
  NULL
);
