📌 **POST-AUDIT IMPLEMENTATION PROMPT (V2 UPGRADE)**

Use the **V1 Audit Report output** and upgrade the system to match:

👉 `D:\thanniGo\full_flow_algorithm_v2.md`

---

### 🎯 Objective

Transform the existing system (V1) into **fully aligned V2 architecture** by fixing all identified gaps.

---

### 🔍 Input References

- ✅ V1 Audit Report (with ✅ ❌ ⚠️ 🔧 status)
- ✅ V2 Flow Document (MD file)
- ✅ Existing Codebase (Frontend + Backend + DB)

---

### 🚀 Implementation Scope

#### 1. Missing Components Implementation

- Build all ❌ Missing:
  - Screens
  - Submenus
  - Routes
  - APIs
  - Database tables

---

#### 2. Partial Features Completion

- Fix all ⚠️ Partial:
  - Complete UI logic
  - Connect APIs properly
  - Fix data flow issues
  - Ensure end-to-end functionality

---

#### 3. Broken Integration Fixes

- Resolve:
  - Frontend ↔ Backend issues
  - API response mismatches
  - State management issues
  - Navigation flow breaks

---

#### 4. Flow Alignment (V2 Logic)

- Ensure:
  - All user journeys match MD flow
  - Correct step-by-step navigation
  - Proper validations and transitions
  - No missing steps in flow

---

#### 5. Database Alignment

- Add / Modify:
  - Tables
  - Columns
  - Relationships

- Ensure:
  - Proper foreign keys
  - Data consistency with APIs
  - Support for all V2 features

---

### ⚙️ Implementation Rules

- ♻️ Reuse existing code wherever possible
- ➕ Add only required new components
- ✏️ Modify only where needed (no full rewrites)
- 🔒 Do NOT break existing working features
- 📦 Follow existing project structure

---

### 🔧 Fix Format

Provide fixes in this format:

**Module → Item → Issue → Fix**

Example:

- Order → Create API → Missing validation → 🔧 Add request validation middleware

---

### 📊 Final Output

Return a **complete upgrade report**:

#### ✅ Completed

- Items fixed and aligned with V2

#### 🔧 Fixed

- Issues resolved with code references

#### ❌ Still Missing (if any)

- Clearly mention pending items

---

### 📌 Final Expectation

Ensure the system is:

- 100% aligned with V2 flow
- Fully functional end-to-end
- All screens, APIs, routes, and DB connected properly

---

### 🚨 Important

Do NOT:

- Skip any module from audit
- Leave partial integrations
- Ignore flow mismatches

Ensure **full V2 compliance**
