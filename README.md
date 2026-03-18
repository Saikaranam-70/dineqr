# Restaurant SaaS — Frontend

React 18 + Vite + Tailwind CSS frontend for the QR-based restaurant ordering system.

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | React 18 + Vite                   |
| Styling      | Tailwind CSS 3 + custom components|
| State        | Zustand (with persist)            |
| Data         | TanStack Query v5                 |
| HTTP         | Axios                             |
| WebSocket    | Socket.IO Client                  |
| Charts       | Recharts                          |
| Animation    | Framer Motion                     |
| Forms        | React Hook Form                   |
| Toasts       | React Hot Toast                   |
| Icons        | Lucide React                      |
| Fonts        | Playfair Display + DM Sans        |

## Project Structure

```
src/
├── App.jsx                     # Root router + auth guards
├── main.jsx                    # React entry point
├── styles/
│   └── globals.css             # Tailwind + custom component classes
├── services/
│   ├── api.js                  # Axios instances + all API methods
│   └── socket.js               # Socket.IO client helpers
├── store/
│   └── index.js                # Zustand stores (customer + admin)
├── utils/
│   └── helpers.js              # Formatters, constants, utilities
├── components/
│   └── ui/
│       └── index.jsx           # Reusable UI components
└── pages/
    ├── CustomerPages.jsx       # Scan, Menu, Cart, Orders pages
    ├── AdminLayout.jsx         # Login + sidebar layout
    ├── AdminDashboard.jsx      # Dashboard with charts
    ├── AdminOrders.jsx         # Orders list + KDS
    └── AdminPages.jsx          # Menu, Tables, Analytics, Reviews,
                                # Staff, Coupons, Notifications, Settings
```

## Routes

### Customer (public)
| Path                        | Page              |
|-----------------------------|-------------------|
| `/scan/:token`              | QR scan → session |
| `/menu/:restaurantId`       | Menu browsing     |
| `/cart`                     | Cart + checkout   |
| `/orders`                   | Order tracking    |

### Admin (protected by JWT)
| Path                        | Page              |
|-----------------------------|-------------------|
| `/admin/login`              | Login             |
| `/admin/dashboard`          | Dashboard         |
| `/admin/orders`             | Orders + KDS      |
| `/admin/menu`               | Menu management   |
| `/admin/tables`             | Tables + QR       |
| `/admin/analytics`          | Sales analytics   |
| `/admin/reviews`            | Reviews           |
| `/admin/staff`              | Staff management  |
| `/admin/coupons`            | Coupon codes      |
| `/admin/notifications`      | Notifications     |
| `/admin/settings`           | Settings          |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults use Vite proxy → localhost:5000)

# 3. Start backend first (see restaurant-saas/README.md)

# 4. Start frontend dev server
npm run dev
# → http://localhost:3000
```

## Build for Production

```bash
npm run build
# Output: dist/
```

## Demo Credentials

```
URL:      http://localhost:3000/admin/login
Email:    admin@grandbites.com
Password: Admin@123
```

## Customer Flow

1. Scan QR code on table → `/scan/:token`
2. Redirected to menu → `/menu/:restaurantId`
3. Browse categories, search, view product details
4. Add to cart with variants/add-ons
5. Go to cart → apply coupon → place order
6. Track order status in real-time → `/orders`
7. Call waiter / request bill / pay
8. Rate items after served

## Admin Flow

1. Login at `/admin/login`
2. Dashboard shows live stats + charts
3. Orders page: list view, live view, KDS (kitchen display)
4. Update order status: placed → confirmed → preparing → ready → served
5. Record payment (cash / card / UPI)
6. Manage menu: products + categories CRUD
7. Tables: view occupancy, download/regenerate QR codes
8. Analytics: revenue charts, top products, peak hours, PDF export
9. Reviews: approve, reply, delete
10. Staff: CRUD with roles
11. Coupons: create discount codes

## Real-time Events (Socket.IO)

### Admin namespace (`/admin`)
- `orders:NEW_ORDER` — new order placed
- `orders:ORDER_STATUS_UPDATED` — status changed
- `orders:WAITER_CALLED` — customer called waiter
- `orders:BILL_REQUESTED` — customer requested bill

### Customer namespace (`/customer`)
- `order:STATUS_UPDATE` — order status changed
- `session:WAITER_ACKNOWLEDGED` — waiter acknowledged
- `session:PAYMENT_CONFIRMED` — payment confirmed
