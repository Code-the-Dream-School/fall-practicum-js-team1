# Baby Gear Exchange

A full-stack web application that helps families donate, browse, and claim gently used baby and toddler items in their community.

## 🚀 Live Demo

- **Frontend Live Site:** Coming soon
- **Frontend:** `/frontend`
- **Backend:** `/backend`

## 🧠 Problem Statement

Baby and toddler items can be expensive and are often used for only a short period of time.

Baby Gear Exchange helps families donate items they no longer need while allowing other families to browse and claim useful baby and toddler gear.

The goal is to make sharing items easier, reduce waste, and support families in the community.

## 🎯 Features

- User registration and login
- Post baby and toddler items for donation
- Browse available items
- Search and filter items by category, condition, and age
- View item details
- Claim an available item
- Item owner can approve or decline a claim
- Mark an item as picked up
- View My Donations
- View My Claims
- User profile
- Responsive design for mobile and desktop
- Form validation and error handling
- REST API integration

## 📸 Screenshots

Screenshots and GIFs will be added as features are developed.

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma
- REST API

### Database

- PostgreSQL
- Neon

### State and Data Management

- Zustand
- TanStack Query

### Tooling

- Git
- GitHub
- Jira
- Slack
- ESLint
- Prettier

## 📁 Project Structure

```text
fall-practicum-js-team1/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│

├── .gitignore
└── README.md


## ⚙️ Setup & Installation

### Prerequisites
- [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
- Node.js v26+
- npm or yarn
- Typescript (installed globally)
- PostgreSQL (local or cloud)

### Backend Setup

```bash
cd backend
nvm install
npm install
cp .env.example .env
npm run dev
```

All variables are listed in `backend/.env.example`.

Backend runs on:
http://localhost:3000

#### Database
This application uses Postgres v17 or v18.

##### Natively hosted

###### Installation
####### Mac
```bash
brew install postgresql@18
brew services start postgresql@18
```

####### Windows installation and running
Download [PostgreSQL 18 from the official installer](https://www.postgresql.org/download/windows/) and check that the PostgreSQL service is "Running".

####### Linux installation and running
```bash
sudo apt install postgresql
sudo service postgresql start
```

##### Database setup
Start the `psql` shell:
**Mac/Linux**: Check your username with `whoami`, then run `psql` (or `psql -U postgres`).
**Windows**: `"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost`

Once the shell is started, run these commands:

```psql
CREATE DATABASE hand_me_down OWNER <your-user>;
\q
```

If your user doesn’t exist yet, run this first:

**Mac/Linux**: `CREATE ROLE <your-user> LOGIN CREATEDB;`
**Windows**: `CREATE ROLE mypguser LOGIN CREATEDB PASSWORD '<pg-password>';` (and use mypguser as the owner)

##### Docker hosted
See the [Postgres Docker Hub repo](https://hub.docker.com/_/postgres/) for available versions.

```bash
docker pull postgres:<version>
docker run --name ctd-psql-fall1-practicum -e POSTGRES_USER=<username> -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=hand_me_down -p 5432:5432 -v ctd-psql-fall1-practicum-data:/var/lib/postgresql/data -d postgres
```

##### .env Configuration
Put the connection string in `backend/.env` as `DATABASE_URL`:

**Mac**: `postgresql://<username>@localhost/hand_me_down?host=/tmp`
**Linux**: `postgresql://<username>@localhost/hand_me_down?host=/var/run/postgresql`
**Windows**: `postgresql://mypguser:<pg-password>@localhost/hand_me_down`

#### Linting
To lint a directory or file, run this command:

```bash
npm run lint
```
### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
http://localhost:5173

## 🔌 Frontend ↔ Backend Connection

In development, the frontend calls the backend through a **Vite proxy**.

- In frontend code, use a relative path: `fetch('/api/hello')`
- Vite forwards every `/api` request to the backend at `http://localhost:3000`
- The setting is in `frontend/vite.config.ts` (`server.proxy`)
- Restart `npm run dev` after you change `vite.config.ts`
- The proxy only works in development. The deployed app needs a separate setup (not decided yet).

## 🧪 Available Scripts

### Frontend
```bash
npm run dev
npm run build
npm run preview
```

### Backend
```bash
npm run dev
npm start
```

## 🔐 API Overview

### Example Endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/items
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id
```

## 🤝 Team & Collaboration

### Team Members
- Name — Role
- Name — Role
- Name — Role

### Workflow
- GitHub Issues for task tracking
- Feature branches for development
- Pull Requests required for all merges
- Code reviews before merging to `main`


## 🧩 Development Process

- Agile / sprint-based workflow
- Backend API built before frontend integration
- MVP defined early
- Incremental feature development

## 📌 Known Issues / Limitations

- Limited role-based access control
- No automated tests yet
- Performance optimizations pending

## 🛣 Future Improvements

- Add automated testing (Jest, Supertest)
- Improve security and validation
- Add caching and performance improvements
- Dockerize the application

## 🙌 Acknowledgments

- Mentors
- Instructors
- Open-source libraries and tools

## 📄 License

This project is for educational purposes only.
