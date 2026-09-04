\# NestNote - A Calmer Way to Manage College Assignments



\## Setup Instructions



\### Prerequisites

\- Node.js 18+

\- Supabase account

\- Git



\### 1. Clone the Repository

\\`\\`\\`bash

git clone <your-repo-url>

cd nestnote

\\`\\`\\`



\### 2. Install Dependencies

\\`\\`\\`bash

npm install

\\`\\`\\`



\### 3. Set Up Environment Variables

Create a `.env.local` file with your Supabase credentials:

\\`\\`\\`env

NEXT\_PUBLIC\_SUPABASE\_URL=your\_supabase\_project\_url

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key

SUPABASE\_SERVICE\_ROLE\_KEY=your\_supabase\_service\_role\_key

NEXT\_PUBLIC\_SITE\_URL=http://localhost:3000

\\`\\`\\`



\### 4. Set Up Supabase

1\. Create a new Supabase project

2\. Run the migration:

\\`\\`\\`bash

npx supabase migration up

\\`\\`\\`

&#x20;  Or copy the SQL from `supabase/migrations/20250101000000\_initial\_schema.sql` and run it in the SQL Editor.



3\. Set up storage buckets:

&#x20;  - Go to Storage → Create new bucket: `assignment-files`

&#x20;  - Create another bucket: `submission-files`

&#x20;  - Set both to public access



\### 5. Seed the Database

\\`\\`\\`bash

npm run seed

\\`\\`\\`

This creates:

\- 2 teachers

\- 4 students

\- 3 assignments

\- Sample submissions with different statuses



\### 6. Start the Development Server

\\`\\`\\`bash

npm run dev

\\`\\`\\`



\### 7. Access the Application

\- Student login: student1@nestnote.com / password123

\- Teacher login: teacher1@nestnote.com / password123



\## Features



\### Teachers

\- Create assignments with metadata (branch, semester, subject)

\- Upload assignment files

\- Review submissions (approve/reject with feedback)

\- Dashboard with stats and upcoming deadlines



\### Students

\- View assignments filtered by branch/semester/subject

\- Submit work before deadlines

\- See submission status and teacher feedback

\- Color-coded deadline badges



\### Authentication

\- Separate login/signup flows for students and teachers

\- Role-based access control with middleware

\- Protected routes with redirects



\## Tech Stack

\- \*\*Framework:\*\* Next.js 14+ (App Router, TypeScript)

\- \*\*Styling:\*\* Tailwind CSS

\- \*\*Database \& Auth:\*\* Supabase (Postgres + Auth)

\- \*\*File Storage:\*\* Supabase Storage

\- \*\*Deployment:\*\* Vercel



\## Design System

\- Soothing color palette with sage green (#8FBFA3) and muted slate

\- Rounded cards with soft shadows

\- Gentle animations and transitions

\- Optional calm dark mode



\## Project Structure

\\`\\`\\`

nestnote/

├── src/

│   ├── app/          # App Router pages and layouts

│   ├── components/   # Reusable UI components

│   ├── lib/          # Utilities and API clients

│   ├── types/        # TypeScript types

│   └── hooks/        # Custom React hooks

├── supabase/         # Database migrations

├── scripts/          # Seed and utility scripts

└── public/           # Static assets

\\`\\`\\`



\## Deployment

This project is optimized for Vercel deployment. Simply:

1\. Push to GitHub

2\. Import your repository in Vercel

3\. Add environment variables

4\. Deploy



\## License

MIT

