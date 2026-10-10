-- Replace retired web verification and discard external provider configuration.
UPDATE system_config
SET verification = json_remove(
  CASE WHEN json_extract(verification, '$.method') = 'turnstile'
    THEN json_set(verification, '$.method', 'math')
    ELSE verification END,
  '$.turnstile', '$.ai'
), updated_at = unixepoch()
WHERE json_valid(verification);

UPDATE users
SET verification_token = NULL,
    verification_expires_at = NULL,
    verification_data = NULL,
    updated_at = unixepoch()
WHERE json_valid(verification_data)
  AND json_extract(verification_data, '$.method') = 'turnstile';
