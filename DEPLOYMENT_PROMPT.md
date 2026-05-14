# Production Deployment Prompt - Railways Platform

## Project Overview
This is a full-stack business management application with:
- **Backend**: Flask (Python) REST API with MySQL database
- **Frontend**: React + TypeScript with Vite
- **Database**: MySQL relational database
- **Current Deployment**: Vercel (frontend), needs Railways (both frontend & backend)

---

## Backend Architecture

### Technology Stack
- **Framework**: Flask (Python)
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Server**: Gunicorn
- **CORS**: Enabled for frontend communication
- **Port**: 8000 (default)

### Backend Modules
The Flask app includes the following blueprints/modules:
1. **user.py** - User authentication, registration, management
2. **inventory.py** - Product inventory management
3. **pos.py** - Point of Sale system
4. **procurement.py** - Purchase orders and procurement workflows
5. **branch.py** - Multi-branch management
6. **dashboard.py** - Analytics and dashboard data
7. **analytics.py** - Business analytics

### Environment Variables Required (Backend)
```
DB_HOST=<mysql_host>
DB_USER=<mysql_user>
DB_PASSWORD=<mysql_password>
DB_NAME=<mysql_database_name>
DB_PORT=<mysql_port>
JWT_SECRET=<your_secret_key>
PORT=8000
```

### Database
- Pre-built SQL schema exists at: `backend/src/knopper_database_v1 (1).sql`
- Sample import scripts available in: `backend/src/input data/`

### Startup Command
```bash
cd backend && gunicorn --bind 0.0.0.0:$PORT app:app --workers 2 --timeout 120
```

---

## Frontend Architecture

### Technology Stack
- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS + Tailwind (assumed from structure)
- **State Management**: Redux (in salesAnalytics)
- **HTTP Client**: Fetch API with custom baseUrl
- **Package Manager**: npm

### Frontend Structure
```
src/
├── api/              # HTTP client modules for backend communication
│   ├── auth.ts       # Authentication endpoints
│   ├── branches.ts   # Branch management API
│   ├── dashboard.ts  # Dashboard data API
│   ├── procurement.ts# Purchase orders API
│   ├── sales.ts      # Sales data API
│   └── users.ts      # User management API
├── components/       # React components
│   ├── admin/        # Admin dashboard components
│   ├── manager/      # Manager dashboard components
│   ├── pos/          # Point of Sale components
│   └── ExcelUploader.tsx
├── features/         # Feature-specific modules
│   ├── pos/          # POS system feature
│   └── salesAnalytics/ # Analytics dashboard with Redux
├── hooks/            # Custom React hooks
│   └── useAuth.ts    # Authentication hook
└── pages/            # Page components
    ├── admin/        # Admin pages
    ├── manager/      # Manager pages
    └── pos/          # POS pages
```

### User Roles & Pages
1. **Admin** - Full system access
   - Dashboard, Inventory, Products, Sales Analytics, Purchase Orders, Branches, Users, Settings
2. **Manager** - Branch-level management
   - Dashboard, Branches, Cashiers
3. **POS Cashier** - Point of Sale operations
   - Checkout, Inventory lookup, Balance management

### Build & Startup
```bash
cd frontend && npm install && npm run build
# Dist folder: frontend/dist
```

---

## Deployment Architecture (Railways Setup)

### Database Service
- **Type**: MySQL (standalone or managed)
- **Connection**: Required for both backend and analytics
- **Schema**: Import `backend/src/knopper_database_v1 (1).sql`

### Backend Service
- **Type**: Node.js or Python Railway service
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && gunicorn --bind 0.0.0.0:$PORT app:app --workers 2 --timeout 120`
- **Environment Variables**: All DB_* and JWT_SECRET variables
- **Port Exposed**: $PORT (typically 8000)

### Frontend Service
- **Type**: Static site or Node.js service
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output**: `frontend/dist/` directory
- **Serve**: Static files via web server (nginx/http-server)
- **Environment**: 
  - `VITE_API_BASE_URL=<backend_service_url>`

### Network Configuration
- Frontend calls Backend API at: `https://<backend-railway-url>/api/*`
- Update `frontend/src/api/baseUrl.ts` with production backend URL
- CORS already enabled on backend for cross-origin requests

---

## Key Files & Directories

### Backend Files
| File | Purpose |
|------|---------|
| `backend/app.py` | Main Flask application |
| `backend/requirements.txt` | Python dependencies |
| `backend/Procfile` | Procfile format (reference) |
| `backend/run.sh` | Local development runner |
| `backend/*.py` | Blueprint modules |
| `backend/src/knopper_database_v1 (1).sql` | Database schema |

### Frontend Files
| File | Purpose |
|------|---------|
| `frontend/package.json` | NPM dependencies |
| `frontend/vite.config.ts` | Vite build configuration |
| `frontend/tsconfig.json` | TypeScript configuration |
| `frontend/src/main.tsx` | Application entry point |
| `frontend/src/App.tsx` | Root component |

### Configuration Files
| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment config (adapt for Railways) |
| `package.json` | Root workspace settings |
| `.env` files | Environment variables (create in each service) |

---

## Deployment Steps on Railways

### 1. Create MySQL Service
1. Add MySQL service to Railways project
2. Get connection details (host, user, password, port)
3. Import database schema:
   ```bash
   mysql -h <host> -u <user> -p <password> < backend/src/knopper_database_v1\ \(1\).sql
   ```

### 2. Deploy Backend
1. Create Python service in Railways
2. Connect GitHub repo
3. Set ROOT_DIR to `backend/`
4. Add environment variables:
   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT (from MySQL service)
   - JWT_SECRET (generate a strong random string)
5. Start command: `gunicorn --bind 0.0.0.0:$PORT app:app --workers 2 --timeout 120`
6. Note the backend service URL for frontend configuration

### 3. Deploy Frontend
1. Create Node.js service in Railways
2. Connect GitHub repo
3. Build command: `cd frontend && npm install && npm run build`
4. Start command: `npm install -g http-server && http-server frontend/dist -p $PORT`
5. Set environment variable:
   - `VITE_API_BASE_URL=<backend-service-url>`
6. Build output: `frontend/dist/`

### 4. Configure Cross-Origin Access
- Backend CORS is already enabled
- Frontend API calls configured in `frontend/src/api/baseUrl.ts`
- No additional CORS configuration needed

---

## Dependencies Summary

### Backend (Python)
- Flask - Web framework
- Flask-MySQL - Database ORM
- Flask-Bcrypt - Password hashing
- Flask-JWT-Extended - JWT authentication
- Flask-CORS - CORS support
- PyMySQL - MySQL driver
- Gunicorn - Production server
- python-dotenv - Environment configuration

### Frontend (Node.js)
- React 19+
- TypeScript
- Vite - Build tool
- Tailwind CSS (assumed)
- Redux (optional, for analytics)

---

## Database Schema Notes
- Pre-built SQL schema with all tables for:
  - Users & authentication
  - Products & inventory
  - Point of Sale transactions
  - Procurement & purchase orders
  - Branches & multi-location support
  - Analytics & reporting

---

## Additional Resources
- Database import scripts: `backend/src/input data/`
- Sample data: `backend/src/input data/Knopper_DB.csv`, `Knopper_DBv2.csv`

---

## Quick Deployment Checklist
- [ ] MySQL database created
- [ ] Database schema imported
- [ ] Backend environment variables configured
- [ ] Backend service deployed
- [ ] Backend URL noted
- [ ] Frontend environment variables configured
- [ ] Frontend built and deployed
- [ ] Test API connectivity from frontend
- [ ] Test user login flow
- [ ] Verify POS, Admin, Manager interfaces functioning
