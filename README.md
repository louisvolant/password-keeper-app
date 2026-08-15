# Password Keeper (Securaised)

A secure web application for storing encrypted content — notes, files and secrets — with user authentication, client-side AES encryption, and shareable "burn after read" links. Built as a single Next.js app (App Router) that serves both the UI and its own API.

## Features

- User authentication (email/username + password, or Google OAuth)
- Client-side content encryption/decryption (CryptoJS AES)
- Secure cookie-based sessions
- Encrypted file tree + content stored in MongoDB
- Shareable temporary content links (one-read or multi-read) with optional password
- Automatic expiry of temporary content
- Responsive UI with TailwindCSS + daisyUI

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **API:** Next.js Route Handlers (`src/app/api/`)
- **Database:** MongoDB (Mongoose)
- **Auth:** Argon2 password hashing + signed session cookies + Google OAuth
- **Email:** Mailjet (password reset)
- **Styling:** TailwindCSS, daisyUI, shadcn/ui-style components
- **Markdown:** marked + turndown + sanitize-html (in the editor)

## Architecture

Single Next.js app, one process, same-origin:

```
src/
├── app/                  # Pages (App Router)
│   └── api/              # Backend API as Route Handlers
│       ├── login, register, check-auth, logout, delete_my_account
│       ├── auth/google, auth/callback/google
│       ├── getcontent, updatecontent, updatecontents
│       ├── getfiletree, updatefiletree, remove_file, remove_folder, rename
│       ├── savetemporarycontent, gettemporarycontent,
│       │   getusertemporarycontent, deleteusertemporarycontent
│       └── password/change, password/reset/{request,verify,reset}
├── components/           # Reusable UI components
├── context/              # Auth / modal / secret-key contexts
├── lib/                  # Shared helpers (db, session, userDao, crypto, api clients, logger)
└── styles/               # Global + quill styles
```

The API route handlers replace the former standalone Express backend. Sessions are signed/encrypted cookies (no external session store needed), and MongoDB is connected lazily per request via `src/lib/db.ts`.

## Prerequisites

- Node.js 18+
- npm
- A MongoDB Atlas cluster
- (optional) Google OAuth credentials
- (optional) Mailjet API keys for password-reset emails

## Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <project-name>
npm install
```

2. Create a `.env.local` file in the root directory (see `.env.example`):

```env
SESSION_COOKIE_KEY=your-secret-key
SALT_SHA_256_HASHING=your-salt

MONGODB_ATLAS_USERNAME=...
MONGODB_ATLAS_PASSWORD=...
MONGODB_ATLAS_CLUSTER_URL=...
MONGODB_ATLAS_DB_NAME=PasswordKeeperDB
MONGODB_ATLAS_APP_NAME=...

MAILJET_API_KEY=...
MAILJET_API_SECRET=...
MAILJET_SENDER_EMAIL=...

FRONTEND_URL=http://localhost:3000

NEXT_PUBLIC_DOMAIN_URL=securaised.net
NEXT_PUBLIC_BASE_URL=https://www.securaised.net/
AES_TEMPORARY_CONTENT_DEFAULT_KEY=your-default-key
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

All endpoints are same-origin under `/api/*` (Route Handlers in `src/app/api/`):

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register` | – | Create an account |
| POST | `/api/login` | – | Log in |
| POST | `/api/logout` | ✓ | Log out |
| POST | `/api/check-auth` | – | Check session status |
| POST | `/api/delete_my_account` | ✓ | Delete account + all data |
| GET | `/api/auth/google` | – | Start Google OAuth |
| GET | `/api/auth/callback/google` | – | Google OAuth callback |
| GET | `/api/getcontent` | ✓ | Get encrypted content for a file path |
| POST | `/api/updatecontent` | ✓ | Save content for a file path |
| POST | `/api/updatecontents` | ✓ | Batch-save multiple contents |
| GET | `/api/getfiletree` | ✓ | Get the user's file tree |
| POST | `/api/updatefiletree` | ✓ | Save the user's file tree |
| POST | `/api/remove_file` | ✓ | Remove a file |
| POST | `/api/remove_folder` | ✓ | Remove a folder |
| POST | `/api/rename` | ✓ | Rename a file or folder |
| POST | `/api/savetemporarycontent` | ✓ | Create a temporary shareable content |
| GET | `/api/getusertemporarycontent` | ✓ | List the user's temporary links |
| POST | `/api/deleteusertemporarycontent` | ✓ | Delete one of the user's links |
| GET | `/api/gettemporarycontent` | – | Read temporary content (by identifier) |
| POST | `/api/password/change` | ✓ | Change password |
| POST | `/api/password/reset/request` | – | Request a password reset email |
| GET | `/api/password/reset/verify` | – | Validate a reset token |
| POST | `/api/password/reset/reset` | – | Set a new password with a token |

## Development

```bash
npm run dev        # dev server on :3000
npm run lint       # ESLint
npm run build      # production build + typecheck
npm run postbuild  # next-sitemap (runs automatically after build)
```

## Deployment (Vercel)

The repo includes a `vercel.json` forcing Next.js detection:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build"
}
```

Set all the env vars from `.env.example` as Vercel Environment Variables, and make sure the Framework Preset is **Next.js**. `serverExternalPackages` in `next.config.js` keeps the native Node packages (`argon2`, `mongoose`, `node-mailjet`, `winston`) external at build time.

## Security

- Client-side AES encryption: plaintext never leaves the browser
- Argon2 password hashing
- HTTP-only signed session cookies
- Reset tokens stored in MongoDB with 24h expiry
- Temporary content supports burn-after-read and optional password

## License

This project is licensed under the MIT License.
