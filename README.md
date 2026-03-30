# EventWise — Smart Event Management Platform

An event management platform where hosts can create events (birthday, wedding, functions), manage gift wishlists with product links, track RSVP responses via polling, and send invitations through WhatsApp — all in a mobile-first experience.

## ✨ Features

### 🎁 Gift Wishlist
- Host adds gift items with product links (Amazon, Flipkart, Meesho, Myntra)
- Platform auto-detection from URLs
- Guests claim gifts to **prevent duplicates**
- Price tracking and product images

### 📊 RSVP Polling
- Guests vote **Yes / No / Maybe**
- Include **member count** (how many people coming)
- Real-time animated progress bars
- Host sees total confirmed members for planning

### 📱 WhatsApp Invitations
- Add contacts with phone numbers
- Select contacts per event
- One-tap **WhatsApp deep link** sends pre-filled invitation
- Track invitation status: Pending → Sent → Opened → Responded

### 👥 Contact Management
- Save contacts with groups (Family, Friends, Colleagues)
- Reuse contacts across multiple events

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **MySQL** 8.0+
- **npm** v9+

### 1. Database Setup

Open MySQL and create the database:
```sql
CREATE DATABASE eventwise;
```

### 2. Backend Setup

```bash
cd server

# Update .env with your MySQL credentials
# Edit .env file: DB_USER, DB_PASSWORD

npm install
npm run dev
```

The server will auto-create all tables on first run.

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 4. Open the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## 📁 Project Structure

```
eventwise/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/        # BottomNav
│       ├── context/           # AuthContext (JWT)
│       ├── pages/             # All 7 pages
│       ├── services/          # API service layer
│       └── utils/             # Helpers, toast, icons
├── server/                    # Express REST API
│   └── src/
│       ├── config/            # Database config
│       ├── controllers/       # 6 controllers
│       ├── middleware/        # Auth + error handler
│       ├── models/            # 7 Sequelize models
│       ├── routes/            # 6 route files
│       └── utils/             # Code gen, platform detect
└── README.md
```

---

## 🔌 API Endpoints

| Area | Method | Endpoint | Auth |
|------|--------|----------|------|
| Auth | POST | `/api/auth/register` | ❌ |
| Auth | POST | `/api/auth/login` | ❌ |
| Auth | GET | `/api/auth/me` | ✅ |
| Events | POST | `/api/events` | ✅ |
| Events | GET | `/api/events` | ✅ |
| Events | GET | `/api/events/:id` | ✅ |
| Events | PUT | `/api/events/:id` | ✅ |
| Events | DELETE | `/api/events/:id` | ✅ |
| Events | GET | `/api/events/share/:code` | ❌ |
| Wishlist | POST | `/api/events/:id/wishlist` | ✅ |
| Wishlist | GET | `/api/events/:id/wishlist` | ❌ |
| Wishlist | POST | `/api/wishlist/:id/claim` | ❌ |
| RSVP | POST | `/api/events/:id/rsvp` | ❌ |
| RSVP | GET | `/api/events/:id/rsvp/stats` | ❌ |
| RSVP | GET | `/api/events/:id/rsvp` | ✅ |
| Contacts | CRUD | `/api/contacts` | ✅ |
| Invites | POST | `/api/events/:id/invitations` | ✅ |
| Invites | GET | `/api/events/:id/invitations` | ✅ |
| Invites | GET | `/api/events/:id/invitations/whatsapp/:inviteId` | ✅ |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Axios
- **Backend:** Node.js, Express, Sequelize ORM
- **Database:** MySQL 8
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **WhatsApp:** Deep links (wa.me)
- **Styling:** Vanilla CSS (dark mode, glassmorphism, animations)
