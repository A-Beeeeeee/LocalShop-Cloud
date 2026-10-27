# LocalShop Cloud 🛒☁️
### Hyperlocal Multi-Tenant SaaS E-Commerce and Rapid Delivery Platform

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://localshop-frontend-one.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=flat&logo=render)](https://localshop-backend-v5sv.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas%20M0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20LTS-339933?style=flat&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌐 Live Deployments & Repository

- **Live Storefront (Frontend):** [https://localshop-frontend-one.vercel.app](https://localshop-frontend-one.vercel.app)
- **Live REST API (Backend):** [https://localshop-backend-v5sv.onrender.com](https://localshop-backend-v5sv.onrender.com)
- **API Health Check Probe:** [https://localshop-backend-v5sv.onrender.com/api/health](https://localshop-backend-v5sv.onrender.com/api/health)
- **GitHub Repository:** [https://github.com/A-Beeeeeee/LocalShop-Cloud](https://github.com/A-Beeeeeee/LocalShop-Cloud)

---

## 📖 Overview & Value Proposition

**LocalShop Cloud** is a cloud-native, multi-tenant Software-as-a-Service (SaaS) platform engineered to digitally aggregate neighborhood physical retailers into an on-demand, rapid-delivery fulfillment network.

While centralized quick-commerce operators (e.g., Blinkit, Zepto, Instamart) rely on capital-heavy urban dark stores that incur steep warehouse real estate expenses and displace independent brick-and-mortar merchants, LocalShop Cloud implements an **asset-light three-tier cloud architecture**. It transforms neighborhood Kirana and boutique stores into decentralized micro-fulfillment centers.

### Key Capabilities:
1. **Locality-Based Dual-Tier SLA Engine:** Automatically evaluates buyer delivery locality against merchant store locality. Orders within the same locality qualify for **15–30 Minute Hyperlocal Express Delivery**; cross-zone orders dynamically transition to **1–2 Day Standard Delivery**.
2. **Retailer Grouped Package Fulfillment:** Eliminates single-item order chaos by aggregating multi-item checkouts into consolidated merchant package fulfillment cards with one-click batch packing.
3. **Cryptographic 4-Digit Doorstep OTP Verification:** Secure delivery handover requiring crowdsourced delivery partners to verify the customer's 4-digit numeric code before completing the dispatch.
4. **Mongoose Inventory Decrement Engine:** Prevents overselling during concurrent checkouts and automatically restocks returned goods.
5. **Decoupled Three-Tier Cloud Infrastructure:** Vercel Global Edge CDN (Frontend SPA) + Render PaaS (Node.js API) + MongoDB Atlas M0 3-Node Replica Set (AWS Mumbai `ap-south-1`).

---

## 🏛️ Cloud Architecture & Topology

```
+-----------------------------------------------------------------------------------+
|                           PRESENTATION TIER (CLIENT)                              |
|   React 18 SPA | Context API State | Lucide React Icons | Responsive Viewports    |
|   Hosted on Vercel Global Edge CDN (Anycast DNS, Automated GitHub CI/CD)         |
+----------------------------------------+------------------------------------------+
                                         | HTTPS / REST (JSON)
                                         v
+-----------------------------------------------------------------------------------+
|                        APPLICATION LOGIC TIER (PAAS API)                          |
|   Node.js 18 LTS + Express.js REST Engine                                        |
|   Hosted on Render Cloud Application PaaS                                         |
|                                                                                   |
|  [Security & Middleware]                                                          |
|   - CORS Validation (Allowed Origin Headers)                                      |
|   - Stateless JWT Verification & Expiry (7-Day TTL)                               |
|   - Role-Based Access Control: requireRole('customer'|'retailer'|'delivery'|'admin') |
|   - Express JSON Body Parser (15 MB Limit)                                        |
|                                                                                   |
|  [Modular REST Controllers]                                                       |
|   - /api/auth       : Registration, Login, Address Book, Availability             |
|   - /api/products   : Multi-tenant Catalog CRUD, Category Filtering, Store Directory|
|   - /api/orders     : Order Lifecycle, Grouped Fulfillment, OTP Verification     |
|   - /api/dashboard  : Aggregated Merchant & Courier Operational Metrics          |
|   - /api/admin      : Merchant/Courier Verification Gateways, Platform GMV Stats  |
+-------------------+-----------------------------------+---------------------------+
                    |                                   |
         Mongoose ODM (TLS / TCP 27017)       HTTPS External Web APIs
                    |                                   |
                    v                                   v
+------------------------------------+  +-------------------------------------------+
|      DATA PERSISTENCE TIER         |  |          EXTERNAL CLOUD SERVICES          |
|  MongoDB Atlas M0 Shared Cluster   |  |  - Google Maps Platform API:             |
|  AWS ap-south-1 (Mumbai Region)    |  |    Turn-by-turn courier delivery routing  |
|  3-Node Replica Set, Auto Failover |  |  - Razorpay Payment Gateway:             |
|  Collections: Users, Products,     |  |    Checkout payment signature simulation  |
|  Orders, Addresses                 |  +-------------------------------------------+
+------------------------------------+
```

---

## 👥 The Four Authenticated User Roles

| Role | Scope & Permissions | Key User Interface & Operational Capabilities |
| :--- | :--- | :--- |
| 🛒 **Customer** | End-consumer browsing & purchasing | Public catalog search, filter by category/store locality, cart with live express delivery badge, Cash on Delivery (COD) / Razorpay checkout, live order tracking stepper, and 4-digit doorstep delivery OTP view. |
| 🏪 **Retailer** | Neighborhood merchant / Kirana store owner | Requires Admin vetting prior to activation. Manage product catalog (stock, price, images, locality), view grouped package fulfillment cards, execute 1-click batch packing, download GST tax invoices. |
| 🛵 **Delivery Partner** | Crowdsourced local gig courier | Requires Admin vetting. Available dispatch task pool, exclusive 1-click order claiming lock, Google Maps turn-by-turn routing to store and customer doorstep, 4-digit OTP handover verification, rider wallet. |
| 🛡️ **Platform Admin** | Central operational supervisor | Merchant verification portal (approve/reject new Kiranas), courier licensing verification, user account management, platform Gross Merchandise Value (GMV) analytics. |

---

## ⚡ Delivery SLA & Locality Geofencing Engine

LocalShop Cloud matches the buyer's shipping locality against each vendor's store locality using exact normalized locality string comparisons:

```
                  +--------------------------------+
                  |  Customer Checkout Initiated   |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Compare Customer Locality to  |
                  |     Merchant Store Locality    |
                  +---------------+----------------+
                                  |
               +------------------+------------------+
               |                                     |
         [Same Locality]                      [Different Locality]
               |                                     |
               v                                     v
  +--------------------------+          +--------------------------+
  |  15-30 Min Hyperlocal    |          |  1-2 Day Intra-City      |
  |     Express Delivery     |          |    Standard Delivery     |
  |  Base Shipping: INR 25   |          |  Base Shipping: INR 50   |
  +--------------------------+          +--------------------------+
```

- **Express Delivery:** If all items in cart originate from stores in the customer's locality (e.g. `Velachery` → `Velachery`), the order receives the **15–30 Minute Express** badge.
- **Auto-Revert Logic:** If a customer removes cross-locality items from their active cart, the client automatically reverts the cart SLA back to 15–30 Min Express mode.

---

## 📦 Order Lifecycle & Cryptographic OTP Handover

```
[PLACED] ──────> [PACKED] ──────> [PICKED_UP] ──────> [OUT_FOR_DELIVERY] ──────> [DELIVERED]
   │                │                 │                     │                         │
Customer         Retailer          Courier               Courier                   Courier
Places Order     Batch Packs       Claims Order          Arrives at Doorstep       Enters Customer OTP
(OTP Generated)  (Fulfill All)     & Collects Bag        & Requests Code           (Status Confirmed)
```

1. **Order Placement (`placed`):** A unique 4-digit cryptographic OTP is generated (e.g., `5201`) and stored securely on the order document. It is displayed **only on the customer's tracking stepper**.
2. **Merchant Batch Fulfillment (`packed`):** The retailer reviews the grouped order package card on their dashboard and clicks **"Accept & Pack All Items"** (`PUT /api/orders/:id/retailer-fulfill-all`). Catalog inventory stock is updated atomically.
3. **Courier Claim & Pickup (`picked_up`):** The order enters the crowdsourced courier dispatch pool. A verified rider claims the task, locking out other riders, and navigates to the store via Google Maps.
4. **Transit (`out_for_delivery`):** The courier departs for the customer's delivery destination.
5. **Doorstep Handover (`delivered`):** The courier requests the 4-digit OTP from the customer and enters it into the delivery console (`POST /api/orders/:id/delivery/verify-otp`). If the OTP matches, the order transitions to `delivered`, the delivery timestamp is recorded, and the rider's wallet is credited. If invalid, the request is rejected with HTTP 400.

---

## 🛠️ REST API Specification

### Authentication & User Management (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (Customer, Retailer, Delivery). |
| `POST` | `/api/auth/login` | Public | Authenticate user, verify password with bcrypt, issue 7-day JWT. |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve authenticated user profile. |
| `PUT` | `/api/auth/profile` | Authenticated | Update user profile details. |
| `GET` | `/api/auth/addresses` | Authenticated | List saved customer delivery addresses. |
| `POST` | `/api/auth/addresses` | Authenticated | Add a new shipping address with locality tags. |
| `DELETE` | `/api/auth/addresses/:id` | Authenticated | Remove a saved shipping address. |
| `PUT` | `/api/auth/delivery-availability` | Delivery | Toggle delivery partner online/offline shift status. |

### Products & Catalog (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Browse catalog with query search, category, and store filters. |
| `GET` | `/api/products/stores` | Public | Retrieve verified merchant directory with localities. |
| `GET` | `/api/products/mine` | Retailer | List catalog inventory belonging to the logged-in merchant. |
| `POST` | `/api/products` | Retailer | Create a new product listing with image, price, and stock. |
| `PUT` | `/api/products/:id` | Retailer | Update product details or restock inventory levels. |
| `DELETE` | `/api/products/:id` | Retailer | Delete a product listing from the storefront. |

### Orders & Fulfillment (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Customer | Place order (COD or Razorpay) with address and locality validation. |
| `GET` | `/api/orders/mine` | Customer | Retrieve customer order history with tracking status and OTP. |
| `GET` | `/api/orders/retailer` | Retailer | Retrieve grouped order packages awaiting merchant packing. |
| `PUT` | `/api/orders/:id/retailer-fulfill-all` | Retailer | One-click batch packing for all items in an order. |
| `GET` | `/api/orders/delivery/available` | Delivery | List open orders available for claiming within partner zone. |
| `GET` | `/api/orders/delivery/mine` | Delivery | List courier's active and completed delivery runs. |
| `PUT` | `/api/orders/:id/delivery/accept` | Delivery | Atomically claim an available delivery task. |
| `PUT` | `/api/orders/:id/delivery/pickup` | Delivery | Confirm package pickup from retailer store. |
| `POST` | `/api/orders/:id/delivery/verify-otp` | Delivery | Validate customer 4-digit doorstep OTP and complete delivery. |
| `PUT` | `/api/orders/:id/cancel` | Customer | Cancel unfulfilled order and atomically restock inventory. |

### Administration & Metrics (`/api/admin`, `/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/retailers` | Admin | List all registered retailers with approval flags. |
| `PUT` | `/api/admin/retailers/:id/approve` | Admin | Approve pending merchant account for dashboard access. |
| `GET` | `/api/admin/delivery-partners` | Admin | List all delivery couriers with approval flags. |
| `PUT` | `/api/admin/delivery-partners/:id/approve`| Admin | Verify and activate delivery partner account. |
| `GET` | `/api/admin/stats` | Admin | View platform-wide Gross Merchandise Value (GMV) and counts. |
| `GET` | `/api/dashboard/retailer` | Retailer | Merchant metrics (revenue, active orders, low stock items). |
| `GET` | `/api/dashboard/delivery` | Delivery | Courier metrics (today's earnings, completed deliveries). |

---

## 🔑 Demonstration Testing Credentials

> The accounts below are pre-seeded demonstration accounts for evaluating each user role and verifying end-to-end workflows:

| Role | Email / Username | Password | Designated Role Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| 🛒 **Customer** | `bee@gmail.com` | `123456` | Full buyer storefront, address checkout, live tracking stepper, 4-digit delivery OTP view. |
| 🏪 **Retailer** | `freshnestmart.demo@gmail.com` | `Fresh@2026Mart` | Merchant dashboard, grouped package cards, 1-click batch pack, GST tax invoice download. |
| 🛵 **Delivery Partner**| `arjun.kumar@example.com` | `LocalShop@123` | Task claim console, Google Maps routing link, 4-digit doorstep OTP validation. |
| 🛡️ **Platform Admin** | `admin@localshop.com` | `admin123` | Merchant vetting approval portal, courier licensing verification, platform GMV analytics. |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git**
- **MongoDB Atlas Cluster** or local MongoDB instance (`mongodb://localhost:27017/localshop`)

### 1. Clone the Repository
```bash
git clone https://github.com/A-Beeeeeee/LocalShop-Cloud.git
cd LocalShop-Cloud
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure Environment Variables
cp .env.example .env
```

Configure your `backend/.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER_URL>/<DATABASE_NAME>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
```

Start the backend API:
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```
Verify the server is running by opening: `http://localhost:5000/api/health`

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Configure Environment Variables
cp .env.example .env
```

Configure your `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the React client:
```bash
npm start
```
The browser will automatically open [http://localhost:3000](http://localhost:3000).

---

## 🚀 Cloud Deployment Architecture

| Tier | Cloud Provider | Service Type | Operational Details & Configuration |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Edge CDN Static Hosting | Automated CI/CD git push trigger, Anycast global edge network, client-side routing rewrites (`vercel.json`). |
| **Backend API** | **Render** | Container PaaS Web Service | Automated Git push deployment, Node.js 18 runtime, environment variable injection, `/api/health` keep-alive endpoint. |
| **Database** | **MongoDB Atlas**| Managed Cloud Database | Shared M0 replica set (AWS Mumbai `ap-south-1`), TLS/SSL encrypted connection, automated data persistence. |
| **Navigation** | **Google Maps** | External Geospatial API | Embedded navigation links directing delivery couriers to merchant pickup and customer doorstep. |
| **Payments** | **Razorpay** | Payment Gateway API | Webhook and client-side checkout simulation for instant digital payment confirmation. |

> **Note on Free-Tier Hosting:** Render's free tier automatically suspends web service containers after 15 minutes of idle time. The initial HTTP request may experience a cold-start latency of ~30–45 seconds while the Node.js container provisions. Once warm, API endpoints consistently respond in sub-120 ms.

---

## 🧪 Comprehensive Verification & Test Suite

The platform has been validated against **14 End-to-End Test Scenarios** covering both happy-path fulfillment and security boundary conditions:

| Test ID | Test Scenario | Procedure | Expected Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Customer Auth | Register & login as customer | JWT token issued; role set to `customer` | **PASSED** |
| **TC-02** | Retailer Approval Gate | Register retailer & attempt login | HTTP 403: "Account pending admin approval" | **PASSED** |
| **TC-03** | Admin Merchant Approval| Admin clicks "Approve" for merchant | Approval flag set to `true`; login unlocked | **PASSED** |
| **TC-04** | Same-Locality SLA | Customer & store both in Velachery | 15–30 Min Express Delivery assigned | **PASSED** |
| **TC-05** | Cross-Locality SLA | Store in Velachery, delivery in Tambaram | 1–2 Day Standard Delivery assigned | **PASSED** |
| **TC-06** | Atomic Stock Decrement | Order 2 units of item with stock 30 | Stock atomically decremented to 28 | **PASSED** |
| **TC-07** | Out-of-Stock Race Check| Request 5 units when only 3 remain | HTTP 400: "Insufficient stock available" | **PASSED** |
| **TC-08** | Retailer Batch Pack | Merchant clicks "Accept & Pack All" | All items marked fulfilled in single PUT | **PASSED** |
| **TC-09** | Role Guard Protection | Customer token sent to retailer endpoint | HTTP 403 Forbidden via `requireRole` guard | **PASSED** |
| **TC-10** | Tampered JWT Guard | Send manipulated Authorization header | HTTP 401 Unauthorized via `requireAuth` | **PASSED** |
| **TC-11** | Courier Task Claim Lock| Two couriers attempt to claim same run | Courier A succeeds; Courier B receives HTTP 400 | **PASSED** |
| **TC-12** | Invalid Doorstep OTP | Courier enters incorrect 4-digit code | HTTP 400: "Invalid Doorstep Delivery OTP" | **PASSED** |
| **TC-13** | Valid OTP Handover | Courier enters matching customer OTP | Order marked `delivered`; rider wallet credited | **PASSED** |
| **TC-14** | Customer Return Restock| Customer requests return; merchant approves| Order refunded; catalog stock restored | **PASSED** |

---

## 👥 Authors & Subsystem Ownership

| Contributor | Architectural Subsystems & Key Git Commits |
| :--- | :--- |
| **Abinayaa M B** | - **Frontend UI/UX Architecture:** React 18 SPA, emerald theme, responsive layouts.<br/>- **Dual-Tier Locality Geofencing Engine:** Intra-locality detection & auto-reverting cart SLA.<br/>- **Customer Order Tracking Stepper:** Real-time stage stepper and 4-digit delivery OTP display.<br/>- **Payment & Invoicing Integration:** Razorpay payment simulation & downloadable GST tax invoice.<br/>- **Key Git Commits:** `f654b18`, `0497aed`, `eaa369d`, `4c56976`, `9431d35`, `90044c2`, `a2ec1e6`, `043e9b0`. |
| **K Maneesh Ram** | - **Backend REST API Architecture:** Express.js routing, stateless JWT auth, RBAC security guards.<br/>- **Retailer Grouped Package Fulfillment:** Multi-item package aggregation controller (`PUT /retailer-fulfill-all`).<br/>- **Inventory Stock Engine:** Atomic stock decrement validation and return restocking logic.<br/>- **Delivery Dispatch Hub:** Open task pool claim lock and 4-digit doorstep OTP verification (`/verify-otp`).<br/>- **Key Git Commits:** `29b4b5d`, `404abe0`, `182d728`, `8eade6f`, `31ea352`, `8bc93e8`, `8ec9656`, `ae36243`. |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
