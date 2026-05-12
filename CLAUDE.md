# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This directory is a **git submodule** (`wmsProjectClient`) of the WMS umbrella repo. It is a standard Create React App project — works standalone as long as a backend (real or mocked) is reachable on `REACT_APP_API_URL`.

## Stack

- React **19** + react-router-dom **7** (file-based naming under `src/pages/`, wired in `src/routes/AppRouter.js`).
- Redux Toolkit (`@reduxjs/toolkit`) + react-redux. Slices live in `src/store/slices/`: `authSlice.js` + три кеша справочников (`warehousesSlice`, `suppliersSlice`, `employeesSlice`) — последние используются через хуки `useWarehouses`/`useSuppliers`/`useEmployees`, кешируют список по `orgId`, очищаются на logout. Остальные domain-данные грузятся ad-hoc из `src/services/*Service.js` или через `useDirectoryFetch` — не расширять Redux без необходимости.
- MUI **7** (`@mui/material`, `@mui/icons-material`, Emotion). **Grid v2 only** — use `<Grid size={{ xs: 12, md: 4 }}>`, never `<Grid item xs={12} md={4}>` (the old API silently no-ops in v7).
- Build/tooling: `react-scripts` 5 (CRA, no eject). No TypeScript. ESLint config in `.eslintrc.json` (extends `react-app`); Prettier in `.prettierrc.json`.
- **Формы**: `react-hook-form` + `yup` через `@hookform/resolvers/yup`. Централизованные схемы в `src/validation/schemas.js` (RU-сообщения). MUI `<TextField {...register('field')}>` + `error={!!errors.field}` + `helperText={errors.field?.message}`. Для `<Select>`/`<Autocomplete>` — `<Controller>`. Массивы — `useFieldArray`. Не писать ad-hoc `if (!form.x) notify('warning')` — добавлять схему в `schemas.js`.

## Commands

```bash
npm install
npm start          # dev server on :3000, proxies via REACT_APP_API_URL
npm run build      # production bundle into build/
npm test           # CRA test runner — watch mode by default
npm test -- --watchAll=false           # single CI-style run
npm test -- --testPathPattern=Login    # filter by path
```

## Source layout

```
src/
├── pages/          # one file per route (16 working pages, see route map)
├── routes/AppRouter.js     # all routes + ProtectedRoute/RoleGuard/GuestRoute guards
├── components/
│   ├── layout/     # GuestLayout, MainLayout, Navbar, MainNavbar
│   └── shared/     # ConfirmDialog, RackDialog, EmptyState, ErrorBoundary,
│                   #   LoadingSkeleton, OAuthButtons
├── context/
│   ├── SnackbarContext.js  # global toast — useSnackbar() hook
│   └── AuthContext.js      # legacy (Redux is the source of truth, but exists)
├── hooks/
│   ├── index.js            # useWarehouses, useEmployees, useSuppliers,
│   │                       #   useInventoryByWarehouse
│   └── useDirectoryFetch.js # generic { data, loading, error, refresh, setData }
├── services/       # per-domain API clients on httpService:
│                   #   auth, profile, organization, warehouse, product,
│                   #   document, analytics, supplier, supply, shipRequest,
│                   #   erpExtractor + httpService (base)
├── store/
│   ├── api.js      # configured axios instance with interceptors
│   ├── index.js    # configureStore — only `auth` slice registered
│   └── slices/authSlice.js
├── config/
│   ├── api.js      # API_ENDPOINTS — single source of truth for backend URLs
│   └── theme.js    # MUI theme
└── App.js, index.js, setupTests.js
```

### Route map (`src/routes/AppRouter.js`)

```
/auth/callback       → OAuthCallbackPage              (always accessible)

# GuestLayout (only when NOT authenticated — GuestRoute redirects to /main otherwise)
/                    → HomePage
/login               → LoginPage
/register            → RegisterPage              (fork: invitation vs director)
/register/director   → RegisterDirectorPage      (form → /api/auth/register/director)
/register/invitation → RegisterByInvitationPage  (form → /api/auth/register/invitation)

# MainLayout (ProtectedRoute → /login if not authenticated; ErrorBoundary wraps Outlet)
/main                → MainPage              (dashboard with role-aware quick-actions)
/main/profile        → ProfilePage           (ALL)
/main/settings       → SettingsPage          (ALL)
/main/organization   → OrganizationPage      (DIRECTOR)
/main/employees      → EmployeesPage         (DIRECTOR)
/main/receive        → ReceivePage           (WORKER, DIRECTOR)
/main/ship           → ShipPage              (WORKER, DIRECTOR)
/main/inventory      → InventoryPage         (ALL)
/main/writeoff       → WriteoffPage          (ACCOUNTANT, DIRECTOR)
/main/revaluation    → RevaluationPage       (ACCOUNTANT, DIRECTOR)
/main/analytics      → AnalyticsPage         (ACCOUNTANT, DIRECTOR)
/main/suppliers      → SuppliersPage         (ACCOUNTANT, DIRECTOR)
/main/supplies       → SuppliesPage          (ALL)
/main/documents      → DocumentsPage         (ALL)
/main/erp-extractor  → ErpExtractorPage      (DIRECTOR)

*                    → <Navigate to="/" />
```

Route guarding via three thin wrappers in `AppRouter.js`: `ProtectedRoute` (auth-required), `RoleGuard allowed={[...]}` (specific roles), `GuestRoute` (login/register only when logged out). All read `selectIsAuthenticated` / `selectUser`. When adding an authenticated page: drop a file in `pages/`, import in `AppRouter.js`, add a `<Route>` under `/main` with appropriate `RoleGuard`, and register a navbar entry in `MainNavbar.js` `NAV_ITEMS` with matching `allowed`.

## API integration

- **Single source of truth for endpoints**: `src/config/api.js`. All paths are relative (`API_BASE_URL = ''`) — resolved against axios `baseURL` or dev/prod proxy. **Never hardcode** `/api/...` in components/services.
- **Single HTTP layer** (C.7 done 2026-05-07): `src/store/api.js` is the axios-инстанс с request-interceptor (Bearer из localStorage) и response-interceptor (auto refresh на 401, error → `Error` с `.status`/`.data`, при провале refresh — clears tokens + redirect на `/login`, кроме гостевых страниц). `src/services/httpService.js` — тонкая обёртка над тем же `api`, сохраняющая публичный API (`get/post/put/patch/delete/postFormData/setTokens/clearTokens/refreshAccessToken/downloadFile` + опция `includeAuth: false`). Все `*Service.js` ходят через `httpService`; Redux thunks (только `authSlice.js`) ходят напрямую через `api` — обе точки используют один axios-инстанс, поэтому refresh/редиректы единые.
  - Tokens в `localStorage` (`accessToken`, `refreshToken`, `user`); axios читает их в request-интерсепторе при каждом запросе.
  - **Не вводить третий HTTP-слой.** Не возвращать `fetch` в сервисы. Если нужен blob-download — `httpService.downloadFile` или `documentService.download` (последний оставлен на сыром fetch потому, что проще для blob-стрима).
- **Tokens**: `clearAuthData()` in `store/api.js` is the canonical clearer.
- **Backend URL**: `REACT_APP_API_URL` defaults to `http://localhost:8765` (gateway). In Docker, nginx proxies `/api` → `api-gateway:8765`.

## Auth flow

- **Login**: POST `/api/auth/login` returns only `{ accessToken, refreshToken }`. Client then calls `/api/auth/me` to get user object (`UserResponse` with `userId`, `email`, `fullName`, `role`, `photoBase64`, `organizationId`, `warehouseId`).
- **Registration** (no role picker — backend has only two paths):
  - `POST /api/auth/register/director` — DIRECTOR account without org. After register, page redirects to `/main/organization?firstTime=true` for org-creation onboarding.
  - `POST /api/auth/register/invitation` — invitee with `invitationToken` from email. Email/role/orgId/warehouseId baked into invitation; backend validates email match.
- **OAuth** (Google/Yandex): `OAuthButtons` saves `oauthIntent` (`{ type, invitationToken?, ts }`) into localStorage with 10-min TTL **before** redirect. After callback:
  - Existing user (response has `access_token + refresh_token`) → store, decode JWT, navigate to `/main`. If `oauthIntent` was set (user expected register), show info "У вас уже есть аккаунт".
  - New user with `intent.type === 'register-director'` → auto `completeOAuthRegistration({role: 'DIRECTOR'})` → `/main/organization?firstTime=true`.
  - New user with `intent.type === 'register-invitation'` → auto `completeOAuthRegistration({invitationToken})` → backend validates email match, sets role/org/warehouse from invitation → `/main`.
  - No intent → error "Регистрация была прервана" → `/register`. **No silent fallback to a manual role-picker** — `RoleSelectPage` was deleted.
- **Bootstrap on F5**: `AppRouter` runs `bootstrapUser` thunk if `accessToken` exists but `user` is null (after page reload, missed login window etc).
- **Refresh**: any 401 triggers single retry with `/api/auth/refresh` (logic duplicated in both HTTP layers).
- **Roles** in `user.role` (singular): `WORKER`, `ACCOUNTANT`, `DIRECTOR`. **Don't add a fourth role.**

### Redux store

`store/index.js` registers `auth` + три directory-cache reducer'а: `warehouses`, `suppliers`, `employees`. Большинство domain-данных не в Redux — страницы используют сервисы напрямую или общие хуки.
- `authSlice` thunks: `login`, `registerDirector`, `registerByInvitation`, `completeOAuthRegistration`, `logout`, `fetchProfile`, `updateProfile`, `bootstrapUser`. Selectors: `selectAuth`, `selectUser`, `selectIsAuthenticated`, `selectAuthLoading`, `selectAuthError` — обращайтесь через них.
- Directory slices экспортируют `fetchX(orgId)` thunk + actions `invalidateX()` / `setX(list)`. Доступ к ним обычно идёт через хуки `useWarehouses`/`useSuppliers`/`useEmployees`, а не напрямую. Кеш ключуется по `orgId` (`loadedForKey`), `logout.fulfilled` сбрасывает кеш в initialState.

## Shared infrastructure (use these, don't reinvent)

### Global toast — `useSnackbar()`
```js
import { useSnackbar } from '../context/SnackbarContext';
const { notify } = useSnackbar();
notify('Сохранено');                    // success (default)
notify('Ошибка', 'error');
notify('Внимание', 'warning', { duration: 6000 });
```
**Don't** create local `Snackbar`/`toast` state in pages. The provider is wired in `App.js`.

### `<ConfirmDialog />` for any destructive action
```jsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  busy={busy}                           // disables buttons + shows spinner
  title="Удаление склада"
  message={<>Удалить склад <b>{wh.name}</b>?</>}
  confirmText="Удалить"                 // default 'Подтвердить'
  confirmColor="error"                  // default 'primary'
/>
```
**Don't** write inline `<Dialog>` for confirms — every page already uses `ConfirmDialog`.

### `<EmptyState />` for "no data" placeholders
```jsx
<EmptyState
  icon={WarehouseIcon}
  title="У вас ещё нет складов"
  description="Создайте первый склад…"
  actionLabel="Добавить склад"
  onAction={() => setOpen(true)}
/>
```

### `<TableSkeleton />` / `<ListSkeleton />` / `<CardsSkeleton />` / `<FormSkeleton />`
Use these **instead of** `<CircularProgress />` for any list/table/cards loading state — keeps layout stable, less flashy.

### `<ErrorBoundary />`
Already wraps `<Outlet />` in `MainLayout`. Render-time errors on a single page won't kill the whole app.

### `<PageBreadcrumbs />` (хлебные крошки)
Подключён в `MainLayout` под navbar — отображается автоматически на всех страницах под `/main` (кроме самой `/main`). Конфиг сегментов — `ROUTE_LABELS` в `components/shared/PageBreadcrumbs.js`. При добавлении нового роута под `/main` — добавить туда лейбл. Если нужны динамические сегменты (например `Ship › request abc › pick`) — передать `<PageBreadcrumbs items={[...]} />` явно в самой странице.

### `<FormWizard />` для многошаговых форм
```jsx
<FormWizard
  steps={[
    { key: 'recipient', label: 'Получатель', fields: ['recipientName', 'plannedDate'], render: () => <Step1 /> },
    { key: 'items', label: 'Товары', fields: ['warehouseId', 'items'], render: () => <Step2 /> },
    { key: 'review', label: 'Подтверждение', fields: [], render: () => <Step3 /> },
  ]}
  trigger={trigger}        // RHF trigger
  onSubmit={handleSubmit(onSubmit)}
  busy={busy}
  submitLabel="Создать"
  onCancel={onClose}        // опционально — кнопка слева внизу
/>
```
Перед переходом «Далее» вызывается `trigger(step.fields)` — пользователь не пройдёт мимо невалидных полей. На последнем шаге кнопка «Далее» меняется на `submitLabel`. Применён в ReceivePage (массовая приёмка) и ShipPage CreateRequestDialog.

### Hooks for directory data (use these instead of manual `useEffect` + `service.list()`)
```js
import { useWarehouses, useEmployees, useSuppliers, useInventoryByWarehouse } from '../hooks';

const { data: warehouses, loading, error, refresh } = useWarehouses();
// data is always Array. refresh() reloads.
```
- `useWarehouses` / `useSuppliers` / `useEmployees` сидят на Redux-кеше (`warehousesSlice` / `suppliersSlice` / `employeesSlice`). Список грузится один раз на текущий `orgId` и шарится между страницами; повторные mount'ы отдают данные мгновенно. После CRUD-операций страница, владеющая мутацией, вызывает `refresh()` — обновлённый кеш виден всем подписчикам. Logout очищает кеш через `extraReducers`.
- `useInventoryByWarehouse` остался на `useDirectoryFetch` (зависит от warehouseId, меняется после операций — кеширование вредно).
- For other one-off fetches: `useDirectoryFetch(fetcher, deps)` from `hooks/useDirectoryFetch.js`.

## UI conventions

- All user-facing strings, error messages, console messages — in **Russian**. Don't translate.
- MUI is the only UI kit. Use `sx` prop and theme tokens (`config/theme.js`) — no inline `style={}`, no CSS files.
- **Page wrapper for data pages**:
  ```jsx
  <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
    <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
      ...
    </Box>
  </Box>
  ```
- **Narrow forms** (Login/Register/Profile/Settings): centered Paper with `maxWidth: 400-680`, no full-bleed background.
- **Status chips**: `success` green, `warning` orange, `error` red, `default` grey. Use `<Chip color={...} size="small" />`.
- **Icons**: from `@mui/icons-material`.

## Backend gotchas

- Many product-service POSTs expect parameters **as `@RequestParam` (query)**, not body — especially inventory-check endpoints (`/start`, `/{id}/record`, `/{id}/complete`). Check the controller before assuming JSON body.
- Headers: backend often requires `X-User-Id`, `X-User-Role`, `X-Organization-Id` explicitly. Gateway should propagate from JWT but doesn't always — if you see `400 Required header missing`, set the header explicitly in the request.
- Many product-service responses are `Map<String, Object>` (untyped). Field shapes can vary — render defensively.
- All IDs are UUIDs (strings on the client).
- **Registration**: legacy `POST /api/auth/register` **does not exist**. Only `/register/director` and `/register/invitation`.
- **Backend extensions made in this codebase** (require service rebuilds):
  - `EmployeeResponse` (org-service) — extra fields `isActive`, `isBlocked`.
  - `CompleteOAuthRegistrationRequest` + `OAuthService` (sso-service) — `invitationToken` field + invitation OAuth handling with email match check.

## Environment files

- `.env` — local dev defaults (committed).
- `.env.example` — template (`REACT_APP_API_URL`, `REACT_APP_ENV`).
- `.env.production` — used by `npm run build`.
- All env vars must be prefixed `REACT_APP_` (CRA constraint).

## When adding a new backend endpoint

1. Add URL (or URL-builder function) to `src/config/api.js` under the right `API_ENDPOINTS` section — **never** hardcode `/api/...` in a component/service.
2. Use it from a `services/<domain>Service.js` (fetch via `httpService`) or from a Redux thunk (axios via `store/api.js`). Don't call `fetch`/`axios` directly from components.
3. If it's authenticated, services and the axios instance attach the Bearer token automatically — don't pass manually.
4. Gateway route lives in `backend/api-gateway/.../GatewayConfig.java`. Existing prefixes: `/api/auth`, `/api/profile`, `/api/oauth`, `/api/organizations`, `/api/invitations`, `/api/warehouses`, `/api/racks`, `/api/products`, `/api/batches`, `/api/operations`, `/api/inventory`, `/api/inventory-check`, `/api/analytics`, `/api/supplies`, `/api/suppliers`, `/api/erp-extractor`, `/api/product-card`, `/api/documents`. New prefix → edit `GatewayConfig.java`.

## Docker

`Dockerfile` is a two-stage build (Node → nginx) using `nginx.conf`. The nginx config proxies `/api` to the `api-gateway` container hostname — meant to run **alongside** the backend stack, not standalone.

## Where to look for context

- `../CLIENT_PLAN.md` (in umbrella repo) — outstanding work, sprints, technical debt items (C.7 HTTP-merge, C.8 Redux slices, etc.).
- `../FLOWS.md` — backend flows still missing.
- `../CLAUDE.md` (umbrella) and `../backend/CLAUDE.md` — overall architecture and backend details.
