Start the server:
```bash
npm start
```
You should see `MongoDB connected` and `LocalShop Cloud API running on port 5000`.

Test it's alive: open `http://localhost:5000/api/health` in a browser — should return `{"status":"ok"}`.

## Running the frontend

Open a **second terminal**:
```bash
cd localshop-cloud/frontend
npm install
cp .env.example .env
npm start
```
This opens `http://localhost:3000` in your browser, talking to the backend at `http://localhost:5000/api` (set in `.env`).

## Usage walkthrough

1. Go to `/register`, create a **Customer** account — log in immediately, browse the storefront.
2. Register a **Retailer** account (with a shop name) — you'll see "Awaiting admin approval". You can't log in yet.
3. Create an admin account: register as a customer, then in MongoDB Atlas (Collections → `users`), edit that document's `role` field to `"admin"`. Log in with that account to reach `/admin`.
4. As admin, approve the pending retailer.
5. Log in as the retailer, add products from the dashboard.
6. Log in as the customer, add products to cart, place an order.
7. Back in the retailer dashboard, see the order and update its status.

## Deploying to AWS

| Component | AWS service |
|---|---|
| Backend (Node/Express API) | **Elastic Beanstalk** (easiest) or an **EC2** instance running the Node app behind PM2/nginx |
| Frontend (React build) | **S3 static website hosting** + **CloudFront** (or just S3 for a quick demo) |
| Database | Keep **MongoDB Atlas** (simplest, free tier, works from anywhere) — or migrate to **DocumentDB** if you want it fully AWS-native |
| Product images | **S3 bucket** for uploads |

Steps:
1. **Backend**: Deploy the `backend` folder via Elastic Beanstalk (Node.js platform). Set `MONGO_URI`, `JWT_SECRET`, `PORT` as environment variables in the EB console instead of a `.env` file.
2. **Frontend**: In `frontend/.env`, set `REACT_APP_API_URL` to your deployed backend URL (e.g. `http://your-eb-env.elasticbeanstalk.com/api`), then run `npm run build`. Upload the contents of the generated `build/` folder to an S3 bucket with static website hosting enabled, or front it with CloudFront for HTTPS.
3. Make sure the backend's CORS setup (already enabled via the `cors` package in `server.js`) allows requests from your S3/CloudFront frontend URL.

## Features

- Register/login with JWT, role-based access (Customer / Retailer / Admin)
- Retailer approval workflow (retailers can't log in until admin approves)
- Product CRUD for retailers
- Storefront browsing, search, category filter for customers
- Cart and order placement
- Retailer dashboard: stats, product list, order list with status updates
- Admin panel: platform stats, pending retailer approvals

## Roadmap

- Cloud deployment
- Image upload (currently a placeholder box — wire up S3 + an upload field)
- Notifications (email/SMS on order placed)
- Loading states, pagination, form validation polish
