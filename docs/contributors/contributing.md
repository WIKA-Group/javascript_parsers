# Contributing

Thank you for wanting to contribute. This page explains how contributions to the public GitHub mirror are handled and how you can make the fastest, highest-value contributions to the WIKA parsers.

## Quick summary

- This GitHub repository is a read-only mirror of our internal development environment. External contributors are welcome to open issues and PRs, see the process below on how they are triaged and merged.
- If you plan to submit code changes, include reproducible examples (payloads, device context) and tests where possible. Clear examples speed up triage and increase the chance of inclusion.

If you only need the short version, stop here. For details and best practices continue reading.

## Mirror model and how contributions are processed

- The public repository mirrors an internal canonical repository used by the WIKA IIoT engineering team.
- When an external issue or pull request is opened on the mirror:
    1. The issue/PR is triaged by maintainers on the mirror.
    2. If accepted, maintainers will reproduce the change internally, run the internal validation pipeline (extended tests, internal linters, release scripts), and land the change in the internal repository.
    3. After internal checks pass, the internal repo is synced back to the public mirror and the PR is updated or closed with a link to the internal change set.

Notes:

- The internal pipeline may include additional checks, tooling, or packaging steps that are not part of the public mirror. Mentioning this up-front avoids surprises when a PR is accepted but not immediately merged.
- For urgent security fixes, please mark the issue/PR clearly and include contact information so maintainers can prioritize and coordinate appropriately.

## Filing an effective issue or PR

Provide the following when you open an issue or PR:

1. A short summary of the problem or feature request.
2. Reproduction steps and the context (device model, device firmware version if known).
3. One or more representative payload samples (hex/base64 or the JSON uplink payload) and the expected decoded output.
4. A short note about whether the change affects published schemas (`uplink.schema.json` or `downlink.schema.json`) or public API surface.
5. Tests (preferred): If you supply code changes, including a unit or device example test that uses `examples.json` or the existing test harness is the fastest way for maintainers to validate your change.

Tip: For PRs that add or change device behavior, include a small `examples.json` fixture that reproduces the payload and the expected decoded output. This file becomes the authoritative test fixture used by our test suite.

## Code style, tests and CI expectations

- Tests: Use Vitest for unit and integration tests. Device integrations should use the device `examples.json` fixtures and the Valibot runtime schema factories to validate outputs.
- Type safety: Avoid overly complex type gymnastics in PRs. If you introduce casts for pragmatism, add focused tests proving the runtime shape matches expectations.
- Lint and typecheck: Run `pnpm lint` and `pnpm typecheck` before submitting a PR.
- Commit messages: Keep them focused and follow the repository's existing style. A short title and a 1–2 line body is sufficient.

## Release cadence and what to expect

- The internal team batches changes and runs an internal validation pipeline before publishing. This means there may be a delay between PR acceptance and the public mirror update.
- Security or critical bug fixes are handled with higher priority; indicate severity in the issue title or PR description.

## Communication and support

- Primary public interaction happens via GitHub issues and PRs on the mirror.
- If your contribution requires private coordination (for example device firmware samples or confidential payloads), include contact instructions in the issue and mark it clearly, the maintainers will respond with the appropriate private channel.

## Code of conduct

Please follow the project's code of conduct when interacting in issues and pull requests. Be respectful and provide constructive feedback.

## Frequently asked scenarios

- "Can I open a PR with a small doc fix?": Yes. Documentation fixes are welcome and often merged quickly.
- "I have a payload that contains sensitive data.": Please sanitize sensitive values before posting publicly. If you need to share privately, indicate that in the issue and maintainers will follow up.
- "My change touches schemas or the published library API.": Add tests, update schema factories and mention the change clearly in the PR description so maintainers can evaluate packaging impact.

## Want to help more?

- Star and watch the repository to be notified of changes.
- Open issues for missing docs or examples, these are high-value contributions for new contributors.

Thanks again for contributing. Your reports and PRs help keep this project useful and reliable for everyone.
