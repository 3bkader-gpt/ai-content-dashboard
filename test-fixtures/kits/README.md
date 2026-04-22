# Kit Fixtures

This directory contains permanent, versioned kit fixtures for integration and regression testing.

## Max Content Fixture

File: `max-content-kit.json`

Purpose:
- Represents a single kit at the maximum allowed content limits.
- Used for stress/edge-case validation across parsing, rendering, export (PDF), and future test suites.

Current limit targets (from `server/src/logic/constants.ts`):
- `num_posts`: 25
- `num_image_designs`: 10
- `num_video_prompts`: 10
- `content_package_idea_count`: 25

Notes:
- This is a long-lived fixture (not temporary).
- Keep this file deterministic and avoid random/generated values that change per run.
- If limits change in the future, update this fixture and increment `fixture_version`.
