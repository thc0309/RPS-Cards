# T12 — Security boundary and observability hardening

Status: complete

## Outcome

Khóa chặt trust boundaries trước device QA: malformed/rate-excess actions không
ảnh hưởng room, idempotency bounded, logs hữu ích nhưng không chứa secret, env và
dependency checks có evidence.

## Dependencies and skills

- Dependencies: T11.
- Required skills: `vibe-build`, `vibe-test`, `security-and-hardening`,
  `vibe-review`, `api-and-interface-design`.
- Read first: `SPEC.md` Environment/diagnostics, Contracts, Boundaries, Server
  tests; `.agents/references/security-checklist.md`.

## Technical contract

1. Lập inventory mọi external boundary: server env, room code, Colyseus join
   options/messages, guest/reconnect credential, ad callback và stored preference.
   Mỗi boundary có allowlist/type/range/length validation ở entry point.
2. Per-client message limiter bounded và deterministic trong tests; reject excessive
   input bằng stable client-safe code, không disconnect healthy peer hoặc mutate
   room. Không thêm distributed limiter cho in-memory MVP.
3. Idempotency record có lifecycle bound theo room/operation, không tăng vô hạn.
   Duplicate same payload returns same result; conflicting reuse rejected.
4. Structured logger allowlist fields. Redaction tests cover own/opponent cards
   before reveal, removed draft card, guest/reconnect credentials, raw transport
   payload, stack/internal error. Production client chỉ thấy stable error code.
5. `.env.example` placeholder only; `.gitignore` chặn secret/key. Public Expo env
   chỉ chứa server URL/test ad IDs; không server secret/service-role key.
6. Review dependency graph and `npm audit`. Critical/high reachable vulnerability
   phải fix; unreachable/dev-only finding cần reason + review note, không chạy
   blind `npm audit fix --force`.
7. Add minimal health/startup log and room lifecycle metrics as structured counts
   in process logs only if already useful. Không thêm analytics/APM SDK ở MVP.

## Implementation steps

1. Viết threat-boundary checklist theo actual implemented entry points.
2. Add fuzz/table tests for malformed/null/oversized/wrong-phase messages.
3. Test limiter/idempotency memory bounds with fake time and repeated operations.
4. Capture logger output in tests and assert forbidden values absent.
5. Run credential persistence inspection and staged/diff secret scan.
6. Run focused suite, audit dependencies, then `$vibe-review` current diff.

## Likely files

- `server/src/config.ts`, protocol validators, room message handlers
- `server/src/rate-limit.ts`, `server/src/logger.ts`
- `mobile/src/security/*`, storage boundary tests
- `.env.example`, `.gitignore`
- Security-focused server/mobile tests

## Acceptance criteria

- [ ] Every external input class has boundary validation tests; malformed,
  unauthorized, stale và rate-excess actions leave canonical state unchanged.
- [ ] Captured logs/client errors contain useful stable IDs/codes nhưng no tokens,
  secret cards, internal stack or raw private payload; idempotency/rate structures bounded.
- [ ] Audit/secret/config checks have recorded evidence and no unresolved reachable
  critical/high issue; `npm run verify` remains green.

## How to run

```bash
npm run test --workspace server -- --test-name-pattern="validation|rate|idempot|log|redact"
npm run test --workspace mobile -- --runInBand --testPathPattern="security|credential|storage"
npm audit --audit-level=high
npm run verify
git diff --check
git status --short
```

Secret scan phải kiểm diff/staged content nhưng không in raw matched secret ra
handoff. Không commit trong task này.

## Evidence to record

- Boundary matrix and count: core protocol malformed/unknown/oversized payloads,
  room/session length checks, deterministic limiter, stable `RATE_LIMITED`, and
  unchanged projection all pass; server is 17/17 and game-core 13/13.
- Idempotency evicts oldest entries above 256 per room; duplicate/conflict tests pass.
- Logger is allowlist-only; tests cover credential/card/raw payload/stack absence.
  `.env.example` is placeholders and `.gitignore` excludes `.env*` except example.
- `npm audit --audit-level=high`: no high/critical report; 18 low/moderate
  transitive findings remain in Colyseus/Expo chains. `--force` was not run because
  suggested fixes downgrade/break pinned Expo/Colyseus.
- Review finding: HTTP polling remains an MVP transport simplification; native
  Colyseus socket lifecycle is required before production reconnect guarantees.

## Explicitly skipped

- Supabase/RLS, production CORS/deployment, auth account, analytics/APM và CI.
