# 📧 Email Scheduling Platform

A **production-grade full-stack email scheduling application** that allows users to schedule emails for future delivery with **rate limiting**, **persistence across server restarts**, and **queue-based processing**.

---

## ✨ Features

### 👤 User Features
- ✅ Google OAuth authentication
- ✅ Schedule emails for future delivery
- ✅ Bulk email upload via CSV/TXT files
- ✅ View scheduled and sent emails in dashboard
- ✅ Cancel scheduled emails before sending
- ✅ Real-time queue statistics

### ⚙️ System Features
- ✅ BullMQ job queue (reliable delayed scheduling - no cron)
- ✅ Redis-based rate limiting (configurable emails per hour)
- ✅ Persistent queues (emails survive server restarts)
- ✅ Worker concurrency (parallel job processing)
- ✅ Configurable delays between email sends
- ✅ Idempotent processing (no duplicate emails)
- ✅ Ethereal SMTP for safe email testing

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Axios |
| **Backend** | Express.js, TypeScript, Prisma ORM, BullMQ, Nodemailer |
| **Database** | PostgreSQL |
| **Queue & Cache** | Redis |
| **Infrastructure** | Docker, Docker Compose |
| **Authentication** | Google OAuth 2.0, JWT |
| **Email Testing** | Ethereal Email |

---

## 🏗️ Architecture
