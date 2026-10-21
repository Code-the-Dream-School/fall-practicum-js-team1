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

## 📄 License

Educational use only.
