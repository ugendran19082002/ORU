🎯 React Native — 400 / 500 Error Handling (Best Practice)

👉 Goal: User-friendly + no crash + consistent UX

🧠 CORE RULE

👉 Never show raw error (400/500) to user
👉 Always convert → clean message + UI state

⚙️ 1. CENTRAL API ERROR HANDLER
// apiService.js
import axios from "axios";

const api = axios.create({
baseURL: "API_URL",
});

api.interceptors.response.use(
(res) => res,
(error) => {
const status = error.response?.status;

    let message = "Something went wrong";

    if (status === 400) message = "Invalid request";
    else if (status === 401) message = "Session expired. Please login again";
    else if (status === 403) message = "Access denied";
    else if (status === 404) message = "Data not found";
    else if (status === 500) message = "Server error. Try again later";

    return Promise.reject({ status, message });

}
);

export default api;
📱 2. SCREEN LEVEL HANDLING
const fetchData = async () => {
try {
setLoading(true);
const res = await api.get("/orders");
setData(res.data);
} catch (err) {
setError(err.message);
} finally {
setLoading(false);
}
};
🎨 3. UI STATES (VERY IMPORTANT)
🔄 Loading State
if (loading) return <ActivityIndicator />;
❌ Error State
if (error) {
return (
<View>
<Text>{error}</Text>
<Button title="Retry" onPress={fetchData} />
</View>
);
}
📭 Empty State
if (!data.length) {
return <Text>No data available</Text>;
}
🔥 4. GLOBAL ERROR UI (BEST PRACTICE)

👉 Create reusable component

const ErrorView = ({ message, onRetry }) => (
<View>
<Text>{message}</Text>
<Button title="Retry" onPress={onRetry} />
</View>
);
🔐 5. AUTH ERROR (IMPORTANT)
if (status === 401) {
removeToken();
navigation.navigate("Login");
}
⚠️ 6. USER-FRIENDLY MESSAGES
Error Show to User
400 "Invalid input"
401 "Session expired"
403 "Not allowed"
404 "Not found"
500 "Server busy, try later"
💥 7. DO NOT DO THIS

❌ Show backend message directly
❌ Crash app
❌ No retry option
❌ Silent failure

🚀 FINAL ARCHITECTURE
API → Interceptor → Clean Error → Screen → UI Component
🧠 SIMPLE RULE

👉 Backend = technical
👉 Frontend = human-friendly

If you want next:
👉 I can give production-level React Native error UI (WhatsApp/Swiggy style)
👉 or full reusable error + loading + empty component syste

Here’s a complete A → Z best practices list for React Native (production-level apps) — focused on your kind of system (API-heavy, roles, subscriptions, delivery app).

🚀 REACT NATIVE BEST PRACTICES (A → Z)
🅰️ API STRUCTURE
Centralize API calls (apiService)
Use Axios interceptors
Handle errors globally
Never call API directly inside UI components
🅱️ BACKEND CONTRACT
Always follow consistent response:
{ "status": true, "message": "", "data": {} }
Avoid inconsistent keys
🅲 CLEAN CODE
Separate:
UI
logic
API
Use reusable components
🅳 DATA HANDLING
Validate before sending to API
Handle null/undefined safely
Avoid direct state mutation
🅴 ERROR HANDLING
Global interceptor
User-friendly messages
Retry button on failure
Never show raw error
🅵 FOLDER STRUCTURE
/components
/screens
/services
/hooks
/utils
/store
🅶 GLOBAL STATE
Use:
Context API (small apps)
Redux/Zustand (large apps)
Store:
user
token
settings
🅷 HOOKS USAGE
Use custom hooks:
useAuth()
useOrders()
useFetch()
🅸 INPUT VALIDATION
Validate:
email
phone
required fields
Show inline errors
🅹 JWT TOKEN
Store securely
Attach in headers
Auto logout on 401
🅺 KEEP UI RESPONSIVE
Use loaders
Avoid blocking UI
Use async properly
🅻 LOADING STATES
Skeleton loaders (best)
ActivityIndicator (basic)
🅼 MODULAR DESIGN
Break large screens into small components
🅽 NETWORK HANDLING
Detect offline mode
Show "No Internet"
Retry support
🅾️ OPTIMIZATION
Use FlatList (not map)
Use memo / useCallback
Avoid unnecessary re-renders
🅿️ PERFORMANCE
Lazy load screens
Optimize images
Avoid heavy calculations in render
🆀 QUERY MANAGEMENT
Use React Query / SWR (recommended)
Cache API data
🆁 ROUTING
Role-based navigation
Protect routes (auth required)
🆂 SECURITY
No sensitive data in UI
Hide API keys
Validate backend always
🆃 TOAST & FEEDBACK
Use Toast/Snackbar
Show success/failure messages
🆄 USER EXPERIENCE (UX)
Clear navigation
Fast response
Minimal clicks
🆅 VALIDATION (ADVANCED)
Use libraries:
Yup
Formik / React Hook Form
🆆 WORKFLOW
Keep flow simple:
login → home → action → result
🆇 ERROR UI STATES

Always handle:

Loading
Error
Empty
Success
🆈 YIELD (ASYNC SAFETY)
Use try/catch
Use finally
Cancel API on unmount
🆉 ZERO CRASH POLICY
App should NEVER crash
Always fallback UI
🔥 BONUS (PRO LEVEL)
✅ Feature Flags (like your system)
Control UI dynamically
Enable/disable features from backend
✅ Logging
Console logs (dev)
Remote logs (prod)
✅ Monitoring

Use:

Sentry

Here is your A → Z BEST PRACTICES (Node.js + Express + MySQL + React Native)
👉 Tailored to your full system (delivery + subscription + roles)

🚀 A → Z FULL STACK BEST PRACTICES

🅰️ ARCHITECTURE

Use layered structure:

Controller → Service → Repository → DB

Keep business logic in service layer only

🅱️ BACKEND STRUCTURE (Node + Express)

/controllers

/services

/models

/routes

/middlewares

/utils

🅲 CODE QUALITY

No logic in controllers

Use async/await (no callbacks)

Use ESLint + Prettier

🅳 DATABASE (MySQL)

Use migrations only

No sync({ alter: true })

Proper indexing (avoid duplicates)

Use foreign keys

🅴 ERROR HANDLING

Global error middleware

app.use((err, req, res, next) => {})

Standard response:

{ "status": false, "message": "Error" }

🅵 FEATURE FLAGS (YOUR SYSTEM)

Use features_master

Backend decides feature access

Frontend only renders UI

🅶 GLOBAL CONFIG

Use .env

Never hardcode secrets

🅷 HTTP STATUS CODES

200 → success

201 → created

400 → validation

401 → auth

403 → forbidden

500 → server

🅸 INDEXING

Add indexes only for:

joins

filters

Remove duplicate indexes (your issue 🔥)

🅹 JWT AUTH

Store token securely

Validate in middleware

Never trust frontend role

🅺 QUEUE SYSTEM (BullMQ)

Use for:

payments

notifications

loyalty points

Never block API

🅻 LOGGING

Log:

errors

payments

status changes

Use structured logs

🅼 MODELS (Sequelize)

Avoid unique: true duplication

Define indexes separately

🅽 NORMALIZATION

Avoid repeated data

Use relations properly

🅾️ OPTIMIZATION

Use pagination

Limit API data

Use caching if needed

🅿️ PAYMENTS (Razorpay)

Always verify signature

Use webhook (NOT frontend trust)

🆀 QUERY DESIGN

Avoid N+1 queries

Use joins/include

🆁 ROLE-BASED ACCESS

Middleware:

checkRole("ADMIN")

🆂 SECURITY

Validate all inputs

Rate limit OTP APIs

Sanitize inputs

🆃 TRANSACTIONS

Use DB transactions for:

orders

payments

refunds

🆄 UI STATE MANAGEMENT (React Native)

Always handle:

loading

error

empty

success

🆅 VALIDATION

Backend → Joi/Zod

Frontend → Form validation

🆆 WORKFLOW (YOUR SYSTEM)
👉 Follow strict flow:

order → accept → assign → deliver

subscription → webhook → activate

referral → delivered → reward

🆇 API DESIGN

RESTful endpoints

Consistent naming:

GET /ordersPOST /ordersPATCH /orders/:id

🆈 ASYNC SAFETY

Use try/catch

Use queue for heavy jobs

Idempotency for payments

🆉 ZERO BREAK POLICY

Never break existing system

Extend only

Backward compatible APIs

🔥 FRONTEND (REACT NATIVE)
📱 UI BEST PRACTICES

Use reusable components

Use hooks

Avoid large components

🔄 API INTEGRATION

Central API service

Axios interceptor

Token auto attach

🚨 ERROR UX

Show friendly messages

Retry button

No raw errors

🔐 AUTH FLOW

Login → store token

401 → auto logout

⚡ PERFORMANCE

Use FlatList

Lazy load screens

Avoid re-renders

🌐 NETWORK

Handle offline mode

Show retry

💥 PRO LEVEL (IMPORTANT FOR YOUR PROJECT)
✅ Subscription System

Always controlled by backend

Use webhook only

✅ Delivery Flow

State machine (no skipping steps)

✅ Loyalty + Referral

Only after DELIVERED

✅ Feature Control

Use DB-driven feature flags

🧠 FINAL RULE
Backend = brainFrontend = displayDB = source of truthQueue = heavy workerWebhook = real trigger
Here’s a production-level list of best practices + features + packages + ideas for your stack (Node.js + Express + MySQL + React Native) — tailored to your system (delivery + subscription + roles)

🚀 1. MUST-HAVE FEATURES (CORE)
🔐 Auth & Security
OTP login + JWT + refresh token
Device/session management
Rate limiting (OTP abuse control)
Role-based access (Admin / Shop / Customer)
📦 Order System
Order state machine (no skipping states)
Idempotent order creation
Retry + reassignment logic
🚚 Delivery System
Live tracking (WebSocket / Firebase)
Assignment engine (auto + manual)
Delivery proof upload (image + timestamp)
💳 Payment System
Razorpay integration
Webhook-based confirmation (never trust frontend)
Refund automation
🎯 Subscription System
State machine (ACTIVE, PAUSED, FAILED…)
Auto-renewal + grace period
Benefit engine (free delivery, discount)
🎁 Loyalty + Referral
Points after DELIVERED only
Referral tracking system
Level-based rewards
⚙️ Feature Flag System
Dynamic feature control (features_master)
Enable/disable without deploy
📊 Analytics
Orders, revenue, performance
Shop dashboard metrics
Admin analytics
🔔 Notifications
Push (Firebase)
SMS (OTP)
WhatsApp (optional)
📦 2. BEST PACKAGES (BACKEND)
🔧 Core
express
sequelize
mysql2
🔐 Auth & Security
jsonwebtoken
bcrypt
express-rate-limit
helmet
xss-clean
📡 API & Validation
joi or zod
cors
dotenv
⚙️ Queue & Jobs
bullmq
ioredis
💳 Payments
razorpay
🧠 Logging
winston or pino
📁 File Upload
multer
cloudinary (or S3)
🔄 Real-time
socket.io
📱 3. BEST PACKAGES (REACT NATIVE)
🔧 Core
axios
react-navigation
🧠 State Management
zustand (recommended)
OR redux toolkit
📡 API Handling
react-query (🔥 highly recommended)
📍 Maps & Location
react-native-maps
expo-location
🔔 Notifications
expo-notifications
📦 UI
react-native-paper
nativewind (Tailwind)
🧾 Forms
react-hook-form
yup
🧠 4. ADVANCED IDEAS (NEXT LEVEL)
🚀 Performance
Redis caching (hot data)
Pagination everywhere
Lazy loading
🧩 Micro-Features
Feature flags (A/B testing)
Dynamic config from DB
Dark mode support
🛡️ Security
IP blocking
Fraud detection (COD abuse)
Device fingerprinting
📊 Monitoring

Use:

Sentry
LogRocket
🔄 Automation
Cron jobs:
subscription renewal
payout processing
cleanup jobs
📦 Scalability
Separate services:
auth
orders
payments
Use queue for heavy tasks
💥 5. DB BEST PRACTICES
Use migrations only
Add composite indexes:
(user_id, created_at)
(shop_id, status)
Use soft deletes
Avoid duplicate indexes (your current issue 🔥)
⚙️ 6. API BEST PRACTICES
Standard response:
{ "status": true, "message": "", "data": {} }
Use:
pagination
filtering
sorting
📱 7. UI/UX BEST PRACTICES
Always show:
loading
error
empty state
Add:
retry button
skeleton loaders
toast messages
🔥 8. SYSTEM DESIGN IDEAS
Event-driven system (queue + webhook)
State machines (orders, subscription)
Feature-based architecture
🧠 FINAL GOLDEN RULES
Never trust frontend
Never block API with heavy logic
Never skip states in workflow
Always log critical actions
Always design for failure

Here is your clean RAW PROMPT (no explanation, ready to use) 👇

PROMPT:

Build the system with a strict ZERO HARDCODE POLICY.
All configurations, features, workflows, UI structure, and business logic must be fully DB-driven and dynamic.

CORE RULES:
DB is the single source of truth
Backend must not contain hardcoded business logic
Frontend must not contain hardcoded UI decisions
Any change after deployment must be handled via DB only (no code changes)
