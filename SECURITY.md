# Security Policy

## Supported Versions

Security fixes are generally applied to the latest version of `telegram-pm-relay`.

| Version | Supported |
| --- | --- |
| Latest release | ✅ |
| Older releases | ❌ |

Users are encouraged to keep their deployment up to date.

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for suspected security vulnerabilities.

If you discover a security issue, please report it privately to the maintainer.

Preferred reporting methods:

1. Use GitHub's **Private Vulnerability Reporting** feature for this repository, if available.
2. If private vulnerability reporting is unavailable, contact the maintainer through the contact method listed on the maintainer's GitHub profile.

Please include as much of the following information as possible:

- A description of the vulnerability
- Affected component or endpoint
- Steps to reproduce
- Potential impact
- Proof-of-concept code or requests, if applicable
- Suggested remediation, if you have one
- Whether the issue is already publicly known

Please avoid including real user messages, Telegram credentials, Bot Tokens, Cloudflare API tokens, D1 credentials, or other sensitive production data in the report.

## Security-Sensitive Areas

`telegram-pm-relay` handles untrusted input and privileged credentials. Reports involving the following areas are especially important:

- Telegram Bot Token exposure
- Unauthorized access to relay or administrative functionality
- Telegram webhook spoofing or validation bypass
- Authentication or authorization bypass
- Rate-limit, verification, blocklist, or anti-abuse bypass
- Injection vulnerabilities
- Cross-site scripting or unsafe HTML rendering
- Server-side request forgery
- Sensitive information disclosure
- D1 database exposure or unintended data access
- Message privacy or metadata leakage
- Secrets exposed through logs, responses, builds, or source maps
- Cloudflare Worker configuration weaknesses
- Dependency or supply-chain vulnerabilities with practical impact
- Denial-of-service issues that can materially affect deployed instances

## Secrets and Credentials

Never commit production credentials to the repository.

Sensitive values such as the following should be stored using the appropriate Cloudflare secret or environment-variable mechanism:

- Telegram Bot Tokens
- Webhook secrets
- Cloudflare credentials
- Administrative secrets
- Any third-party API credentials

If a credential is accidentally exposed, revoke and rotate it immediately. Removing the credential from Git history alone is not sufficient.

## Responsible Disclosure

Please allow reasonable time for the vulnerability to be investigated and fixed before publishing technical details.

The maintainer will make a best effort to:

- Acknowledge valid reports
- Reproduce and assess the issue
- Develop and test a fix
- Release a patched version when appropriate
- Coordinate disclosure for significant vulnerabilities

Response times are not guaranteed, as this is an independently maintained open-source project.

## Deployment Security

Operators are responsible for securing their own deployments.

Recommended practices include:

- Keep `telegram-pm-relay` and its dependencies updated
- Store secrets outside source control
- Restrict access to Cloudflare and Telegram administration credentials
- Use a strong, unpredictable webhook secret where supported
- Review Cloudflare Worker routes, bindings, and environment variables
- Apply appropriate rate limits and abuse controls
- Avoid logging message contents or sensitive user information unless necessary
- Periodically review D1 data retention and remove data that is no longer required
- Monitor logs for unusual traffic, repeated verification failures, and abuse attempts

## Scope

A report is most useful when it demonstrates a concrete security impact on the current version of `telegram-pm-relay`.

Issues that may not be treated as security vulnerabilities include:

- General feature requests
- Best-practice suggestions without a demonstrated security impact
- Vulnerabilities that exist only in unsupported or significantly modified deployments
- Denial-of-service reports requiring unrealistic resources or privileged access
- Vulnerabilities in third-party services that do not result from this project's code or configuration

## Acknowledgements

Responsible security research helps make `telegram-pm-relay` safer for everyone.

Thank you for reporting vulnerabilities privately and giving maintainers an opportunity to address them before public disclosure.
