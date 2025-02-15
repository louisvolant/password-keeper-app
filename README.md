# Encrypted Content Manager

A secure web application for managing encrypted content with user authentication. Built with Next.js, Express, and Supabase.

## Features

- User authentication
- Client-side content encryption/decryption
- Secure session management
- Real-time content saving
- Responsive UI with shadcn/ui components

## Tech Stack

### Frontend
- Next.js 14
- React
- TypeScript
- shadcn/ui components
- TailwindCSS

### Backend
- Express.js
- Supabase
- express-session for session management

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-name>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend
PORT=3001
SESSION_COOKIE_KEY=your-secret-key
CORS_DEV_FRONTEND_URL_AND_PORT=http://localhost:3000
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

4. Initialize the database:
- Create a new Supabase project
- Run the provided SQL migrations
- Set up the necessary tables (users, usercontent)

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run TypeScript checks:
```bash
npm run build
# then
npx tsc --noEmit
# or
node --no-warnings node_modules/.bin/tsc --noEmit
# or
npx --no-warnings tsc --noEmit
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  hashedpassword TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### User Content Table
```sql
CREATE TABLE usercontent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  encoded_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- Client-side encryption of content
- Secure session management
- HTTP-only cookies
- CORS protection
- Password hashing
- No plaintext storage of sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details