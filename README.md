# LocalShop Cloud

LocalShop Cloud is a hyperlocal multi-tenant e-commerce platform that connects neighborhood physical stores with local customers and delivery partners for rapid on-demand fulfillment.

## Live Links

- **Frontend:** https://localshop-frontend-one.vercel.app
- **Backend API:** https://localshop-backend-v5sv.onrender.com
- **Health Check:** https://localshop-backend-v5sv.onrender.com/api/health
- **GitHub Repository:** https://github.com/A-Beeeeeee/LocalShop-Cloud

## Key Features

- **Four User Roles:** Dedicated dashboards for Customers, Retailers, Delivery Partners, and Admins.
- **Dual-Tier Delivery:** 15-30 minute express delivery for local orders and 1-2 day standard delivery for cross-locality orders.
- **Grouped Order Fulfillment:** Consolidated order cards allowing retailers to pack all items with one click.
- **Doorstep OTP Verification:** Secure 4-digit handover OTP verified by delivery partners before marking orders as delivered.
- **Inventory Management:** Real-time stock decrement during fulfillment and automatic restocking on returns or cancellations.
- **Integrated Maps & Payments:** Embedded Google Maps routing for couriers and Razorpay payment workflow simulation.

## Tech Stack

- **Frontend:** React 18, React Router v6, Context API, CSS3
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Deployment:** Vercel (Frontend), Render (Backend API)
- **External Services:** Google Maps Platform, Razorpay

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB Atlas database URI or local MongoDB instance

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Configure your environment variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set the API URL:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Start the frontend application:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License.
