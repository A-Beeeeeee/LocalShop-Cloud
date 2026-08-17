# LocalShop Cloud — Digital Storefront for Local Retailers

A cloud-native SaaS MVP with three roles — Customer, Retailer, Admin — built with:
- **Backend**: Node.js + Express + MongoDB (Mongoose), JWT auth
- **Frontend**: React (Create React App), React Router, Context API

This matches the stack proposed in the SRS (React frontend, Node.js backend, MongoDB Atlas cloud database, AWS hosting).

## 1. Folder structure

```
localshop-cloud/
├── backend/
│   ├── config/db.js              MongoDB connection
│   ├── models/                   User, Product, Order schemas
│   ├── middleware/auth.js        JWT auth + role guard
│   ├── routes/                   auth, products, orders, admin, dashboard
│   ├── server.js                 Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── api.js                 fetch wrapper for backend API
    │   ├── context/                Auth + Cart state
    │   ├── components/            Navbar, ProductCard, PrivateRoute
    │   ├── pages/                  Login, Register, Storefront, Cart,
    │   │                           RetailerDashboard, AdminPanel
    │   ├── App.js, index.js, index.css
    ├── package.json
    └── .env.example
```

## 2. Prerequisites

- Node.js 18+ and npm installed (`node -v`, `npm -v`)
- A MongoDB database — easiest is a free **MongoDB Atlas** cluster:
  1. Go to https://www.mongodb.com/cloud/atlas/register, create a free (M0) cluster.
  2. Under **Database Access**, create a user with a password.
  3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for testing).
  4. Copy the connection string from **Connect → Drivers** — it looks like:
     `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/localshop?retryWrites=true&w=majority`

## 3. Run the backend locally

```bash
cd localshop-cloud/backend
npm install
cp .env.example .env
```

Open `.env` and paste in your real values:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/localshop?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string
PORT=5000
```

Start the server:
```bash
npm start
```
You should see `MongoDB connected` and `LocalShop Cloud API running on port 5000`.

Test it's alive: open `http://localhost:5000/api/health` in a browser — should return `{"status":"ok"}`.

## 4. Run the frontend locally

Open a **second terminal**:
```bash
cd localshop-cloud/frontend
npm install
cp .env.example .env
npm start
```
This opens `http://localhost:3000` in your browser, talking to the backend at `http://localhost:5000/api` (set in `.env`).

## 5. Try it out

1. Go to `/register`, create a **Customer** account — log in immediately, browse the storefront.
2. Register a **Retailer** account (with a shop name) — you'll see "Awaiting admin approval". You can't log in yet.
3. Manually create an admin account: easiest way is to register as a customer, then in MongoDB Atlas (Collections → `users`), edit that document's `role` field to `"admin"`. Log in with that account to reach `/admin`.
4. As admin, approve the pending retailer.
5. Log in as the retailer, add products from the dashboard.
6. Log in as the customer, add products to cart, place an order.
7. Back in the retailer dashboard, see the order and update its status.

## 6. Deploying to AWS (since you're using AWS)

A simple, low-cost setup for this project:

| Component | AWS service |
|---|---|
| Backend (Node/Express API) | **Elastic Beanstalk** (easiest) or an **EC2** instance running the Node app behind PM2/nginx |
| Frontend (React build) | **S3 static website hosting** + **CloudFront** (or just S3 for a quick demo) |
| Database | Keep **MongoDB Atlas** (simplest, free tier, works from anywhere) — or migrate to **DocumentDB** if you specifically want an AWS-native database |
| Product images (future) | **S3 bucket** for uploads |

Quick path for Review 2 / Final Demo:
1. **Backend**: Zip the `backend` folder (after `npm install`, or let EB install it) and deploy via Elastic Beanstalk (Node.js platform). Set `MONGO_URI`, `JWT_SECRET`, `PORT` as environment variables in the EB console instead of a `.env` file.
2. **Frontend**: In `frontend/.env`, set `REACT_APP_API_URL` to your deployed backend URL (e.g. `http://your-eb-env.elasticbeanstalk.com/api`), then run `npm run build`. Upload the contents of the generated `build/` folder to an S3 bucket with static website hosting enabled, or front it with CloudFront for HTTPS.
3. Make sure the backend's CORS setup (already enabled via the `cors` package in `server.js`) allows requests from your S3/CloudFront frontend URL.

This gets you a live public URL for both frontend and backend, satisfying the "Live Cloud Deployment" requirement in the project guidelines.

## 7. What's implemented vs. what's left

**Implemented (MVP core):**
- Register/login with JWT, role-based access (Customer / Retailer / Admin)
- Retailer approval workflow (retailers can't log in until admin approves)
- Product CRUD for retailers
- Storefront browsing, search, category filter for customers
- Cart (client-side) and order placement
- Retailer dashboard: stats, product list, order list with status updates
- Admin panel: platform stats, pending retailer approvals

**Left for Review 2 / Final Demo (per your SRS scope):**
- Cloud deployment (see Section 6 above)
- Image upload (currently just a placeholder box — wire up S3 + an upload field)
- Notifications (e.g. email/SMS on order placed — out of MVP scope for now)
- Polish: loading states, pagination, form validation edge cases
