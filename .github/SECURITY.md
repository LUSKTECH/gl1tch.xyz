# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in gl1tch.xyz, please report it
privately — **do not** open a public GitHub issue.

### How to Report

Email findings to **security@lusk.tech** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigation

You can also use GitHub's private vulnerability reporting:
<https://github.com/LUSKTECH/gl1tch.xyz/security/advisories/new>.

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 5 business days
- **Resolution target** within 30 days for confirmed issues
- Coordinated disclosure once a fix is shipped

### Safe Harbor

Good-faith security research conducted under this policy is authorized. We
will not pursue legal action against researchers who follow it.

## Security Practices

When contributing:

- Never commit secrets, tokens, or credentials — secrets are scanned in CI
- Use environment variables for sensitive configuration
- Keep dependencies current (Dependabot opens weekly PRs)
- Report any suspicious activity in dependencies or GitHub Actions runs
