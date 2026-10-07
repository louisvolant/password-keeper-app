# Securaised (Password Keeper)

A secure web application for sharing self-destructing ("burn after read") temporary content and encrypted credentials, featuring user authentication, session security, and account management. Built with **Next.js (App Router)**, **React 19**, **TypeScript**, and **MongoDB**, deployed globally on **Cloudflare Workers** using **OpenNext**.

---

## Table of Contents

- [Overview & Core Value](#overview--core-value)
- [Complete Feature Review](#complete-feature-review)
  - [1. Zero-Knowledge Personal Vault](#1-zero-knowledge-personal-vault)
  - [2. Ephemeral Secret Sharing (Burn-After-Read)](#2-ephemeral-secret-sharing-burn-after-read)
  - [3. Authentication & Account Management](#3-authentication--account-management)
  - [4. UI/UX & Responsive Experience](#4-uiux--responsive-experience)
- [Security Architecture & Cryptography](#security-architecture--cryptography)
- [Database Schema (MongoDB)](#database-schema-mongodb)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment (Cloudflare Workers)](#deployment-cloudflare-workers)
- [License](#license)

---

## Overview & Core Value

**Securaised** solves two distinct security challenges in a single web interface:
1. **Encrypted Vault Storage:** Store private notes, credentials, and snippets in an organized file and folder hierarchy where data is encrypted client-side before transmission. The server never receives or stores your plaintext or master encryption key.
2. **Ephemeral Secret Sharing:** Share sensitive text snippets (passwords, tokens, credentials) with colleagues or recipients via expiring, single-use, or password-protected temporary links.

---

## Complete Feature Review

### 1. Zero-Knowledge Personal Vault (`/securecontent`)

- **KeePass-Compatible Vault:** Each authenticated user gets a personal `.kdbx` vault, encrypted client-side by KeeWeb with the user's master password. The server only ever stores ciphertext.
- **Session-Scoped R2 Proxy (`/api/vault`):** `GET` downloads, `PUT` creates/replaces, `HEAD` stats, and `DELETE` removes the vault stored at `vaults/{userId}/database.kdbx` on Cloudflare R2. The R2 key is derived exclusively from the MongoDB-verified session identity, so accessing another user's vault (IDOR) is impossible and no storage credentials ever reach the browser.
- **Optimistic Concurrency:** `PUT` honors `If-Match` against the current R2 ETag (`412 Precondition Failed` on conflict); KeeWeb revision checks use the `Last-Modified` header.
- **Lazy Initialization (Option A):** No server-side `.kdbx` is pre-generated. A `404` on first `GET` lets KeeWeb offer "Create a new file"; the first save flips `hasVault: true` in MongoDB.
- **Embedded KeeWeb Client:** The static KeeWeb SPA (fetched via `npm run keeweb:setup` from the official `keeweb/keeweb` releases) is served same-origin and pre-configured (`public/keeweb-config.json`) with a locked-down WebDAV connector to `/api/vault`, third-party storages disabled, and `showOnlyFilesFromConfig` enforced. The page also offers backup download, vault deletion, and sync status.

### 2. Ephemeral Secret Sharing (Burn-After-Read) (`/temporarycontent`)

- **Customizable Access Strategies:**
  - **Burn After Read (`oneread`):** Content is permanently deleted from MongoDB immediately after the first successful retrieval.
  - **Multiple Reads (`multipleread`):** Content remains accessible until the specified expiration deadline.
- **Configurable Expiration:** Choose lifespan intervals of **1 Hour**, **1 Day**, **1 Week**, or **1 Month**. Expired content is purged upon lookup or via deletion.
- **Optional Password Protection:** Add an optional password (minimum 8 characters) to encrypt the content. Passwords are hashed with `Argon2id` on the server before verification.
- **Dual-Layer Content Encryption:** Text is encrypted with AES-256-CBC using a per-secret random 16-byte initialization vector (IV) and a key derived from the password (or a fallback default key).
- **Public Recipient Interface (`/securelinkview/[id]`):**
  - Standalone reader interface for external recipients.
  - Detects password-protected links and presents a clean decryption prompt.
  - Displays read-only decrypted text once validated.
- **User Link Management Dashboard:** Authenticated users can review active temporary links, check expiration timestamps, copy links to clipboard, or manually revoke/delete links before expiration.

### 3. Authentication & Account Management

- **Credentials Authentication:**
  - Email/username + password registration and login.
  - Minimum password length policy of 15 characters enforced on registration.
  - High-security password hashing using **Argon2id** (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 1`).
  - Backward compatibility support for SHA-256 salted hashes.
- **Google OAuth 2.0 Integration:**
  - One-click Google Sign-In via `/api/auth/google` and `/api/auth/callback/google`.
  - Automatic account provisioning with unique generated usernames and Argon2-hashed passwords.
- **Session Security:**
  - Stateless, encrypted session cookies using AES-256-GCM with authentication tags (`session.ts`).
  - Signed, `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies with 24-hour expiration.
  - Protected client routes via `<ProtectedRoute>` wrapper with automatic redirect to login modal.
- **Password Reset Flow:**
  - Forgot password request (`/passwordlost`) generating cryptographically secure 32-byte tokens valid for 24 hours.
  - Transactional reset email delivery via **Mailjet API**.
  - Secure token verification and reset interface (`/passwordrenew?token=...`).
  - In-app password change for authenticated users (`/passwordchange`).
- **Complete Account Deletion (GDPR-Compliant):**
  - User-initiated one-click deletion modal with confirmation safeguards (`/account`).
  - Completely wipes user credentials, file tree, vault contents, and temporary links from MongoDB.
  - Clears active session cookies and redirects to the landing page.

### 4. UI/UX & Responsive Experience

- **Theme Engine:** Fully integrated Light and Dark mode toggle with `localStorage` persistence and automatic fallback to `prefers-color-scheme`.
- **Responsive Layout:** Adaptive desktop navigation bar and mobile drawer sidebar (`Navbar.tsx` and `Header.tsx`).
- **Modal System:** Context-driven modal architecture (`AuthModalContext`) supporting seamless switching between Login and Registration dialogs without page reloads.
- **External Network Hub:** Curated directory of companion tools and projects integrated into navigation and footer.
- **Performance & SEO:** Pre-configured `@vercel/speed-insights`, per-page canonical URLs and `noindex` directives on private pages (App Router `metadata` exports), OpenGraph social cards, and mobile-friendly touch targets.

---

## Security Architecture & Cryptography

| Security Dimension | Implementation |
|---|---|
| **Vault Encryption** | Client-Side AES-256 (`crypto-js`). Plaintext never reaches the server. |
| **Vault Key Storage** | Kept exclusively in transient React state. Never saved to disk or storage. |
| **Session Tokens** | AES-256-GCM encrypted payload (`iv:tag:ciphertext`) stored in `HttpOnly` cookies. |
| **User Passwords** | Argon2id (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 1`) on Node.js, PBKDF2-SHA256 (600k iterations, WebCrypto) fallback on Cloudflare Workers where native modules cannot load. |
| **Temporary Links** | AES-256-CBC with random 16-byte IV. Passwords verified with Argon2id. |
| **Reset Tokens** | 32-byte random hex tokens stored with 24-hour TTL in MongoDB. |
| **Database Access** | Parameterized queries with Mongoose ODM against MongoDB Atlas. |

---

## Database Schema (MongoDB)

The application utilizes 3 core collections defined in `src/lib/userDao.ts`:

1. **`Users`**:
   - `supabase_id`: Unique user UUID.
   - `username`: Unique username (case-insensitive search).
   - `email`: Unique email address.
   - `hashed_password`: Argon2id or legacy salted SHA-256 hash.
   - `password_version`: Version marker (1 for Argon2id, 3 for PBKDF2-SHA256 on Workers).
   - `hasVault`: Whether a `.kdbx` vault exists on R2 (set on first `PUT /api/vault`).
   - `vaultLastSync`: Timestamp of the last successful vault save.
   - `created_at`: Creation timestamp.

2. **`TemporaryContent`**:
   - `supabase_user_id`: Creator UUID.
   - `identifier`: Public UUID for access URL.
   - `hashed_password`: Optional Argon2id hash for password-protected links.
   - `max_date`: Expiration date.
   - `encoded_content`: AES-256-CBC encrypted payload.
   - `iv`: Initialization vector in hex format.
   - `strategy`: `'oneread'` or `'multipleread'`.
   - `created_at`: Creation timestamp.

3. **`PasswordResetTokens`**:
   - `supabase_user_id`: User UUID.
   - `token`: 64-character hex reset token.
   - `expires_at`: 24-hour expiration timestamp.
   - `created_at`: Creation timestamp.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Route Handlers)
- **Deployment Platform:** [Cloudflare Workers](https://workers.cloudflare.com/) via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare)
- **Configuration & CLI:** [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (with `keep_vars = true`)
- **Frontend Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & ODM:** [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [daisyUI](https://daisyui.com/)
- **Cryptography & Auth:** `argon2` (Argon2id), native Node.js `crypto`
- **Email Service:** `node-mailjet` (Mailjet v3.1 API)
- **HTTP Client:** `axios`
- **Icons:** `lucide-react`
- **Analytics & SEO:** `@vercel/speed-insights`, native App Router metadata routes (`sitemap.ts`, `robots.ts`) and per-page canonical/noindex metadata

---

## Project Structure

```
.
├── src/
│   ├── app/                                # Next.js App Router pages and routes
│   │   ├── api/                            # Backend API Route Handlers
│   │   │   ├── vault                       # KeePass vault R2 proxy (GET/PUT/HEAD/DELETE/OPTIONS)
│   │   │   ├── vault/status                # Lightweight vault metadata for the dashboard
│   │   │   ├── auth/google                 # Google OAuth initialization
│   │   │   ├── auth/callback/google        # Google OAuth callback & user provisioning
│   │   │   ├── login                       # Credential login
│   │   │   ├── register                    # User registration
│   │   │   ├── logout                      # Session invalidation
│   │   │   ├── check-auth                  # Session verification
│   │   │   ├── delete_my_account           # Account & data purge
│   │   │   ├── savetemporarycontent        # Create expiring link
│   │   │   ├── gettemporarycontent         # Retrieve & burn expiring link
│   │   │   ├── getusertemporarycontent     # List user's active expiring links
│   │   │   ├── deleteusertemporarycontent  # Revoke an expiring link
│   │   │   └── password/                   # Change & Mailjet reset handlers
│   │   ├── account/                        # Account hub & deletion modal
│   │   ├── securecontent/                  # KeePass vault UI with embedded KeeWeb client
│   │   ├── temporarycontent/               # Ephemeral link generator & dashboard
│   │   ├── securelinkview/[id]/            # Public recipient decryption view
│   │   ├── passwordlost/                   # Forgot password request
│   │   ├── passwordrenew/                  # Password renewal with reset token
│   │   ├── passwordchange/                 # Authenticated password update
│   │   ├── confidentiality-rules/          # Privacy policy page
│   │   ├── general-conditions/             # Terms and conditions page
│   │   ├── layout.tsx                      # Root HTML shell & providers
│   │   ├── sitemap.ts                      # Generated sitemap.xml (indexable pages only)
│   │   ├── robots.ts                       # Generated robots.txt (blocks private areas)
│   │   ├── ClientLayout.tsx                # Client wrapper with Header/Navbar/Modals
│   │   └── page.tsx                        # Home landing page with feature cards
│   ├── components/                         # UI components
│   │   ├── ui/                             # Buttons, inputs, alerts, cards
│   │   ├── Header.tsx                      # Main top bar with auth status
│   │   ├── Navbar.tsx                      # Mobile slide-out navigation
│   │   ├── AuthModal.tsx                   # Unified Login/Register modal dialog
│   │   ├── LoginForm.tsx                   # Credentials & Google login form
│   │   ├── ConfirmationModal.tsx           # Destructive action confirmation dialog
│   │   ├── ProtectedRoute.tsx              # Client-side route guard
│   │   └── HomePageFeatures.tsx            # Feature grid presentation
│   ├── context/                            # React Context providers
│   │   ├── AuthContext.tsx                 # User auth state & session lifecycle
│   │   └── AuthModalContext.tsx            # Modal visibility & mode switcher
│   ├── lib/                                # Core utilities & backend connectors
│   │   ├── db.ts                           # Cached MongoDB Mongoose connection
│   │   ├── vault.ts                        # Session-scoped R2 vault helpers (keys, ETags, auth)
│   │   ├── session.ts                      # AES-256-GCM cookie encryption & decryption
│   │   ├── userDao.ts                      # Mongoose models and validation schemas
│   │   ├── temporary_content_api.ts        # Client API for temporary link operations
│   │   ├── api.ts                          # Client API for auth and account operations
│   │   └── logger.ts                       # Winston logger setup
│   └── styles/
│       └── globals.css                     # Tailwind CSS base styles
├── public/                                 # Favicons, logos, vendored static assets
│   ├── keeweb-config.json                  # KeeWeb runtime config (managed WebDAV connector)
│   └── keeweb/                             # KeeWeb static SPA (git-ignored, vendored by the prebuild hook)
├── scripts/
│   └── fetch-keeweb.sh                     # Downloads the KeeWeb web app from GitHub releases (idempotent)
├── open-next.config.ts                     # OpenNext Cloudflare adapter configuration
├── wrangler.jsonc                          # Cloudflare Workers configuration (keep_vars=true)
├── next.config.js                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind & daisyUI theme configuration
└── package.json
```

---

## API Reference

All endpoints are hosted same-origin under `/api/*`:

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/api/register` | No | Registers a new account (min 15 char password). |
| `POST` | `/api/login` | No | Authenticates credentials and sets encrypted session cookie. |
| `POST` | `/api/logout` | Yes | Clears session cookie. |
| `POST` | `/api/check-auth` | No | Verifies if current session cookie is valid. |
| `POST` | `/api/delete_my_account` | Yes | Permanently removes user account and created temporary links. |
| `GET` | `/api/auth/google` | No | Redirects to Google OAuth 2.0 authorization page. |
| `GET` | `/api/auth/callback/google` | No | Handles Google callback, logs in or auto-creates user, redirects to `/account`. |
| `POST` | `/api/savetemporarycontent` | Yes | Creates an expiring secret link (`oneread` or `multipleread`). |
| `GET` | `/api/gettemporarycontent` | No | Reads ephemeral content. Deletes if `oneread` or expired. |
| `GET` | `/api/getusertemporarycontent` | Yes | Returns all active temporary links created by the authenticated user. |
| `POST` | `/api/deleteusertemporarycontent`| Yes | Manually revokes and deletes a user's temporary link. |
| `POST` | `/api/password/change` | Yes | Updates password for authenticated user. |
| `GET` | `/api/vault` | Yes | Downloads the user's `.kdbx` vault (`404` when never created). |
| `PUT` | `/api/vault` | Yes | Creates/replaces the vault; honors `If-Match`, returns the new `ETag`. |
| `HEAD` | `/api/vault` | Yes | Vault metadata only (KeeWeb revision checks). |
| `DELETE` | `/api/vault` | Yes | Permanently removes the user's vault. |
| `GET` | `/api/vault/status` | Yes | Vault metadata (size, ETag, last sync) without downloading. |
| `POST` | `/api/password/reset/request` | No | Generates a 24h reset token and sends an email via Mailjet. |
| `GET` | `/api/password/reset/verify` | No | Validates whether a reset token is valid and unexpired. |
| `POST` | `/api/password/reset/reset` | No | Sets a new password using a verified reset token. |

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Session Security (Required)
SESSION_COOKIE_KEY=your_session_cookie_secret_key_here

# MongoDB Atlas Database Connection (Required)
MONGODB_ATLAS_USERNAME=your_mongodb_username
MONGODB_ATLAS_PASSWORD=your_mongodb_password
MONGODB_ATLAS_CLUSTER_URL=your_cluster_url.mongodb.net
MONGODB_ATLAS_DB_NAME=PasswordKeeperDB
MONGODB_ATLAS_APP_NAME=Cluster0

# Ephemeral Link Encryption (Recommended: 32-character string for AES-256)
AES_TEMPORARY_CONTENT_DEFAULT_KEY=your_32_character_default_key!

# Google OAuth 2.0 (Optional, callback is dynamically detected)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Mailjet Email Service for Password Reset (Optional)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
MAILJET_SENDER_EMAIL=contact@securaised.net
```

> **Vault storage (Cloudflare R2):** no env var is needed. Create the bucket once
> (`npx wrangler r2 bucket create password-keeper-vaults`, see the `r2_buckets`
> binding in `wrangler.jsonc`). The KeeWeb client is vendored automatically by
> the `prebuild` hook (`scripts/fetch-keeweb.sh`, idempotent) into the
> git-ignored `public/keeweb/` directory on every `npm run build`, including CI.
> Local dev emulates R2 automatically.

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn** / **pnpm**
- **MongoDB Atlas** cluster or a local MongoDB instance

### Installation & Run

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd password-keeper-app
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Useful Commands:
   ```bash
   npm run lint          # Run ESLint validation
   npm run test:e2e      # Run Playwright E2E test suite (register, login, secret links, logout)
   npm run test:e2e:ui   # Run Playwright with interactive UI mode
   npm run build:next    # Next.js production build & typecheck
   npm run build         # Build OpenNext Cloudflare bundle (.open-next/)
   npm run preview       # Preview Cloudflare Worker locally via Wrangler
   npm run deploy        # Build and deploy directly to Cloudflare Workers
   ```

---

## End-to-End Testing (Playwright)

The project includes an automated end-to-end test suite using [Playwright](https://playwright.dev/) located in [`e2e/`](file:///Users/louis/javascriptworkspace/password-keeper-app/e2e):

The test suite covers the complete user lifecycle:
1. **User Registration:** Fills form, registers account, and validates redirect to `/account`.
2. **User Logout:** Clears authenticated session and validates redirect / guest state.
3. **User Login:** Authenticates using created credentials and verifies session cookie.
4. **Create Ephemeral Link:** Stores encrypted temporary content and verifies generated share link.
5. **Decrypt & Read Secret:** Opens the secret URL in a separate browser context and verifies decrypted payload.
6. **Delete Ephemeral Link:** Deletes the temporary secret and confirms removal from the user link list.
7. **Final Logout:** Ensures user is completely logged out and protected routes are inaccessible.

Run the test suite locally (automatically launches local dev server):
```bash
npm run test:e2e
```

To run against a specific deployment (e.g., Cloudflare Workers):
```bash
PLAYWRIGHT_TEST_BASE_URL=https://password-keeper-app.volantlouis.workers.dev npm run test:e2e
```

A dedicated SEO suite (`e2e/seo.spec.ts`) verifies the Search Console hygiene:
canonical URLs on indexable pages, `noindex` on private pages, generated `sitemap.xml`/`robots.txt` content, and 308 redirects for removed pages and the apex (non-www) host.

## Deployment (Cloudflare Workers)

The application is deployed to **Cloudflare Workers** using [@opennextjs/cloudflare](https://opennext.js.org/cloudflare):

1. **Wrangler Configuration (`wrangler.jsonc`):**
   - Configured with `main = ".open-next/worker.js"`.
   - `compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]`.
   - `keep_vars = true` is explicitly configured to ensure environment variables set in the Cloudflare dashboard are preserved across automated and CLI deployments.
   - Assets are served using the `ASSETS` binding pointing to `.open-next/assets`.

2. **Environment Variables on Cloudflare:**
   - Add your production variables (from `.env.example`) via the Cloudflare Dashboard (**Workers & Pages** > `password-keeper-app` > **Settings** > **Variables and Secrets**) or via Wrangler:
     ```bash
     npx wrangler secret put SESSION_COOKIE_KEY
     npx wrangler secret put MONGODB_ATLAS_PASSWORD
     # Repeat for all required secrets
     ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```
   This compiles the Next.js app, packages it with OpenNext for Cloudflare Workers, and uploads the worker and static assets with `keep_vars = true`.

4. **Domain & SEO settings on Cloudflare (recommended):**
   - The app already enforces `https://www.securaised.net` as the canonical host via Next.js redirects and per-page canonical tags.
   - In the Cloudflare dashboard, enable **SSL/TLS > Edge Certificates > Always Use HTTPS** so plain `http://` requests never reach the worker (Search Console "Page with redirect" status for http URLs is expected and safe).
   - Run the Search Console **"Validate fix"** actions for the reported issues after deploying; canonical signals take a few days/weeks to settle.

---

## License

This project is licensed under the [MIT License](LICENSE).
