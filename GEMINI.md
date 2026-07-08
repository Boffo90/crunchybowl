# Crunchy Bowl - Project Instructions

Welcome to the Crunchy Bowl development repository. This file serves as the core authority on project architecture, conventions, workflows, and key business logic. Adhere strictly to these instructions when contributing to the codebase.

---

## 1. Project Overview & Business Domain

**Crunchy Bowl** is a high-quality Korean food online ordering and delivery application based in **Pucón, Chile**.
- **Specialty:** Korean dishes like Bibimbap, Japchae, Korean Fried Chicken, and side options.
- **Service Area:** Pucon, Chile (Urban center and outlying sectors within a 10 km radius).

---

## 2. Core Tech Stack

- **Framework:** Next.js 14.2.35 (App Router, React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS, with utility merging via `clsx` and `tailwind-merge` (`lib/utils.ts` -> `cn`)
- **State Management:** Zustand with persistence (`lib/store/cart.ts`) for client-side shopping cart storage.
- **Database & Auth:** Supabase (using `@supabase/ssr` and `@supabase/supabase-js`)
- **Validation:** Zod for API schemas and form parsing.

---

## 3. Directory Structure

```text
C:\Users\smyo9\crunchybowl\
├── app/                  # Next.js App Router (pages, api, layouts, routes)
│   ├── (auth)/           # Authentication flows (login, registro)
│   ├── (public)/         # Main client pages (carta, carrito, checkout, mi-cuenta, etc.)
│   ├── admin/            # Administrative pages (pedidos)
│   ├── api/              # Route handlers (auth/login, auth/logout, pedidos/crear, etc.)
│   ├── globals.css       # Global styles & Tailwind entry
│   ├── layout.tsx        # Base root layout
│   └── middleware.ts     # Request router, auth state holder, & route-guard middleware
├── components/           # React Components
│   ├── admin/            # Admin-specific components
│   ├── public/           # Client-facing components (ProductCard, CheckoutForm, etc.)
│   └── ui/               # Reusable atomic UI components (Button, Card, Input)
├── lib/                  # Shared utilities, configs, state stores, & clients
│   ├── store/            # Zustand stores
│   ├── supabase/         # Supabase client & server instances
│   ├── delivery.ts       # Haversine distance and delivery tariff calculator
│   ├── horarios.ts       # Business hours checker
│   ├── routes.ts         # Centralized list of application routes
│   ├── utils.ts          # Formatting (CLP), slug generation, Tailwind class merger
│   └── zonas.ts          # Named local delivery zones & static tariffs
├── types/                # Core TypeScript interfaces & types
└── tsconfig.json         # TypeScript configuration
```

---

## 4. Key Architectural Patterns & Conventions

### 4.1. Centralized Routing
Never hardcode navigation paths. Always import and use the `ROUTES` object defined in `lib/routes.ts`:
```typescript
import { ROUTES } from '@/lib/routes';

// Example:
router.push(ROUTES.PRODUCTO(slug));
```

### 4.2. Supabase Client Usage
We use `@supabase/ssr` to handle auth cookies seamlessly across client and server boundaries.
- **Client Components & Hooks:** Use the browser client:
  ```typescript
  import { createClient } from '@/lib/supabase/client';
  const supabase = createClient();
  ```
- **Server Components, Server Actions & API Routes:** Use the server client:
  ```typescript
  import { createClient } from '@/lib/supabase/server';
  const supabase = createClient();
  ```

### 4.3. Currency & Number Formatting (Chilean Peso)
All prices are represented as whole numbers (integers), as Chilean Peso (CLP) does not use cents/decimals.
- Use `formatCLP(value: number)` from `lib/utils.ts` to format currencies:
  ```typescript
  import { formatCLP } from '@/lib/utils';
  
  // Renders: $12.500
  <span>{formatCLP(12500)}</span>
  ```

---

## 5. Domain Logic & Specific Rules

### 5.1. Delivery Fee Calculation (`lib/delivery.ts`)
Delivery fees are based on the **Haversine formula** starting from a fixed origin in Pucón (`lat: -39.2833, lng: -71.9556`):
- **Within Rotondas (≤ 2.5 km):** Flat rate of **$1,500 CLP**.
- **Outside Rotondas (> 2.5 km up to 10 km max):** Base tariff of **$3,000 CLP** + **$300 CLP per extra km** (rounded up).
- **Over 10 km:** Delivery is unavailable.

### 5.2. Named Delivery Zones (`lib/zonas.ts`)
For manual selection or backup, static predefined zones exist in `ZONAS_DELIVERY`:
- Centro (dentro de rotondas): $1,500 CLP
- Peninsula: $2,000 CLP
- Candelaria: $2,500 CLP
- Camino a Villarrica (hasta Km 5): $3,000 CLP
- Camino a Caburgua (hasta Km 5): $3,000 CLP
- Camino Internacional (hasta Km 5): $3,500 CLP

### 5.3. Operating Hours (`lib/horarios.ts`)
Operating hours are configured daily (represented in minutes from midnight):
- **Monday to Friday:** 12:00 (720 min) to 20:00 (1200 min).
- **Saturday & Sunday:** 12:00 (720 min) to 22:00 (1320 min).
- Always use `estaAbiertoAhora()` to check if ordering is allowed, and `proximaApertura()` to display the upcoming opening hours.

### 5.4. User Roles & Admin Access
User accounts can have roles: `'cliente'` or `'admin'`.
- Currently, **Admin Access** is guarded in `middleware.ts`. The primary admin account is hardcoded as `annelid@gmail.com`.
- Any user trying to access `/admin/*` routes is redirected back if their authenticated email does not match.

---

## 6. Workflows & Commands

Always use the following commands for development and validation:

- **Run Dev Server:** `npm run dev`
- **Build Production:** `npm run build`
- **Run Linter:** `npm run lint`

When updating the database schema or making API integrations, verify type safety and build correctness before preparing commits.
