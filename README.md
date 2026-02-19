

# Backend Bank Ledger System

A robust, secure, and fully functional backend API for a banking and transaction system. This project simulates core banking operations, focusing on data integrity, secure money transfers, and an immutable double-entry ledger system using Node.js, Express, and MongoDB.

## 🚀 Features

* **Secure Authentication:** User registration, login, and secure session management using JWT (JSON Web Tokens) and HTTP-only cookies.
* **Token Blacklisting:** Secure logout functionality that blacklists active JWTs to prevent unauthorized access.
* **Account Management:** Users can create and manage multiple bank accounts with tracking for statuses (Active, Frozen, Closed).
* **Immutable Ledger System:** A foolproof, double-entry bookkeeping system where financial records cannot be deleted or modified once created, ensuring a perfect audit trail.
* **ACID-Compliant Transactions:** Utilizes MongoDB Sessions to ensure that complex multi-step money transfers either succeed completely or fail completely, preventing lost funds.
* **Idempotency Keys:** Prevents duplicate transactions caused by network issues or double-clicks by uniquely identifying every transaction request.
* **Dynamic Balance Calculation:** Balances are not hardcoded; they are calculated on-the-fly by aggregating all debit and credit ledger entries for absolute accuracy.
* **Email Notifications:** Automated email alerts for user registration and transaction status (Success/Failure) using Nodemailer and Google APIs.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas
* **ODM:** Mongoose (with Compound Indexes & Aggregation Pipelines)
* **Authentication:** JWT (jsonwebtoken), bcryptjs, cookie-parser
* **Mailing:** Nodemailer (via Gmail API/OAuth2)

## ⚙️ Installation & Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/backend-ledger-system.git](https://github.com/yourusername/backend-ledger-system.git)
cd backend-ledger-system

```

**2. Install dependencies**

```bash
npm install

```

**3. Configure Environment Variables**
Create a `.env` file in the root directory and add the following keys:

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key

# Nodemailer / Google OAuth Credentials
CLIENT_ID=your_google_cloud_client_id
CLIENT_SECRET=your_google_cloud_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_sending_email_address@gmail.com

```

**4. Run the application**

```bash
# For development (uses nodemon)
npm run dev

# For production
npm run start

```

## 📡 API Endpoints Overview

### Authentication

* `POST /api/auth/register` - Register a new user
* `POST /api/auth/login` - Login and receive a JWT cookie
* `POST /api/auth/logout` - Logout and blacklist the current token

### Accounts

* `POST /api/accounts/` - Create a new bank account
* `GET /api/accounts/` - Get all accounts for the logged-in user
* `GET /api/accounts/balance/:accountId` - Dynamically calculate and fetch the current account balance

### Transactions

* `POST /api/transactions/system/initial-funds` - (Admin) Deposit initial funds into an account
* `POST /api/transactions/` - Initiate a secure transfer between two accounts

## 🛡️ Security Measures

* Passwords hashed with `bcryptjs`.
* Sensitive data (like passwords and system-user flags) are hidden from database queries by default (`select: false`).
* Strict validation ensures funds cannot be transferred from unauthenticated users or closed accounts.

---

