# IT Helpdesk

A modern IT helpdesk ticketing system for CRC Credit Bureau. Employees can submit and track IT support requests, while IT admins can manage, respond to, and resolve issues.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

### For Employees
- Submit IT support tickets with title and description
- View issue history grouped by month
- Filter issues by status (All / Pending / Completed)
- Real-time conversation thread with IT staff
- Reply to ongoing tickets

### For IT Admins
- Dashboard with statistics (Total, Pending, Completed)
- View all issues from all employees
- Search issues by name, email, title, or ID
- Filter by status
- Reply to employees and resolve issues

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Notifications | Sonner |
| Date Handling | date-fns |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | `isaac@crc.com` | `password123` |
| Admin | `admin@crc.com` | `password123` |

## Project Structure

```
src/
├── app/
│   ├── (auth)/signin/          # Sign-in page
│   ├── (employee)/dashboard/   # Employee dashboard
│   └── (admin)/admin/          # Admin dashboard & issue details
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/                   # Authentication components
│   ├── employee/               # Employee-specific components
│   ├── admin/                  # Admin-specific components
│   ├── shared/                 # Shared components (Navbar, StatusBadge, etc.)
│   └── layout/                 # Layout components
├── context/
│   └── AuthContext.tsx         # Authentication state management
├── hooks/
│   ├── useAuth.ts              # Auth hook
│   ├── useIssues.ts            # Employee issues hook
│   └── useAdminIssues.ts       # Admin issues hook
└── lib/
    ├── api.ts                  # API client (Axios)
    ├── mock-api.ts             # Mock API for development
    ├── mock-data.ts            # Sample data
    ├── types.ts                # TypeScript interfaces
    ├── validations.ts          # Zod schemas
    └── utils.ts                # Utility functions
```

## API Endpoints

The frontend expects these backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | User authentication |
| GET | `/api/issues/employee` | Get employee's issues |
| POST | `/api/issues` | Create new issue |
| GET | `/api/issues/:id` | Get issue details |
| POST | `/api/issues/:id/reply` | Add reply to issue |
| PATCH | `/api/issues/:id/resolve` | Mark issue as resolved |
| GET | `/api/admin/stats` | Get dashboard statistics |
| GET | `/api/admin/issues` | Get all issues (admin) |

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=IT Helpdesk
```

### Switching to Real Backend

In `src/context/AuthContext.tsx`, the app uses mock data by default. When your backend is ready:

1. Update `NEXT_PUBLIC_API_URL` in `.env.local`
2. The API client in `src/lib/api.ts` is already configured for the real backend

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

For Vercel deployment, simply connect your repository and deploy.

## License

Internal use only - CRC Credit Bureau Limited
