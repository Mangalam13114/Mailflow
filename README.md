# 📧 ReachInbox – Email Scheduling Platform

ReachInbox is a **full-stack email scheduling platform** designed to handle **delayed email delivery at scale** using a **queue-based architecture**.
The application allows users to authenticate securely, schedule single or bulk emails for future delivery, monitor email status, and cancel emails before they are sent.

The system is built with **reliability and scalability in mind**, ensuring that scheduled emails are **not lost during server restarts**, **rate limits are respected**, and **duplicate emails are never sent**.
It demonstrates real-world backend concepts such as **job queues, background workers, rate limiting, persistence, and asynchronous processing**.

🔗 **Live Project:**
👉 *[Paste deployed project link here]*

---

## ✨ Features

### User-Facing Features

* Secure Google OAuth authentication
* Schedule emails for a specific future date & time
* Bulk email scheduling via CSV / TXT upload
* Dashboard to view scheduled and sent emails
* Ability to cancel emails before delivery

### Backend & System Features

* Queue-based email scheduling using BullMQ
* Redis-backed job persistence (survives restarts)
* Rate limiting to prevent email abuse
* Configurable delay between emails
* Background worker processing
* Idempotent job execution (no duplicate sends)
* Ethereal SMTP integration for safe testing

---

## 🛠 Tech Stack

### Frontend

* Next.js 16
* TypeScript
* Tailwind CSS

### Backend

* Express.js
* TypeScript
* Prisma ORM
* BullMQ (Job Queue)
* Redis
* Nodemailer

### Database & Infrastructure

* PostgreSQL
* Redis
* Docker & Docker Compose

---

## 🏗 High-Level Architecture

Frontend (Next.js)
→ Backend API (Express.js)
→ PostgreSQL (users & emails)
→ Redis + BullMQ (scheduled jobs & rate limits)
→ Email Worker
→ SMTP Service (Ethereal Email)

This architecture ensures **asynchronous processing**, **fault tolerance**, and **scalability** for large volumes of scheduled emails.

---

## 📁 Project Structure

```
reachinbox/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── prisma/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       ├── queues/
│       └── workers/
│
└── frontend/
    └── src/
        ├── app/
        ├── components/
        └── services/
```

---

## 🌐 Available Routes

### Frontend

* `/login` – Google OAuth login
* `/dashboard` – Email scheduling dashboard

### Backend API

* `/api/auth/*` – Authentication
* `/api/emails/*` – Email scheduling & management

---

## 🔐 Security Notes

* OAuth-based authentication
* JWT for secure session handling
* Sensitive credentials managed via environment variables
* Redis-based rate limiting for abuse prevention
* Designed to be production-ready

---

## 📝 Notes & Assumptions

* Uses Ethereal Email (fake SMTP) for testing purposes
* Single-tenant application
* Email body supports text / HTML only
* Attachments and personalization are not included

---

## 👨‍💻 Author

**Kumar Mangalam**
