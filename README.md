# 🕒 SlotSwapper

**SlotSwapper** is a real-time time-slot management and swapping platform built for organizations (like libraries, labs, or study rooms) where users can **book**, **manage**, and **swap** reserved time slots without manual cancellations.

It’s a smart calendar-based app that enables users to manage their bookings, mark slots as swappable, and trade them seamlessly with others — all powered by real-time updates using **Socket.IO**.

---

## 🚀 Live Demo

🔹 **Frontend (Vercel):** [https://slot-swapper-murex.vercel.app](https://slot-swapper-murex.vercel.app)  
🔹 **Backend (Render):** [https://slotswapper-97z9.onrender.com](https://slotswapper-97z9.onrender.com)

---

## 🧩 Features

✅ **Dynamic Calendar View**
- Built with **FullCalendar.js**  
- Displays all events (user’s and others’) with color-coded statuses:
  - 🟦 Busy (Your events)  
  - 🟩 Swappable  
  - 🟧 Swap Pending  
  - 🟣 Others’ Swappable  
  - ⚫ Others’ Busy  

✅ **Real-Time Updates**
- Powered by **Socket.IO**
- Instant event creation, status change, and swap reflection across all connected users — no page reloads!

✅ **Smart Swap System**
- Users can send and accept/reject swap requests.
- If multiple users request to swap with the same slot, only one is accepted — others automatically reset to available.
- Prevents double-booking and slot conflicts.

✅ **Conflict Detection**
- Shows a friendly message when a slot is already booked, with next available time.

✅ **Interactive Tooltips**
- Hovering over any event shows its title, timing, owner, and status.

✅ **Authentication System**
- Users register and log in securely.
- JWT-based authentication handled in Axios interceptors.

✅ **Fully Responsive UI**
- Built with **React + TailwindCSS**  
- Optimized for desktops, tablets, and mobiles.

---

## 🛠️ Tech Stack

### **Frontend**
- React.js (Vite)
- FullCalendar.js
- Tailwind CSS
- Axios
- Socket.IO Client
- Moment.js

### **Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (real-time)
- JWT Authentication
- Render (hosting)

---

## ⚙️ Local Development Setup

Follow these steps to run **SlotSwapper** locally on your machine 👇

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/slotswapper.git
cd slotswapper
```

### 2️⃣ Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file inside `/Backend`:

```env
PORT=4000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
```

**Example:**

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/SlotSwapper
JWT_SECRET=mysecretkey123
```

Start the backend server:

```bash
npm start
```

The backend will run on **http://localhost:4000**

### 3️⃣ Setup Frontend

```bash
cd ../Frontend
npm install
```

**Configure environment** (optional for local testing):

No manual configuration needed — the frontend automatically detects environment.
- **Local:** `http://localhost:4000/api`
- **Production:** `https://slotswapper-97z9.onrender.com/api`

Start the frontend:

```bash
npm run dev
```

Now open **http://localhost:5173** to view the app.

### 4️⃣ Test Real-Time Functionality

1. Open the app in two different browsers or tabs
2. Log in as two different users
3. Try adding or updating an event from one user's calendar
4. The change appears instantly on the other's calendar — no refresh required! ⚡

## 🧠 Architecture Overview

```
                           ┌──────────────────────────┐
                           │      MongoDB Atlas       │
                           │  (stores users, events,  │
                           │  swaps, and tokens)      │
                           └───────────▲──────────────┘
                                       │
                                       │
┌──────────────────────────────┐       │        ┌──────────────────────────────┐
│      Frontend (Vercel)       │◀──────┼──────▶│       Backend (Render)       │
│  React + Vite + TailwindCSS  │  HTTPS│API + WS│ Node.js + Express + Socket.IO│
│                              │       │        │                              │
│ • CalendarView.jsx           │       │        │ • routes/events.js           │
│ • SwapModal.jsx              │       │        │ • routes/swaps.js            │
│ • socket.js (WebSocket)      │       │        │ • routes/auth.js             │
│ • axios.js (JWT Auth)        │       │        │ • server.js (Socket bridge)  │
└──────────────────────────────┘       │        └──────────────────────────────┘
                                       │
                              🔁 Real-time updates
```

## 📁 Folder Structure

```
SlotSwapper/
│
├── Backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── swaps.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── SwapRequest.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── Frontend/
    ├── src/
    │   ├── pages/
    │   │   └── CalendarView.jsx
    │   ├── components/
    │   │   └── SwapModal.jsx
    │   ├── api/
    │   │   └── axios.js
    │   ├── socket.js
    │   └── main.jsx
    ├── package.json
    └── tailwind.config.js
```

## 🌍 Deployment Guide

### 🧠 Backend (Render)

1. Push the `Backend` folder to GitHub
2. Go to [Render](https://render.com) → Create a Web Service → Connect your repo
3. Add these environment variables:
   ```
   MONGO_URI=<your_mongodb_uri>
   JWT_SECRET=<your_jwt_secret>
   ```
4. Start command:
   ```bash
   node server.js
   ```
5. Deploy → Render will provide a URL like:
   
   👉 **https://slotswapper-97z9.onrender.com**

### 💻 Frontend (Vercel)

1. Push the `Frontend` folder to GitHub
2. Import into [Vercel](https://vercel.com)
3. Build command:
   ```bash
   npm run build
   ```
4. Output directory:
   ```
   dist
   ```
5. Add environment variable (optional for dev):
   ```
   VITE_API_URL=https://slotswapper-97z9.onrender.com
   ```
6. Deploy → Live at:
   
   👉 **https://slot-swapper-murex.vercel.app**

## 🔁 Real-Time Workflow Example

| Step | Action | Result |
|------|--------|--------|
| 1️⃣ | User A creates a new event | Appears instantly on User B's and C's calendars |
| 2️⃣ | User B sends a swap request to A | A sees it live (no refresh) |
| 3️⃣ | User C also sends a swap request | Both requests visible to A simultaneously |
| 4️⃣ | A accepts one request | Swap occurs instantly, other request auto-resets |
| ✅ | All users' calendars sync automatically | Thanks to Socket.IO real-time updates |

## 🎯 Key Features in Detail

### Real-Time Synchronization
- WebSocket connection using Socket.IO ensures instant updates
- Event changes broadcast to all connected clients
- No manual refresh required

### Event Management
- Create, update, and delete events
- Visual calendar interface
- Color-coded events for easy identification

### Swap System
- Send swap requests to other users
- Accept or decline incoming requests
- Automatic conflict resolution
- Real-time notification of swap status

## 🔐 Security

- JWT-based authentication
- Protected API routes
- Secure password hashing
- Environment-based configuration

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Swaps
- `GET /api/swaps` - Get swap requests
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id` - Accept/Decline swap

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 👨‍💻 Author

**Pratyush Acharya**

📧 pratyushacharya34@gmail.com

🔗 [LinkedIn](https://www.linkedin.com/in/acharyapratyush/)

---

⭐ If you found this project helpful, please give it a star!

Made with ❤️ by Pratyush Acharya
