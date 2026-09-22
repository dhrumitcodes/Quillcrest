# Quillcrest — Payroll & Compliance Platform

A multi-tenant payroll, statutory compliance, and workforce management platform. Built with Java Spring Boot and React, with role-based access control enforced at the application layer and AI-generated compliance insights powered by Gemini.

---

## Live Deployment

- **Frontend:** [ai-payroll-compliance-platform.vercel.app](https://ai-payroll-compliance-platform.vercel.app/)
- **Backend API:** [ai-payroll-backend.onrender.com](https://ai-payroll-backend.onrender.com)
- **Database:** PostgreSQL, hosted on Neon

> Note: the backend is on Render's free tier, which spins down after a period of inactivity. The first request after idle time can take up to a minute while it restarts.

---

## Tech Stack

**Backend**
- Java 21, Spring Boot 3
- Spring Security + JWT authentication
- Spring Data JPA / Hibernate
- PostgreSQL

**Frontend**
- React (Vite)
- Tailwind CSS

**AI**
- Google Gemini API (`gemini-3.1-flash-lite`) — generates payroll and compliance insights from real company data (employee counts, missing statutory documents, salary totals), not canned text

---

## What This Actually Does

- **Multi-tenant company management** — companies, departments, and employees, scoped so a user can only ever access their own company's data (verified at the service layer, not just hidden in the UI)
- **Role-based access control** — four roles (`Super Admin`, `Company Admin`, `Auditor`, `Employee`), each with different read/write permissions enforced via Spring Security method security
- **Employee records** — PAN and Aadhaar validation with duplicate detection, department assignment
- **Payroll** — per-employee salary structures (base, allowances, deductions) and generated payslips
- **Statutory compliance calculator** — Indian income tax (TDS) and Professional Tax slab estimation, run client-side. This uses simplified, generic slabs for demonstration purposes — it is **not verified tax advice**, and real payroll software would need CA-verified figures and state-specific Professional Tax rules.
- **AI-generated insights** — the dashboard sends a real summary of a company's employee/salary/compliance data to Gemini and returns specific, grounded observations (e.g. "3 employees are missing PAN numbers")
- **Login protection** — failed login attempts are rate-limited per account (5 attempts, 15-minute lockout)

---

## Try It — Demo Accounts

All seeded accounts use the password `admin123`.

| Email | Role | Scope |
| :--- | :--- | :--- |
| `dhruv@techcorp.com` | Company Admin | Full access within their company |
| `auditor@techcorp.com` | Auditor | Read-only access within their company |
| `employee@techcorp.com` | Employee | Own-record access, read-only elsewhere |
| `superadmin@quillcrest.com` | Super Admin | Platform-wide access across all companies |

---

## Running Locally

This is a single repository containing both the backend (`platform/`) and frontend (`payroll-frontend/`).

```bash
git clone https://github.com/dhrumitcodes/AI-payroll-compliance-platform.git
cd AI-payroll-compliance-platform
```

### 1. Start a local Postgres

```bash
cd platform
docker-compose up -d db
```

### 2. Configure the backend

Create `platform/src/main/resources/application-local.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/postgres
spring.datasource.username=postgres
spring.datasource.password=dhrumit123

jwt.secret=<any long random string>
gemini.api.key=<your free Gemini API key from aistudio.google.com — optional>
```

Run with the `local` profile active:

```bash
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

### 3. Run the frontend

```bash
cd ../payroll-frontend
npm install
npm run dev
```

By default the frontend points at `http://localhost:8080`. To point it at a different backend, set `VITE_API_BASE_URL` in a `.env` file.

### 4. Run the backend test suite

```bash
cd platform
./mvnw test
```

Tests use their own isolated config (`src/test/resources/application.properties`) so they don't touch your dev environment's settings.

---

## Environment Variables (Production)

Set these on your backend host (e.g. Render):

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | Yes | Postgres JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Yes | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | Signing key for auth tokens — the app will not start without this |
| `GEMINI_API_KEY` | No | Enables the AI insights feature; everything else works without it |

---

## Known Limitations

Being upfront about what's not (yet) built, rather than leaving it to be discovered:

- The frontend assumes a single company (`companyId: 1`) in a few places rather than letting a user pick which company they're managing — fine for the current demo data, not built out for true multi-company switching in the UI
- No automated frontend tests yet (backend has a real JUnit/Mockito suite)
- Login rate-limiting is in-memory and resets on a backend restart — fine for a single-instance deployment, would need a shared store (e.g. Redis) at scale
- Backend REST endpoints aren't uniformly versioned

---

## License

Built as a personal project. Not licensed for commercial use.