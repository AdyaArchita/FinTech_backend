# FinTech Backend - Finance Data Processing & Access Control API

A RESTful backend for a finance dashboard system built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Zod** for validation. The system supports role-based access control, financial record management, and dashboard analytics.

## Tech Stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Runtime      | Node.js                         |
| Framework    | Express v5                      |
| Database     | MongoDB via Mongoose             |
| Auth         | JWT (jsonwebtoken) + bcryptjs   |
| Validation   | Zod                             |

## Project Structure

```
fintech_backend/
├── controllers/
│   ├── authController.js      # Register, Login, Get Me
│   ├── userController.js      # User management (Admin)
│   ├── recordController.js    # Financial record CRUD
│   └── statsController.js     # Dashboard summary & trends
├── middleware/
│   ├── auth.js                # authenticate + authorize middleware
│   └── errorHandler.js        # Global error handler
├── models/
│   ├── User.js
│   └── Record.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── recordRoutes.js
│   └── statsRoutes.js
├── server.js
├── package.json
└── .env.example
```

## Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/AdyaArchita/FinTech_backend.git
cd fintech_backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

# 4. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

The server will start on `http://localhost:5000` by default.

## Roles & Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| View records                  | ✅     | ✅      | ✅    |
| View dashboard summary        | ✅     | ✅      | ✅    |
| View trends (monthly/weekly)  | ❌     | ✅      | ✅    |
| Create / Update / Delete records | ❌  | ❌      | ✅    |
| Manage users (roles, status)  | ❌     | ❌      | ✅    |

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint            | Auth | Description               |

| POST   | `/api/auth/register`| No   | Register a new user       |
| POST   | `/api/auth/login`   | No   | Login and receive a token |
| GET    | `/api/auth/me`      | Yes  | Get current user info     |

**Register body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "Admin"
}
```

**Login body:**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

### Users (Admin only)

| Method | Endpoint                  | Description                   |

| GET    | `/api/users`              | List all users (paginated)    |
| GET    | `/api/users/:id`          | Get a specific user           |
| PATCH  | `/api/users/:id/role`     | Update a user's role          |
| PATCH  | `/api/users/:id/status`   | Activate or deactivate a user |
| DELETE | `/api/users/:id`          | Permanently delete a user     |

**Query params for GET /api/users:** `role`, `status`, `page`, `limit`

### Records

| Method | Endpoint          | Auth Required Role | Description                   |

| GET    | `/api/records`    | Any logged-in      | List records (filtered, paged)|
| GET    | `/api/records/:id`| Any logged-in      | Get a single record           |
| POST   | `/api/records`    | Admin              | Create a record               |
| PUT    | `/api/records/:id`| Admin              | Update a record               |
| DELETE | `/api/records/:id`| Admin              | Soft-delete a record          |

**Query params for GET /api/records:**
- `type` - `Income` or `Expense`
- `category` - partial match
- `startDate` / `endDate` - ISO date strings
- `search` - searches category and description
- `page`, `limit` - pagination (default: page=1, limit=10, max limit=100)

**Create / Update body:**
```json
{
  "amount": 5000,
  "type": "Income",
  "category": "Salary",
  "date": "2025-03-01",
  "description": "Monthly salary"
}
```

### Stats / Dashboard

|Method| Endpoint                |      Role        |          Description             |

| GET  | `/api/stats/summary`    |        All       | Total income, expenses, net balance, category breakdown, recent 5 records |
| GET  |`/api/stats/trends/monthly`| Admin, Analyst | Monthly income/expense trends      |
| GET  |`/api/stats/trends/weekly` | Admin, Analyst | Weekly income/expense trends       |

**Query params:**
- `months` (default: 12, max: 24) for monthly trends
- `weeks` (default: 8, max: 52) for weekly trends

**Sample summary response:**
```json
{
  "summary": {
    "totalIncome": 50000,
    "totalExpenses": 32000,
    "netBalance": 18000,
    "totalRecords": 45
  },
  "categoryBreakdown": [
    { "category": "Salary", "grandTotal": 50000, "breakdown": [...] }
  ],
  "recentActivity": [...]
}
```

## Design Decisions & Assumptions

1. **Role assignment on register** - For simplicity, the role can be passed during registration. In a real production system, only Admins would assign roles after account creation.

2. **Soft delete** - Records are never physically removed. The `isDeleted` flag is set to `true`. This preserves historical data and audit trails. Users are hard-deleted since there is no audit need.

3. **Validation with Zod** - All input is validated at the controller level with Zod before touching the database. Mongoose schema validators serve as a second line of defense.

4. **Stats efficiency** - `recentActivity` is fetched with a separate `.find()` query rather than using `$$ROOT` inside a `$group` stage, which would push every document into memory.

5. **Pagination** - All list endpoints are paginated. Default limit is 10, max is 100.

6. **Inactive user login block** - If an Admin deactivates a user, that user receives a `403` on login attempts.

7. **Password field** - The `password` field in the User schema uses `select: false`, meaning it's excluded from all queries by default and only fetched explicitly when needed (e.g., in the login flow).

## Error Responses

```json
{
  "message": "Human-readable error description",
  "errors": { "field": ["specific validation issue"] }
}
```

| Code | Meaning                          |

| 400  | Bad request / validation failed  |
| 401  | Not authenticated                |
| 403  | Forbidden (insufficient role)    |
| 404  | Resource not found               |
| 409  | Conflict (e.g. duplicate email)  |
| 500  | Internal server error            |