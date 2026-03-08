# 💰 Income Tracker - Job Income Management Application

A modern, full-stack web application to track income from multiple jobs, set income targets, and visualize earnings with beautiful analytics. Built with React, TypeScript, Express, and Tailwind CSS.

## ✨ Features

### 📊 Dashboard
- **Monthly Progress Tracking** - Monitor earnings against monthly targets with dynamic progress bars
- **Weekly Activity Chart** - Area chart visualization of last 7 days earnings
- **Monthly Progress Chart** - Line chart showing income trends
- **Income Distribution** - Bar chart showing earnings by job type
- **Target Exceeded Alert** - Special visualization when exceeding monthly goals
- **Daily Average Calculator** - Auto-calculated average daily income

### 💼 Job Profile Management
- Create, edit, and delete multiple job profiles
- Set hourly rates and daily working hours
- Auto-generated colors for visual identification
- Custom color picker for job profiles
- Daily income estimation per job
- Organized card-based layout

### 📅 Daily Tracking Calendar
- Interactive calendar view with job-based color coding
- Click-to-toggle daily work status
- Color-coded days based on assigned jobs
- Monthly income summary by job
- Visual indicators for worked days
- Current month/previous month navigation

### 🎯 Income Targets System
- Set monthly income goals
- Automatic progress calculation (% complete)
- Visual progress bar with gradient
- Target History & Analytics tab showing:
  - Completion percentage for each month
  - Earned amount vs target
  - Historical trends with animated cards
  - Color-coded completion status
  - Month-by-month breakdown

### 👤 Authentication
- Secure user registration and login
- Session-based authentication
- Password hashing (SHA-256, upgrade to bcrypt recommended)
- User data isolation
- Admin panel for system management

### 📈 Advanced Analytics
- Multiple chart types (Area, Line, Bar charts)
- Job performance comparison
- Monthly trend analysis
- Target completion tracking
- Interactive data visualization with Recharts

## 🛠 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server
- **Recharts** - Data visualization
- **Motion** - Smooth animations
- **Lucide React** - Icon library
- **date-fns** - Date utilities

### Backend
- **Express.js** - Web server
- **Node.js** - Runtime
- **TypeScript** - Type-safe backend
- **better-sqlite3** - Local database
- **express-session** - Session management

### Database Options
- **SQLite** (Default) - Local database for development
- **Supabase** (Optional) - Cloud PostgreSQL for production

## 📁 Project Structure

```
MyJob/
├── src/
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   ├── types.ts               # TypeScript interfaces
│   └── lib/
│       └── utils.ts           # Utility functions
├── server.ts                   # Express server & API routes
├── index.html                  # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Project dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- SQLite3 (comes with better-sqlite3) OR Supabase account for cloud database

### Installation

1. **Clone/Setup Project**
```bash
cd MyJob
npm install
```

2. **Environment Variables**
Create a `.env` file based on `.env.example`:

**For Local SQLite (Default):**
```env
NODE_ENV=development
PORT=3000
```

**For Supabase (Optional):**
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **Run Development Server**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

4. **Build for Production**
```bash
npm run build
npm start
```

## 💻 Usage Guide

### 1. Create Account
- Click "Sign up here" on the login page
- Enter username and password
- Account is automatically created and logged in

### 2. Add Job Profiles
- Go to "Job Profiles" tab
- Click "Add New Job"
- Enter job name, hourly rate, daily hours
- Choose color (auto-generated or custom)
- Colors help identify jobs in calendar

### 3. Track Daily Income
- Go to "Daily Tracking" tab
- Select a job from the left panel
- Click any day on the calendar to toggle work status
- Days are colored based on assigned job
- View monthly summary in the sidebar

### 4. Set Income Targets
- Go to "Income Targets" tab
- Enter your monthly target amount
- Current progress displays in real-time
- View target history with completion percentages
- Charts update as you log income

### 5. View Dashboard Analytics
- Dashboard shows:
  - Monthly progress vs target
  - Weekly activity area chart
  - Monthly trends line chart
  - Income distribution by job
  - Daily average calculation
  - Target exceeded notifications

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user'
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  hourly_rate REAL,
  hours_per_day REAL,
  color TEXT DEFAULT '#18181b',
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Income Table
```sql
CREATE TABLE income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  job_id INTEGER,
  date TEXT,
  amount REAL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);
```

### Targets Table
```sql
CREATE TABLE targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  month TEXT,
  amount REAL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout

### Jobs
- `GET /api/jobs` - Get user's jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job details
- `DELETE /api/jobs/:id` - Delete job

### Income
- `GET /api/income` - Get user's income records
- `POST /api/income` - Log daily income
- `DELETE /api/income/:id` - Delete income record

### Targets
- `GET /api/targets` - Get user's targets
- `POST /api/targets` - Set/update monthly target

### Admin
- `GET /api/admin/users` - Get all users (admin only)

## 🔐 Security Features

- ✅ Session-based authentication
- ✅ User data isolation (users only see their data)
- ✅ Password hashing (currently SHA-256, recommend bcrypt upgrade)
- ✅ Admin role support
- ✅ Input validation on backend
- ✅ CSRF protection via session middleware

### Security Notes
- In production, enable `secure: true` in session cookie
- Replace SHA-256 with bcrypt for passwords
- Use environment variables for secrets
- Enable HTTPS
- Implement rate limiting
- Add input sanitization

## 🗄️ Database Option: Supabase Integration

### To Switch to Supabase:

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy Project URL and API keys

2. **Update .env**
```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **Create Tables in Supabase**
   - Use SQL editor in Supabase Console
   - Run the schema SQL provided above

4. **Update server.ts**
   - Replace better-sqlite3 with @supabase/supabase-js
   - Update database queries to use Supabase client
   - Install: `npm install @supabase/supabase-js`

## 📱 UI/UX Features

- **Responsive Design** - Works on mobile, tablet, desktop
- **Dark/Light Compatibility** - Tailwind CSS with zinc color scheme
- **Smooth Animations** - Motion library for transitions
- **Interactive Charts** - Recharts with hover tooltips
- **Color-Coded Jobs** - Visual job identification
- **Real-time Updates** - Instant feedback on actions
- **Sidebar Toggle** - Collapsible sidebar for more space
- **Gradient Effects** - Modern gradient text and backgrounds

## 🧪 Testing

```bash
# Type checking
npm run lint

# Build check
npm run build

# Development with hot reload
npm run dev
```

## 📝 Default Admin Account

For development, an admin account is auto-created:
- Username: `admin`
- Password: `admin123`

⚠️ **Change this in production!**

## 🚨 Known Issues & Future Improvements

- [ ] Upgrade password hashing from SHA-256 to bcrypt
- [ ] Add email verification for registration
- [ ] Implement password reset functionality
- [ ] Add export to CSV/PDF for reports
- [ ] Mobile app version
- [ ] Dark mode toggle
- [ ] Data backup and restore
- [ ] Multi-language support
- [ ] Real-time notifications

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📧 Support

For questions or issues, please create an issue in the repository.
