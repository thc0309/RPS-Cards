# codex-vibe-code

Template để khởi tạo dự án làm việc với Codex theo workflow có kiểm soát: spec, plan, build, test, review, ship. Repo này ưu tiên context gọn, task nhỏ, verification thật, và các skill có thể tái dùng.

## Dùng Nhanh

```bash
command -v rtk >/dev/null || curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh
rtk gain
git clone https://github.com/netcoreltd/codex-vibe-code.git my-project
cd my-project
./scripts/init-project.sh --yes
codex
```

`init-project.sh` xóa lịch sử Git của template, tạo repository mới và reset `SPEC.md` cùng task tracker về trạng thái project chưa được mô tả.

Sau khi mở Codex trong project mới, chạy theo thứ tự:

```text
$vibe-spec
Mô tả sản phẩm bạn muốn xây.
```

```text
$vibe-plan
```

```text
$vibe-build T01
```

## Cài Đặt

### Codex

Cài Codex CLI hoặc dùng Codex app/IDE extension. Kiểm tra:

```bash
codex --version
```

### RTK

Repo yêu cầu prefix shell commands bằng `rtk` để giảm token từ output.

```bash
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh
rtk --version
rtk gain
```

### Caveman

Caveman giúp agent trả lời ngắn hơn để giảm output token. Cần Node.js trên máy.

Cài nhanh cho các agent được phát hiện trên máy:

```bash
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash
```

Nếu muốn review script trước khi chạy:

```bash
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh -o install-caveman.sh
less install-caveman.sh
bash install-caveman.sh
```

Sau khi cài, dùng trong Codex bằng cách nói:

```text
/caveman
```

hoặc:

```text
talk like caveman
```

Tắt chế độ này:

```text
normal mode
```

### Ponytail

Ponytail ép agent chọn giải pháp tối thiểu trước khi viết code: không build thừa, không tạo abstraction sớm, ưu tiên code đã có, stdlib, native platform, dependency hiện hữu.

Cài cho Codex CLI:

```bash
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
codex
```

Ponytail cần Node.js trong `PATH` để chạy lifecycle hooks. Trong Codex, mở:

```text
/hooks
```

Review và trust hai lifecycle hooks của Ponytail, rồi mở thread mới.

Codex desktop app: restart app sau khi install để plugin được nhận diện.

Lệnh thường dùng sau khi cài:

```text
/ponytail
/ponytail lite
/ponytail full
/ponytail ultra
/ponytail off
```

## Khởi Tạo Project Mới

Sau khi `init-project.sh` reset template, `$vibe-spec` và `$vibe-plan` sẽ điền các file source-of-truth theo sản phẩm thật:

| File | Mục đích |
|------|----------|
| `SPEC.md` | Mục tiêu, stack, phạm vi, acceptance criteria |
| `tasks/plan.md` | Task chi tiết, dependency order, verification |
| `tasks/todo.md` | Checklist tiến độ |
| `tasks/test-plan.md` | Browser/E2E cases |

Nên giữ `AGENTS.md` ngắn. Nếu cần hướng dẫn dài, thêm vào `.agents/references/` và chỉ đọc khi task cần.

## Workflow Chính

### 1. Spec

Dùng khi bắt đầu project hoặc feature mới.

```text
$vibe-spec

Tôi muốn xây app quản lý công việc cá nhân với web UI, đăng nhập, CRUD task, và dashboard.
```

Kết quả mong đợi: Codex cập nhật `SPEC.md` rồi dừng để bạn xác nhận.

### 2. Plan

Dùng sau khi spec đã rõ.

```text
$vibe-plan
```

Kết quả mong đợi:

- `tasks/plan.md` có task nhỏ, acceptance criteria, verification steps.
- `tasks/todo.md` có checklist.
- `tasks/test-plan.md` có E2E cases nếu có UI/browser flow.
- `tasks/plan.md` có `Skill Intake Summary`: skill hiện có nên dùng cho từng task và skill còn thiếu nếu có.

### 3. Build

Dùng để implement một task cụ thể.

```text
$vibe-build T01
```

Codex chỉ làm task được yêu cầu, chạy verification, cập nhật checklist, rồi dừng ở checkpoint.

Nếu muốn giao toàn bộ phần implementation cho AI và chỉ review một lần ở cuối:

```text
$vibe-build all
```

Chế độ `all` tự chạy mọi task unchecked theo dependency order, kể cả qua phase checkpoint. Codex tự chọn phương án tối thiểu phù hợp `SPEC.md`, tự debug và retry khi verification fail, cập nhật evidence sau từng task, rồi trả một báo cáo cuối để bạn review. Nó chỉ dừng khi blocker không thể tự xử lý, thiếu quyền truy cập bên ngoài, `SPEC.md` mâu thuẫn đáng kể, cần hành động phá hủy/không thể đảo ngược, hoặc bạn yêu cầu dừng. Chế độ này vẫn không commit nếu bạn chưa yêu cầu commit rõ.

### 4. Test

Dùng cho bug fix hoặc khi cần workflow test rõ ràng.

```text
$vibe-test
```

Với bug fix, Codex dùng Prove-It pattern: viết test fail trước, xác nhận fail, sửa code, xác nhận pass.

### 5. Review

Dùng trước khi merge hoặc sau khi có diff đáng kể.

```text
$vibe-review
```

Review tập trung vào correctness, readability, architecture, security, performance. Findings phải có file/line và fix recommendation.

### 6. E2E

Dùng khi đã có `tasks/test-plan.md` và app chạy được trong browser.

```text
$vibe-e2e all
```

Non-pass cases được ghi vào `tasks/test-result.md`.

### 7. Ship

Dùng cho launch readiness.

```text
$vibe-ship
```

Nếu cần review song song, yêu cầu rõ:

```text
Use $vibe-ship. Spawn code-reviewer, security-auditor, and test-engineer in parallel, wait for all three, then synthesize a go/no-go decision.
```

## Skill Theo Loại Việc

| Việc cần làm | Skill nên dùng |
|--------------|----------------|
| Requirements còn mơ hồ | `$interview-me` |
| Cần refine ý tưởng | `$idea-refine` |
| Tạo/cập nhật spec | `$vibe-spec` |
| Lập kế hoạch task | `$vibe-plan` |
| Implement task | `$vibe-build` |
| Test hoặc bug regression | `$vibe-test` |
| Review diff | `$vibe-review` |
| Simplify code vừa đổi | `$vibe-simplify` |
| Browser/E2E | `$vibe-e2e` |
| Launch readiness | `$vibe-ship` |
| Frontend/UI | `$frontend-ui-engineering` |
| Backend/API/interface | `$api-and-interface-design` |
| Auth, input, storage, secrets, integrations | `$security-and-hardening` |
| CI/CD | `$ci-cd-and-automation` |
| Performance | `$performance-optimization` |

## Skill Intake Trong `$vibe-plan`

Khi chạy `$vibe-plan`, Codex sẽ tự rà soát scope dự án và skill có sẵn:

1. Đọc `SPEC.md` và các lát cắt codebase liên quan.
2. Nhận diện domain: frontend, backend, auth, data, CI/CD, performance, E2E, docs.
3. Chỉ đọc frontmatter `name` và `description` của `.agents/skills/*/SKILL.md`, sau đó mới mở nội dung các skill được chọn.
4. Ghi skill đề xuất cho từng task vào `tasks/plan.md`.
5. Ghi skill còn thiếu vào mục `Skill Gaps`.

`$vibe-plan` chỉ đề xuất skill. Nó không tự cài, tạo, hoặc sửa skill nếu bạn chưa yêu cầu rõ.

## Frontend

Khi làm UI, Codex đọc `.agents/references/frontend-profile.md`.

Quy tắc chính:

- Không chọn Vite/React/Tailwind, Next.js, hoặc stack khác nếu `SPEC.md` chưa yêu cầu.
- Không tạo component library/design tokens sớm.
- Chỉ tách shared component khi có 2-3 use case thật.
- Task UI nên chia nhỏ: route shell, static UI, state/data, validation, tests, E2E.
- Acceptance cần có responsive, accessibility, loading/error/empty states, keyboard navigation, performance budget.

## Backend

Khi làm API/server, Codex đọc `.agents/references/backend-profile.md`.

Quy tắc chính:

- Không chọn runtime/framework/database nếu `SPEC.md` chưa ghi lý do.
- Contract phải rõ request/response types.
- Validate ở boundary: HTTP input, webhook, external API response, env vars, uploads.
- Protected data phải có authn/authz và ownership checks.
- List endpoints cần pagination hoặc giới hạn rõ.
- Task backend nên chia nhỏ: contract, route/service, persistence/integration, hardening, tests, docs.

## Token-Efficient Mode

Repo này được thiết kế để giảm context phình to:

- `AGENTS.md` chỉ giữ luật luôn cần.
- Hướng dẫn dài nằm trong `.agents/references/`.
- Tách phase trong chế độ tương tác; `$vibe-build all` chỉ giữ evidence gọn khi đi qua checkpoint.
- Không đọc toàn repo nếu task chỉ cần vài file.
- Không gọi nhiều MCP/tool nếu shell/CLI deterministic là đủ.
- Với GitHub data, ưu tiên `gh pr diff`, `gh pr view --json ...`, hoặc lưu diff/log vào file rồi đọc lát cắt.

## Cấu Trúc Repo

```text
.
├── AGENTS.md                     # Runtime rules loaded often
├── SPEC.md                       # Product/source-of-truth spec
├── tasks/
│   ├── plan.md                   # Detailed task plan
│   ├── todo.md                   # Live progress checklist
│   ├── test-plan.md              # Browser/E2E suites
│   └── test-result.md            # Non-pass E2E evidence
├── scripts/
│   └── init-project.sh            # Reset template state and initialize Git
├── .agents/
│   ├── skills/                   # Repo-scoped Codex skills
│   └── references/               # Long checklists read on demand
└── .codex/
    └── agents/                   # Custom subagents
```

## Custom Agents

Chỉ dùng subagents khi bạn yêu cầu rõ. Các agent có sẵn:

| Agent | Khi dùng |
|-------|----------|
| `code-reviewer` | Review correctness, readability, architecture, security, performance |
| `security-auditor` | Security review, threat model, hardening |
| `test-engineer` | Test strategy, missing coverage, regression tests |

## Quy Tắc Hoàn Thành

Một task chỉ được coi là xong khi có evidence:

- Test/build/typecheck/lint output nếu project có runtime.
- Browser/E2E evidence nếu task có UI flow.
- Markdown/file inspection nếu chỉ đổi docs.
- `tasks/todo.md` và `tasks/plan.md` được cập nhật khi scope/task thay đổi.

## Credits

Template gốc được tạo trong quá trình Vibe Code tại NETCORE LTD bởi Dung Vo. Bộ skills kế thừa ý tưởng từ [agent-skills](https://github.com/addyosmani/agent-skills) và [caveman](https://github.com/JuliusBrussee/caveman), sau đó được chỉnh lại cho Codex.
