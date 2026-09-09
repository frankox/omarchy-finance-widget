# Implementation Plan: Story 01 — Market watchlist and compact widget

- Status: `in_progress`
- Updated: `2026-09-09T11:12:59+02:00`
- Project root: `/run/media/frnack/Data/workspace/omarchy-finance-widget`
- Source specification: `docs/stories/01-market-watchlist.md`, `docs/specs/omarchy-finance-widget.md`, and `docs/decisions/0001-technology-stack-and-runtime-architecture.md`
- Relevant repository state: branch `main` at `f71ea90`, clean and one commit ahead of `origin/main` when this plan was created

## Outcome

Deliver the `frankox.omarchy-finance-widget` native Omarchy Shell plugin for Story 01: a compact multi-monitor widget, expanded Portfolio/Watchlist/Search/Settings panel, shared QML service, Deno/TypeScript worker, SQLite persistence, replaceable Yahoo Finance adapter, six-hour shared cache, and single-flight refresh.

## Scope

### In scope

- Native `bar-widget` plus singleton `service`, compact watchlist indicator, four-section panel, search, append-only watchlist membership, drag-and-drop ordering, indicator toggle, global bar position, persistence, market cache, refresh, stale/unavailable behavior, packaging, and Story 01 acceptance verification.

### Out of scope

- Watchlist removal, purchases, portfolio calculations, base currency, withdrawals, charts, corporate actions, costs, TER, import/export, complete localization, and Stories 02–04 behavior.

## Requirements and Acceptance

- `AC-001`: The widget appears on every connected monitor in one global left/center/right section.
  - Evidence: live Omarchy Shell smoke test and persisted `shell.json` layout.
- `AC-003`: With portfolio mode disabled, the compact widget shows the first watchlist instrument's daily percentage and follows reorder; missing data shows `—`.
  - Evidence: state/UI tests plus end-to-end watchlist reorder smoke test.
- `AC-004`: Search maps Yahoo results into every supported asset class it exposes and shows `Not found` when no supported match exists.
  - Evidence: provider fixture tests for stock, ETF, ETC, ETN, index, mutual fund, bond, cryptocurrency, currency, and commodity, plus a separate live probe.
- `AC-017`: Startup, panel opening, and multiple widget instances share one cache and do not automatically refresh again within six hours.
  - Evidence: fake-clock/single-flight tests and singleton worker smoke evidence.
- `AC-018`: Provider failure preserves cached values with stale timestamp and never substitutes zero; no cache yields unavailable.
  - Evidence: partial/total provider failure tests and UI smoke state.
- `S01-PERSIST`: Instruments, order, preference, quotes, and refresh metadata survive worker/shell restart.
  - Evidence: SQLite reopen integration test and live restart smoke test.

## Constraints and Decisions

- Plugin id is `frankox.omarchy-finance-widget`; manifest schema is 1, kinds are `bar-widget` and `service`, `keepLoaded` is true, `allowMultiple` is false, and default section is `center`.
- Portfolio indicator defaults to false. In Story 01, enabling it displays `—` because there are no positions.
- JSONL protocol v1 uses correlated requests/responses and `state.changed` events. Decimal values cross boundaries as strings.
- SQLite lives under `$XDG_DATA_HOME/omarchy-finance-widget/finance.sqlite3`, falling back to `~/.local/share`.
- Yahoo uses `query2.finance.yahoo.com`, a 10-second timeout, explicit user agent, concurrency limit four, and no automatic retries. Unsupported result types are filtered; Yahoo ETF names explicitly containing ETC/ETN are refined accordingly.
- `decimal.js@10.6.0`, `deno.lock`, and `vendor/` are committed. Runtime uses `--cached-only` and minimum filesystem/network permissions.
- Current tracked documentation is preserved. If the architecture spike fails, implementation stops for a replacement ADR.

## Steps

### Step 1 — Prove the runtime architecture with a working plugin skeleton

- Status: `complete`
- Scope: manifest and Deno configuration; vendored decimal dependency; minimal JSONL `health.check` worker; SQLite capability check; `FinanceService.qml`; compact widget and panel placeholders; Yahoo live probe; singleton service/process smoke test.
- Verification: `omarchy plugin validate .`; Deno format/lint/type checks and focused tests; worker invocation using `--cached-only`; no symlinks in the plugin tree; disposable Omarchy Shell load showing one worker shared by widget instances.
- Completion evidence:
  - `deno fmt --check backend tests`, `deno lint backend tests`, and `deno task check` passed.
  - `deno task test:step1` passed all 5 focused protocol/runtime tests.
  - A JSONL health/shutdown session run with `deno run --cached-only --no-prompt backend/main.ts` returned protocol-v1 success envelopes, working native SQLite, and exact decimal arithmetic (`0.3`).
  - `omarchy plugin validate .` passed, and the no-symlink scan returned no plugin-tree symlinks.
  - A separately permissioned live Yahoo probe through `query2.finance.yahoo.com` returned `MSFT` as `EQUITY` using the 10-second timeout and explicit user agent.
  - A disposable live Omarchy Shell installation loaded the bar widget on all 3 connected monitors, exposed one shared service, ran exactly one worker process, completed health and provider probes through QML-to-JSONL, and opened the placeholder panel without plugin errors.
  - Cleanup disabled and removed the disposable plugin, unloaded its IPC target and worker, and left `~/.config/omarchy/shell.json` byte-identical to the pre-test snapshot.
- Deviations:
  - Deno's npm installation layout created a `node_modules` symlink, which the Omarchy plugin validator rejects. The exact `decimal.js@10.6.0` distribution files are therefore committed as regular files under `vendor/decimal.js`, imported locally, while `deno.lock` records the generated npm integrity entry. Runtime remains fully offline with `--cached-only`.

### Step 2 — Persist watchlist, preferences, quotes, and refresh metadata

- Status: `pending`
- Scope: SQLite schema/migration v1, transactional repositories, ordered watchlist, portfolio-indicator preference, quote cache, refresh timestamps, and application state snapshot.
- Verification: focused integration tests for fresh DB initialization, reopen, duplicate-safe append, exact-permutation reorder, rollback, cache/preference persistence, and restart hydration.
- Completion evidence:
- Deviations: none

### Step 3 — Implement the provider and shared refresh policy

- Status: `pending`
- Scope: `MarketDataProvider` port, Yahoo search/chart adapter, asset classification, decimal daily-change calculation, fixture parsing, six-hour TTL, manual refresh, single-flight coordination, bounded concurrency, and per-instrument failure isolation.
- Verification: fixture/unit tests for supported classes, missing metadata, `Not found`, malformed responses, fresh/expired cache, concurrent requests, manual bypass, partial failure, cached stale values, and uncached unavailable values; separate live probe.
- Completion evidence:
- Deviations: none

### Step 4 — Complete JSONL protocol and QML service lifecycle

- Status: `pending`
- Scope: protocol methods `health.check`, `state.get`, `search`, `watchlist.add`, `watchlist.reorder`, `quotes.refresh`, `preference.set`, and `shutdown`; correlated pending requests; snapshots/events; timeouts; sanitized stderr; worker crash handling and 1/5/30-second restart backoff.
- Verification: subprocess protocol tests for success/error envelopes, concurrency, state events, malformed input, shutdown, and crash/restart; QML service smoke check.
- Completion evidence:
- Deviations: none

### Step 5 — Build the native compact widget and four-section panel

- Status: `pending`
- Scope: theme-aware Omarchy components, shared-service binding, compact `—` state, panel open/close lifecycle, Portfolio empty state, and Watchlist/Search/Settings navigation; automatic refresh request on startup/open.
- Verification: plugin validation, backend regression suite, and live QML smoke test for navigation, shared state, and non-crashing unavailable/provider states.
- Completion evidence:
- Deviations: none

### Step 6 — Deliver search and ordered watchlist interactions

- Status: `pending`
- Scope: explicit search submit, classified results, idempotent append, watchlist quote/timestamp/status rows, manual refresh, drag-and-drop reorder, persistence, and rollback to authoritative state after a rejected mutation.
- Verification: search-to-add and `Not found` flows, append/reorder persistence, first-instrument indicator update, stale/unavailable rendering, partial refresh, and restart smoke test.
- Completion evidence:
- Deviations: none

### Step 7 — Deliver persistent indicator and global bar-position settings

- Status: `pending`
- Scope: persisted portfolio-indicator toggle; authoritative section read from shell configuration; left/center/right move through `omarchy bar move`; error feedback without losing the previous position.
- Verification: preference reopen test; toggle/`—` UI smoke; position change and persistence on every connected monitor; failed-move behavior.
- Completion evidence:
- Deviations: none

### Step 8 — Run Story 01 acceptance and document delivery

- Status: `pending`
- Scope: README for prerequisites/install/runtime permissions/data location/delayed-market-data limits; complete quality gates; disposable plugin staging only after confirming no target collision; cleanup and restoration of the test layout.
- Verification: Deno format, lint, type check, full tests, offline worker run, manifest validation, no-symlink check, AC-001/003/004/017/018 checklist, supplemental Story 01 checks, and clean scoped diff review.
- Completion evidence:
- Deviations: none

## Current Handoff

- Current step: Step 1 `complete`
- Next proposed action: Step 2 — implement SQLite schema/migration v1, repositories, and persisted application snapshot
- Blockers or questions: explicit permission is required before Step 2 begins
- Relevant working-tree notes: Step 1 implementation is uncommitted; preserve the user's concurrent formatting-only edit in `docs/stories/01-market-watchlist.md` and the local commit ahead of `origin/main`
- Last verification: all Step 1 automated gates passed; live QML/worker/Yahoo/multi-monitor smoke checks passed; the temporary installation and layout changes were fully restored
