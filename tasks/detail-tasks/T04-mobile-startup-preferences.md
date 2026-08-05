# T04 — Mobile startup, guest identity, localization, and preferences

Status: pending

## Outcome

Biến Home placeholder thành startup slice thật: hydrate non-sensitive preferences,
khôi phục guest identity an toàn, chọn vi/en, áp dụng `folk_default`, và cho phép
mở sheet **Tùy chỉnh / Customize** mà không làm mất active session metadata.

## Dependencies and skills

- Dependencies: T01.
- Required skills: `vibe-build`, `vibe-test`, `frontend-ui-engineering`,
  `security-and-hardening`, `source-driven-development`.
- Read first: `SPEC.md` UI/art, Cosmetic loadout, Localization, Expo mobile app,
  Environment, Mobile tests và UI acceptance.

## Technical contract

1. Zustand store chỉ chứa app-wide preference/session shell. `persist` phải
   `partialize` đúng `locale`, `uiThemeId`, `cardSkinId`, `boardThemeId`; active
   room/session connection và credentials không được ghi vào AsyncStorage.
2. Hydration boundary giữ splash/loading state cho tới khi preferences đã resolve;
   không flash sai locale/theme. Corrupt JSON, unsupported locale hoặc unknown
   cosmetic ID đều fallback an toàn, không crash.
3. First launch dùng device locale nếu là `vi` hoặc `en`, nếu không dùng `en`.
   Sau khi user chọn trong app, saved choice luôn thắng device locale.
4. `i18n-js` có một typed key set và hai dictionaries đầy đủ. Bao gồm route
   labels, Home actions, customize labels, status/error placeholders, card names
   và accessibility names. Protocol/error code không dịch trong shared types.
5. `folk_default` là entry MVP duy nhất cho UI/card/board. Dùng typed IDs và
   static asset mapping trực tiếp; không tạo plugin registry/shop abstraction.
6. Guest ID/reconnect credential service dùng SecureStore. Guest ID có thể tạo ở
   startup, nhưng không log raw value và không nằm trong Zustand persisted slice.
7. Home có hai primary actions **Chơi với bot** và **Phòng online**, cùng sheet
   customize. Các route chưa làm có thể điều hướng tới explicit placeholder,
   không để button giả không hoạt động.

## Implementation steps

1. Tra docs chính thức cho Zustand persist storage adapter, Expo Localization,
   SecureStore và app locale declaration theo versions đã pin ở T01.
2. Viết tests cho preference migration/fallback/hydration trước.
3. Tạo typed dictionaries; thêm test so key sets vi/en và fail khi thiếu key.
4. Tạo static cosmetic/loadout mapping và normalization về `folk_default`.
5. Tạo SecureStore guest identity service độc lập khỏi preference store.
6. Wire startup boundary, Home và Customize sheet bằng selectors nhỏ để đổi
   locale/theme không re-render gameplay tree không liên quan.
7. Kiểm tra AsyncStorage payload và logs để xác nhận không có credential/token.

## Likely files

- `mobile/src/store/app-store.ts`, `mobile/src/store/persistence.ts`
- `mobile/src/i18n/index.ts`, `mobile/src/i18n/vi.ts`, `mobile/src/i18n/en.ts`
- `mobile/src/cosmetics/catalog.ts`, `mobile/src/cosmetics/normalize.ts`
- `mobile/src/security/guest-identity.ts`
- `mobile/src/screens/HomeScreen.tsx`, `mobile/src/components/CustomizeSheet.tsx`
- `mobile/app/index.tsx`, Expo app config và focused tests

## Acceptance criteria

- [ ] Fresh `vi`/`en`/unsupported device locales resolve đúng; in-app override
  survives relaunch và dictionaries có cùng typed keys, gồm accessibility/error
  labels.
- [ ] Valid preferences hydrate trước Home; corrupt/unknown values fallback
  `en`/`folk_default`; active session metadata không bị xóa khi đổi locale.
- [ ] AsyncStorage chỉ có four preference fields; guest/reconnect credential ở
  SecureStore, không xuất hiện trong route params, Zustand persisted payload hay logs.

## How to run

```bash
npm run test --workspace mobile -- --runInBand --testPathPattern="store|i18n|cosmetic|Home"
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run dev:mobile
npm run mobile:android
npm run mobile:ios
npm run verify
git diff --check
```

Manual matrix: fresh install với device locale `vi`, `en`, một locale khác; đổi
language, force-close/reopen, corrupt saved preference bằng test adapter và kiểm
fallback. Không dump SecureStore value vào evidence.

## Evidence to record

- Jest output cho hydrate/fallback/dictionary parity.
- Android/iOS screenshots Home ở vi/en và Customize sheet.
- Sanitized key list của AsyncStorage, không ghi value nhạy cảm.

## Explicitly skipped

- Multi-theme shop, Supabase sync, login, online rooms và final battle screens.

