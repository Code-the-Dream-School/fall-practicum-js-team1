# Backend API Best Practices & Security Guide

This document outlines **backend API, security, and architecture best practices** for a Node.js + Express application.
It is written for students building their first **real-world backend** and should be used as a reference while developing features.

## 🎯 Core Responsibilities of the Backend

The backend API is responsible for:

- Defining API routes
- Validating incoming data
- Applying business rules
- Interacting with the database
- Enforcing security and access control

The backend **must not**:

- Render UI
- Trust client input
- Expose sensitive information

## 🧱 API Architecture Best Practices

### 1️⃣ Separate Routes from Controllers

**Routes**

- Define the URL and HTTP method

**Controllers**

- Contain the logic for handling requests

This separation keeps code readable and scalable.

### 2️⃣ One Responsibility per File

If a file:

- defines routes
- validates data
- accesses the database
- formats responses

…it is doing too much.

Break logic into smaller, focused files.

### 3️⃣ Use Async/Await in Controllers

Controllers should be predictable and readable:

```js
const getItems = async (req, res, next) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    next(error);
  }
};
```

## ❌ Input Validation & Trust Boundaries

### 4️⃣ Never Trust Client Input

All data coming from:

- request bodies
- query params
- URL params

must be validated.

Even simple checks help prevent bugs and attacks.

### 5️⃣ Validate Early, Fail Fast

Reject invalid requests immediately with a `400` response.
Do not allow bad data to reach business logic or the database.

## 🧯 Error Handling Best Practices

### 6️⃣ Centralized Error Handling

Use a single error-handling middleware:

```js
module.exports = (err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || 'Server error',
  });
};
```

Benefits:

- consistent responses
- easier debugging
- cleaner controllers

---

### 7️⃣ Never Leak Internal Errors

❌ Bad:

```json
{ "error": "Cannot read property 'map' of undefined" }
```

✅ Good:

```json
{ "message": "Something went wrong" }
```

Log details on the server, not in API responses.

## 🔐 Security Best Practices

### 8️⃣ Use Security Middleware

Recommended packages:

- `helmet` – secure HTTP headers
- `cors` – control cross-origin access
- `express-rate-limit` – prevent abuse
- `morgan` – request logging

These should be applied **globally**.

### 9️⃣ Principle of Least Privilege

- Only expose necessary routes
- Never return sensitive fields (passwords, secrets)
- Protect routes that modify data

### 🔟 Use Environment Variables for Secrets

Examples:

- database URLs
- JWT secrets
- API keys

Never commit `.env` files to Git.

## 🌐 API Design Best Practices

### 1️⃣1️⃣ Use Proper HTTP Status Codes

- `200` – success
- `201` – resource created
- `400` – bad request
- `401` – unauthorized
- `403` – forbidden
- `404` – not found
- `500` – server error

### 1️⃣2️⃣ Keep API Response Shapes Consistent

Example success response:

```json
{
  "success": true,
  "data": {}
}
```

Example error response:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Consistency makes frontend development easier.

## 🗄 Database Best Practices (When Added)

- Only the backend talks to the database
- Keep database logic out of routes
- Never expose database errors directly to clients

## 🧠 Recommended Mindset

> The backend is the **source of truth** for data, rules, and security.

Build APIs assuming:

- clients can be buggy
- clients can be malicious
- future developers will read your code

## 📋 Quick Checklist (Before MVP Review)

- [ ] Routes and controllers are separated
- [ ] Input is validated
- [ ] Errors are handled centrally
- [ ] Security middleware is enabled
- [ ] Secrets are stored in environment variables
- [ ] API responses are consistent

## Generate and Validate Prisma

Run these commands from the backend directory during initial setup and whenever the Prisma schema changes.

```bash
npx prisma validate
npm run db:generate
```

- `prisma validate` checks whether the Prisma schema is valid.
- `npm run db:generate` generates the Prisma client used by the application.
  The Prisma Client is also generated automatically when dependencies are installed through npm install, using the postinstall script.

## Verify the Database Connection

Run this test during initial setup or whenever you need to troubleshoot your database connection.

From the `backend` directory, run:

```bash
npm run db:check
```

This script uses the application's shared Prisma client to connect to the database configured by DATABASE_URL and executes the following SQL query:

```sql
SELECT 1;
```

If the connection succeeds, the output should look similar to:

```text
Database connection successful: [ { '?column?': 1 } ]
```

## Available Prisma Database Commands

Run these commands from the `backend` directory.

| Command               | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `npm run db:generate` | Generate the Prisma client.                                          |
| `npm run db:check`    | Test the database connection.                                        |
| `npm run db:migrate`  | Create and apply database migrations during development.             |
| `npm run db:studio`   | Open Prisma Studio to inspect database data.                         |
| `npm run db:reset`    | Reset the database and reapply migrations. **This can delete data.** |

## Checks Before Submitting a Pull Request

Run these checks before submitting a pull request to help catch problems early.

Run these commands from the `backend` directory:

```bash
npm run typecheck
npm run lint
npm run build
```

- `npm run typecheck` checks for TypeScript errors.
- `npm run lint` checks code for potential issues and style violations.
- `npm run build` compiles the backend.

## Open Prisma Studio

From the backend directory, run:
`npm run db:studio`

Prisma Studio will open in your browser and let you view and manage database records.

**Note:** Prisma Studio may show no tables if the Prisma schema does not yet define any database models.

## 📄 License

Educational use only.
