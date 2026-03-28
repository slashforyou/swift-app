# Cobbr — App Features by Account Type

## Overview

Cobbr is a **B2B SaaS** mobile application for **moving companies** (déménagement). It helps companies manage their jobs, staff, vehicles, and inter-company delegation (subcontracting).

The app uses **company-level roles** to determine feature access. There are two main account types relevant for review:

| Account Type         | Role       | Description                                                   |
| -------------------- | ---------- | ------------------------------------------------------------- |
| **Manager / Patron** | `patron`   | Company owner or senior manager. Full access to all features. |
| **Employee**         | `employee` | Field worker / mover. Restricted to assigned jobs only.       |

---

## Demo Accounts

|              | Account 1 — Manager (Patron)  | Account 2 — Employee         |
| ------------ | ----------------------------- | ---------------------------- |
| **Email**    | `steve.pommes@cobbr-demo.com` | `adam.granny@cobbr-demo.com` |
| **Password** | `FruitDefendu2026!`           | `SmithField2026!`            |
| **Role**     | Patron (admin)                | Employee                     |
| **Company**  | Nerd-Test                     | Nerd-Test                    |

---

## Feature Access Matrix

### Home & Navigation

| Feature               | Manager (Patron)    | Employee              |
| --------------------- | ------------------- | --------------------- |
| Home screen           | ✅                  | ✅                    |
| Calendar view         | ✅ All company jobs | ✅ Assigned jobs only |
| Business section      | ✅                  | ❌ Hidden             |
| Profile               | ✅                  | ✅                    |
| Parameters / Settings | ✅                  | ✅                    |
| Notifications         | ✅                  | ✅                    |
| Leaderboard & Badges  | ✅                  | ✅                    |

### Job Management

| Feature                 | Manager (Patron) | Employee           |
| ----------------------- | ---------------- | ------------------ |
| View all company jobs   | ✅               | ❌                 |
| View assigned jobs only | ✅               | ✅                 |
| Create new job          | ✅               | ❌                 |
| Edit job details        | ✅               | ❌                 |
| Delete a job            | ✅               | ❌                 |
| Start / complete a job  | ✅               | ✅ (assigned jobs) |
| View job details        | ✅               | ✅ (assigned jobs) |
| Job timer (chrono)      | ✅               | ✅                 |

### Staff & Resource Management

| Feature              | Manager (Patron) | Employee |
| -------------------- | ---------------- | -------- |
| View staff list      | ✅               | ❌       |
| Add / remove staff   | ✅               | ❌       |
| Assign staff to jobs | ✅               | ❌       |
| Manage teams         | ✅               | ❌       |

### Vehicle Fleet

| Feature                 | Manager (Patron) | Employee |
| ----------------------- | ---------------- | -------- |
| View vehicles           | ✅               | ❌       |
| Add / edit vehicles     | ✅               | ❌       |
| Assign vehicles to jobs | ✅               | ❌       |

### B2B Delegation (Transfers)

| Feature                           | Manager (Patron) | Employee |
| --------------------------------- | ---------------- | -------- |
| Delegate a job to another company | ✅               | ❌       |
| Accept / decline a transfer       | ✅               | ❌       |
| Counter-propose a price           | ✅               | ❌       |
| View B2B relations                | ✅               | ❌       |

### Payments (Stripe)

| Feature              | Manager (Patron) | Employee |
| -------------------- | ---------------- | -------- |
| View payments        | ✅               | ❌       |
| Create payment links | ✅               | ❌       |
| Stripe onboarding    | ✅               | ❌       |
| Process payouts      | ✅               | ❌       |

> **Note on Stripe:** Stripe is used for **business-to-customer** payment processing (moving companies charging their clients). It is NOT used for in-app purchases, subscriptions, or digital goods. The app does not sell any digital content.

### Reports

| Feature                  | Manager (Patron) | Employee |
| ------------------------ | ---------------- | -------- |
| View reports & analytics | ✅               | ❌       |

### Gamification

| Feature     | Manager (Patron) | Employee |
| ----------- | ---------------- | -------- |
| Leaderboard | ✅               | ✅       |
| Badges & XP | ✅               | ✅       |

---

## Business Model

Cobbr is a **B2B SaaS platform** for moving companies. Key points:

- **No in-app purchases** — No digital content is sold within the app.
- **No subscriptions via Apple** — Company subscriptions are managed outside the app (web-based).
- **No digital goods** — The app manages physical moving services (real-world logistics).
- **Stripe integration** — Used to allow moving companies to charge their end-customers for physical moving services. This is a business payment tool, not a consumer purchase.
- **Free to download** — The app is free. Companies create accounts and invite their employees.

---

## PassKit / Apple Pay

The app does **NOT** integrate Apple Pay or use PassKit features. The PassKit framework may appear in the build due to React Native / Expo SDK dependencies, but no Apple Pay functionality is implemented or accessible to users. All payment processing is handled through Stripe Connect (web-based payment links).

---

## Pre-Populated Content

Both demo accounts belong to the company **Nerd-Test**, which has:

- Active jobs with various statuses (pending, confirmed, in-progress)
- Staff members assigned to jobs
- Vehicles in the fleet
- B2B relations with other companies
- Payment history

The **Manager account** (Steve Pommes) can see and manage all of the above.  
The **Employee account** (Adam Granny) can see only jobs assigned to them and interact with their own tasks.
