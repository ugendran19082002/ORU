-- =============================================================================
-- THANNIGO WATER DELIVERY APP
-- COMPLETE DATABASE SCHEMA — ALL TABLES, COLUMNS & CREATE QUERIES
-- Database: PostgreSQL 15+
-- Total Tables: 42
-- Roles Covered: Customer / Shop Owner / Shop Staff / Delivery Person / Admin
-- =============================================================================
-- TABLE INDEX
-- ─────────────────────────────────────────────────────────────
--  SECTION 1 — USERS & AUTH (5 tables)
--    01. users
--    02. otp_logs
--    03. user_sessions
--    04. biometric_tokens
--    05. user_devices
--
--  SECTION 2 — SHOPS (5 tables)
--    06. shops
--    07. shop_working_hours
--    08. shop_products
--    09. shop_photos
--    10. shop_certificates
--
--  SECTION 3 — CUSTOMERS (4 tables)
--    11. customer_addresses
--    12. customer_saved_upis
--    13. customer_family_accounts
--    14. customer_favorites
--
--  SECTION 4 — ORDERS (5 tables)
--    15. orders
--    16. order_items
--    17. order_status_timeline
--    18. order_cancel_log
--    19. order_delivery_proof
--
--  SECTION 5 — PAYMENTS (5 tables)
--    20. payments
--    21. wallet_accounts
--    22. wallet_transactions
--    23. can_deposits
--    24. invoices
--
--  SECTION 6 — DELIVERY (4 tables)
--    25. delivery_persons
--    26. delivery_assignments
--    27. delivery_failed_log
--    28. delivery_slots
--
--  SECTION 7 — INVENTORY (4 tables)
--    29. inventory
--    30. inventory_transactions
--    31. suppliers
--    32. supplier_orders
--
--  SECTION 8 — NOTIFICATIONS (2 tables)
--    33. notifications
--    34. notification_preferences
--
--  SECTION 9 — REVIEWS & COMPLAINTS (3 tables)
--    35. reviews
--    36. complaints
--    37. complaint_resolutions
--
--  SECTION 10 — PROMOTIONS & LOYALTY (4 tables)
--    38. coupons
--    39. coupon_usages
--    40. loyalty_points
--    41. referrals
--
--  SECTION 11 — ANALYTICS & SYSTEM (1 table)
--    42. daily_shop_summaries
-- =============================================================================

-- Enable UUID and pg_trgm for search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- SECTION 1 — USERS & AUTH
-- =============================================================================

-- 01. USERS
-- Master user table for all roles
CREATE TABLE users (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone               VARCHAR(15)   NOT NULL UNIQUE,           -- +91XXXXXXXXXX
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  UNIQUE,
    photo_url           TEXT,
    role                VARCHAR(20)   NOT NULL                   -- customer | shop_owner | shop_staff | delivery | admin
                            CHECK (role IN ('customer','shop_owner','shop_staff','delivery','admin')),
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN       NOT NULL DEFAULT FALSE,    -- phone OTP verified
    language_pref       VARCHAR(5)    NOT NULL DEFAULT 'en'      -- en | ta
                            CHECK (language_pref IN ('en','ta')),
    dark_mode           BOOLEAN       NOT NULL DEFAULT FALSE,
    onboarding_done     BOOLEAN       NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ                              -- soft delete
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role  ON users(role);


-- 02. OTP_LOGS
-- Track all OTP sends and verifications
CREATE TABLE otp_logs (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15)  NOT NULL,
    otp_hash        VARCHAR(64)  NOT NULL,                       -- bcrypt hash, never store plain OTP
    purpose         VARCHAR(30)  NOT NULL DEFAULT 'login'        -- login | register | delete_account
                        CHECK (purpose IN ('login','register','delete_account')),
    is_used         BOOLEAN      NOT NULL DEFAULT FALSE,
    attempts        SMALLINT     NOT NULL DEFAULT 0,             -- wrong attempt count
    expires_at      TIMESTAMPTZ  NOT NULL,                       -- NOW() + 5 minutes
    verified_at     TIMESTAMPTZ,
    ip_address      INET,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone    ON otp_logs(phone);
CREATE INDEX idx_otp_expires  ON otp_logs(expires_at);


-- 03. USER_SESSIONS
-- JWT / session tracking per device
CREATE TABLE user_sessions (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    device_id       VARCHAR(100),                                -- from user_devices
    device_type     VARCHAR(20)                                  -- android | ios | web
                        CHECK (device_type IN ('android','ios','web')),
    ip_address      INET,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ  NOT NULL,                       -- 30 days
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);


-- 04. BIOMETRIC_TOKENS
-- Store biometric auth tokens per device
CREATE TABLE biometric_tokens (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(100) NOT NULL,
    token_hash      VARCHAR(256) NOT NULL,
    biometric_type  VARCHAR(20)                                  -- fingerprint | face | iris
                        CHECK (biometric_type IN ('fingerprint','face','iris')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);


-- 05. USER_DEVICES
-- Push notification tokens per device
CREATE TABLE user_devices (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(100) NOT NULL,
    platform        VARCHAR(10)  NOT NULL CHECK (platform IN ('android','ios')),
    push_token      TEXT         NOT NULL,                       -- Expo push token
    app_version     VARCHAR(20),
    os_version      VARCHAR(20),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_active_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);

CREATE INDEX idx_devices_user ON user_devices(user_id);


-- =============================================================================
-- SECTION 2 — SHOPS
-- =============================================================================

-- 06. SHOPS
CREATE TABLE shops (
    id                      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id                UUID           NOT NULL REFERENCES users(id),
    name                    VARCHAR(150)   NOT NULL,
    slug                    VARCHAR(150)   UNIQUE,               -- url-friendly name
    description             TEXT,
    photo_url               TEXT,
    address_line1           VARCHAR(255)   NOT NULL,
    address_line2           VARCHAR(255),
    city                    VARCHAR(100)   NOT NULL,
    pincode                 VARCHAR(10)    NOT NULL,
    lat                     DECIMAL(10,7)  NOT NULL,
    lng                     DECIMAL(10,7)  NOT NULL,
    phone                   VARCHAR(15)    NOT NULL,
    whatsapp_number         VARCHAR(15),
    is_open                 BOOLEAN        NOT NULL DEFAULT FALSE,  -- real-time open/close
    is_active               BOOLEAN        NOT NULL DEFAULT TRUE,
    is_verified             BOOLEAN        NOT NULL DEFAULT FALSE,
    is_accepting_orders     BOOLEAN        NOT NULL DEFAULT FALSE,  -- manual on/off toggle
    is_busy_mode            BOOLEAN        NOT NULL DEFAULT FALSE,  -- auto-reject when busy
    delivery_radius_km      DECIMAL(4,1)   NOT NULL DEFAULT 3.0,
    min_order_value         DECIMAL(8,2)   NOT NULL DEFAULT 0,
    max_orders_per_day      SMALLINT       NOT NULL DEFAULT 50,
    max_orders_per_hour     SMALLINT       NOT NULL DEFAULT 10,
    avg_delivery_minutes    SMALLINT       NOT NULL DEFAULT 30,
    rating                  DECIMAL(3,2)   NOT NULL DEFAULT 0.00,  -- 0.00-5.00
    review_count            INTEGER        NOT NULL DEFAULT 0,
    total_orders            INTEGER        NOT NULL DEFAULT 0,
    gst_number              VARCHAR(20),
    bank_account_number     VARCHAR(30),                            -- encrypted
    bank_ifsc               VARCHAR(15),
    bank_account_name       VARCHAR(100),
    tags                    TEXT[]         NOT NULL DEFAULT '{}',   -- ['RO+UV','ALKALINE']
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shops_owner    ON shops(owner_id);
CREATE INDEX idx_shops_location ON shops USING GIST (point(lng, lat) gist_geometry_ops_simple);
CREATE INDEX idx_shops_open     ON shops(is_open, is_accepting_orders);


-- 07. SHOP_WORKING_HOURS
CREATE TABLE shop_working_hours (
    id          UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID       NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    day_of_week SMALLINT   NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 1=Mon...
    is_open     BOOLEAN    NOT NULL DEFAULT TRUE,
    open_at     TIME       NOT NULL DEFAULT '07:00',
    close_at    TIME       NOT NULL DEFAULT '21:00',
    UNIQUE (shop_id, day_of_week)
);

CREATE INDEX idx_working_hours_shop ON shop_working_hours(shop_id);


-- 08. SHOP_PRODUCTS
CREATE TABLE shop_products (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name            VARCHAR(150)   NOT NULL,
    description     TEXT,
    variant         VARCHAR(10)    NOT NULL CHECK (variant IN ('20L','10L','5L','other')),
    price           DECIMAL(8,2)   NOT NULL,
    image_url       TEXT,
    stock_count     INTEGER        NOT NULL DEFAULT 0,
    min_stock_level INTEGER        NOT NULL DEFAULT 10,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_shop ON shop_products(shop_id);


-- 09. SHOP_PHOTOS
CREATE TABLE shop_photos (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    photo_url   TEXT        NOT NULL,
    caption     VARCHAR(200),
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 10. SHOP_CERTIFICATES
-- Water quality certificates, BIS certifications etc.
CREATE TABLE shop_certificates (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    cert_type       VARCHAR(50) NOT NULL,                -- 'BIS' | 'FSSAI' | 'water_quality' | 'other'
    cert_number     VARCHAR(100),
    file_url        TEXT        NOT NULL,
    issued_by       VARCHAR(150),
    issued_date     DATE,
    expiry_date     DATE,
    is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
    verified_by     UUID        REFERENCES users(id),   -- admin who verified
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 3 — CUSTOMERS
-- =============================================================================

-- 11. CUSTOMER_ADDRESSES
CREATE TABLE customer_addresses (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(20)  NOT NULL DEFAULT 'home'
                        CHECK (label IN ('home','office','other')),
    label_custom    VARCHAR(50),                                 -- if 'other', custom label
    line1           VARCHAR(255) NOT NULL,
    line2           VARCHAR(255),
    landmark        VARCHAR(200),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    pincode         VARCHAR(10)  NOT NULL,
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    delivery_instructions TEXT,                                  -- gate code, floor, etc.
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);


-- 12. CUSTOMER_SAVED_UPIS
CREATE TABLE customer_saved_upis (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upi_id      VARCHAR(100) NOT NULL,                          -- e.g. user@okaxis
    app_name    VARCHAR(50),                                    -- GPay | PhonePe | Paytm | BHIM
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, upi_id)
);


-- 13. CUSTOMER_FAMILY_ACCOUNTS
-- Link family members to same billing account
CREATE TABLE customer_family_accounts (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_id      UUID        NOT NULL REFERENCES users(id),
    member_id       UUID        NOT NULL REFERENCES users(id),
    relationship    VARCHAR(30),                                -- spouse | parent | child | other
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (primary_id, member_id)
);


-- 14. CUSTOMER_FAVORITES
-- Favorite shops saved by customer
CREATE TABLE customer_favorites (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_id     UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, shop_id)
);


-- =============================================================================
-- SECTION 4 — ORDERS
-- =============================================================================

-- 15. ORDERS
CREATE TABLE orders (
    id                      VARCHAR(30)    PRIMARY KEY,          -- TNG-YYYYMMDD-XXXXX
    customer_id             UUID           NOT NULL REFERENCES users(id),
    shop_id                 UUID           NOT NULL REFERENCES shops(id),
    delivery_person_id      UUID           REFERENCES users(id),
    delivery_address_id     UUID           NOT NULL REFERENCES customer_addresses(id),

    -- Snapshot of address at time of order (in case address changes later)
    delivery_address_line1  VARCHAR(255)   NOT NULL,
    delivery_address_line2  VARCHAR(255),
    delivery_city           VARCHAR(100)   NOT NULL,
    delivery_lat            DECIMAL(10,7),
    delivery_lng            DECIMAL(10,7),
    delivery_instructions   TEXT,

    -- Status
    status                  VARCHAR(25)    NOT NULL DEFAULT 'placed'
                                CHECK (status IN (
                                    'placed','accepted','preparing',
                                    'out_for_delivery','delivered',
                                    'cancelled','failed'
                                )),

    -- Delivery type
    delivery_type           VARCHAR(15)    NOT NULL DEFAULT 'instant'
                                CHECK (delivery_type IN ('instant','scheduled')),
    scheduled_at            TIMESTAMPTZ,                          -- if delivery_type = scheduled

    -- Payment
    payment_method          VARCHAR(10)    NOT NULL
                                CHECK (payment_method IN ('cod','upi','wallet','split')),
    payment_status          VARCHAR(15)    NOT NULL DEFAULT 'pending'
                                CHECK (payment_status IN ('pending','paid','failed','refunded','partial')),
    upi_transaction_id      VARCHAR(100),

    -- Pricing
    subtotal                DECIMAL(10,2)  NOT NULL,
    delivery_fee            DECIMAL(8,2)   NOT NULL DEFAULT 10.00,
    gst_amount              DECIMAL(8,2)   NOT NULL DEFAULT 0,
    discount_amount         DECIMAL(8,2)   NOT NULL DEFAULT 0,
    coupon_id               UUID           REFERENCES coupons(id),
    total_amount            DECIMAL(10,2)  NOT NULL,

    -- OTP (hashed)
    delivery_otp_hash       VARCHAR(64)    NOT NULL,             -- bcrypt hash of 4-digit OTP
    otp_verified            BOOLEAN        NOT NULL DEFAULT FALSE,

    -- ETA
    estimated_minutes       SMALLINT       NOT NULL DEFAULT 30,
    actual_minutes          SMALLINT,                            -- set on delivery

    -- Metadata
    customer_notes          TEXT,
    is_reorder              BOOLEAN        NOT NULL DEFAULT FALSE,
    parent_order_id         VARCHAR(30)    REFERENCES orders(id), -- for reorders

    -- Timestamps
    placed_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    accepted_at             TIMESTAMPTZ,
    preparing_at            TIMESTAMPTZ,
    dispatched_at           TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    failed_at               TIMESTAMPTZ,

    -- Cancel/fail
    cancel_reason           TEXT,
    cancel_by               VARCHAR(15)    CHECK (cancel_by IN ('customer','shop','system')),
    fail_reason             TEXT,

    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_orders_shop        ON orders(shop_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_placed_at   ON orders(placed_at DESC);
CREATE INDEX idx_orders_delivery_id ON orders(delivery_person_id);


-- 16. ORDER_ITEMS
CREATE TABLE order_items (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30)    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID           NOT NULL REFERENCES shop_products(id),
    product_name    VARCHAR(150)   NOT NULL,                     -- snapshot at time of order
    variant         VARCHAR(10)    NOT NULL,
    qty             SMALLINT       NOT NULL CHECK (qty > 0),
    unit_price      DECIMAL(8,2)   NOT NULL,
    subtotal        DECIMAL(10,2)  NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);


-- 17. ORDER_STATUS_TIMELINE
-- Detailed log of every status change with timestamp
CREATE TABLE order_status_timeline (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          VARCHAR(25) NOT NULL,
    changed_by      UUID        REFERENCES users(id),
    changed_by_role VARCHAR(20),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_order ON order_status_timeline(order_id);


-- 18. ORDER_CANCEL_LOG
-- Detailed cancel reason tracking for abuse prevention
CREATE TABLE order_cancel_log (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id),
    cancelled_by    UUID        NOT NULL REFERENCES users(id),
    cancelled_role  VARCHAR(15) NOT NULL CHECK (cancelled_role IN ('customer','shop','system')),
    reason_category VARCHAR(50) NOT NULL,                        -- 'changed_mind' | 'wrong_order' | etc.
    reason_text     TEXT,
    refund_eligible BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 19. ORDER_DELIVERY_PROOF
-- Photos captured at delivery (mandatory for COD > ₹500)
CREATE TABLE order_delivery_proof (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    photo_url       TEXT        NOT NULL,
    captured_by     UUID        NOT NULL REFERENCES users(id),  -- delivery person
    empty_cans_collected SMALLINT NOT NULL DEFAULT 0,
    cash_collected  BOOLEAN     NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 5 — PAYMENTS
-- =============================================================================

-- 20. PAYMENTS
-- Every payment transaction
CREATE TABLE payments (
    id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            VARCHAR(30)    REFERENCES orders(id),
    customer_id         UUID           NOT NULL REFERENCES users(id),
    shop_id             UUID           NOT NULL REFERENCES shops(id),
    payment_type        VARCHAR(15)    NOT NULL CHECK (payment_type IN ('cod','upi','wallet','refund','adjustment')),
    amount              DECIMAL(10,2)  NOT NULL,
    currency            VARCHAR(5)     NOT NULL DEFAULT 'INR',
    status              VARCHAR(15)    NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','failed','reversed')),
    upi_transaction_id  VARCHAR(100),
    upi_id              VARCHAR(100),
    gateway_response    JSONB,
    collected_by        UUID           REFERENCES users(id),    -- delivery person if COD
    collected_at        TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order    ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_shop     ON payments(shop_id);
CREATE INDEX idx_payments_status   ON payments(status);


-- 21. WALLET_ACCOUNTS
-- One wallet per customer
CREATE TABLE wallet_accounts (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID           NOT NULL UNIQUE REFERENCES users(id),
    balance         DECIMAL(10,2)  NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    total_credited  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    total_debited   DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- 22. WALLET_TRANSACTIONS
CREATE TABLE wallet_transactions (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id       UUID           NOT NULL REFERENCES wallet_accounts(id),
    customer_id     UUID           NOT NULL REFERENCES users(id),
    type            VARCHAR(15)    NOT NULL CHECK (type IN ('credit','debit')),
    amount          DECIMAL(10,2)  NOT NULL CHECK (amount > 0),
    balance_after   DECIMAL(10,2)  NOT NULL,
    description     VARCHAR(200)   NOT NULL,
    source          VARCHAR(30)    NOT NULL,                     -- 'order_payment' | 'recharge' | 'refund' | 'referral_bonus'
    reference_id    VARCHAR(50),                                 -- order_id or payment_id
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_txn_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_txn_date   ON wallet_transactions(created_at DESC);


-- 23. CAN_DEPOSITS
-- Track can deposit per customer per shop (refundable when they leave)
CREATE TABLE can_deposits (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID           NOT NULL REFERENCES users(id),
    shop_id         UUID           NOT NULL REFERENCES shops(id),
    cans_with_customer  SMALLINT   NOT NULL DEFAULT 0,
    deposit_per_can DECIMAL(6,2)   NOT NULL DEFAULT 50.00,
    total_deposit   DECIMAL(10,2)  GENERATED ALWAYS AS (cans_with_customer * deposit_per_can) STORED,
    last_updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    notes           TEXT,
    UNIQUE (customer_id, shop_id)
);

CREATE INDEX idx_deposits_shop ON can_deposits(shop_id);


-- 24. INVOICES
CREATE TABLE invoices (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id),
    invoice_number  VARCHAR(50) NOT NULL UNIQUE,                -- INV-2024-XXXXX
    customer_id     UUID        NOT NULL REFERENCES users(id),
    shop_id         UUID        NOT NULL REFERENCES shops(id),
    subtotal        DECIMAL(10,2) NOT NULL,
    gst_amount      DECIMAL(8,2)  NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    pdf_url         TEXT,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 6 — DELIVERY
-- =============================================================================

-- 25. DELIVERY_PERSONS
-- Delivery staff profile (users table has their user record)
CREATE TABLE delivery_persons (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES users(id),
    shop_id         UUID        NOT NULL REFERENCES shops(id),
    vehicle_type    VARCHAR(50),                                -- TVS Apache | Honda Activa | Bicycle
    vehicle_number  VARCHAR(20),
    license_number  VARCHAR(30),
    is_online       BOOLEAN     NOT NULL DEFAULT FALSE,
    current_lat     DECIMAL(10,7),
    current_lng     DECIMAL(10,7),
    last_location_at TIMESTAMPTZ,
    total_deliveries INTEGER    NOT NULL DEFAULT 0,
    rating          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_shop ON delivery_persons(shop_id);


-- 26. DELIVERY_ASSIGNMENTS
-- Links orders to delivery persons
CREATE TABLE delivery_assignments (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            VARCHAR(30) NOT NULL REFERENCES orders(id),
    delivery_person_id  UUID        NOT NULL REFERENCES delivery_persons(id),
    assigned_by         UUID        REFERENCES users(id),
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at         TIMESTAMPTZ,
    picked_up_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    status              VARCHAR(15) NOT NULL DEFAULT 'assigned'
                            CHECK (status IN ('assigned','accepted','picked_up','delivered','failed'))
);

CREATE INDEX idx_assignment_order    ON delivery_assignments(order_id);
CREATE INDEX idx_assignment_delivery ON delivery_assignments(delivery_person_id);


-- 27. DELIVERY_FAILED_LOG
-- Log every failed delivery attempt with mandatory reason
CREATE TABLE delivery_failed_log (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            VARCHAR(30) NOT NULL REFERENCES orders(id),
    delivery_person_id  UUID        REFERENCES delivery_persons(id),
    reason_category     VARCHAR(50) NOT NULL,                   -- MANDATORY
    reason_text         TEXT,
    attempted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rescheduled_for     TIMESTAMPTZ,
    reschedule_notes    TEXT
);

CREATE INDEX idx_failed_order ON delivery_failed_log(order_id);


-- 28. DELIVERY_SLOTS
-- Time slots per shop (can be blocked when busy)
CREATE TABLE delivery_slots (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    slot_date       DATE        NOT NULL,
    slot_start      TIME        NOT NULL,                       -- 07:00
    slot_end        TIME        NOT NULL,                       -- 09:00
    max_capacity    SMALLINT    NOT NULL DEFAULT 5,
    current_count   SMALLINT    NOT NULL DEFAULT 0,
    is_blocked      BOOLEAN     NOT NULL DEFAULT FALSE,
    blocked_reason  VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, slot_date, slot_start)
);

CREATE INDEX idx_slots_shop_date ON delivery_slots(shop_id, slot_date);


-- =============================================================================
-- SECTION 7 — INVENTORY
-- =============================================================================

-- 29. INVENTORY
-- Current stock snapshot per product
CREATE TABLE inventory (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id          UUID        NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    full_cans           INTEGER     NOT NULL DEFAULT 0 CHECK (full_cans >= 0),
    empty_cans          INTEGER     NOT NULL DEFAULT 0 CHECK (empty_cans >= 0),
    damaged_cans        INTEGER     NOT NULL DEFAULT 0 CHECK (damaged_cans >= 0),
    min_stock_alert     SMALLINT    NOT NULL DEFAULT 10,
    last_restocked_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, product_id)
);

CREATE INDEX idx_inventory_shop ON inventory(shop_id);


-- 30. INVENTORY_TRANSACTIONS
-- Every stock movement — add, remove, adjust, return
CREATE TABLE inventory_transactions (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id),
    product_id      UUID           NOT NULL REFERENCES shop_products(id),
    type            VARCHAR(20)    NOT NULL
                        CHECK (type IN (
                            'add',          -- supplier delivery
                            'dispatch',     -- order fulfilled
                            'return',       -- empty can returned by customer
                            'adjustment',   -- damage/theft/correction
                            'reconcile'     -- EOD reconciliation
                        )),
    quantity        INTEGER        NOT NULL,                    -- positive=in, negative=out
    balance_after   INTEGER        NOT NULL,
    order_id        VARCHAR(30)    REFERENCES orders(id),
    supplier_id     UUID           REFERENCES suppliers(id),
    reason          TEXT,
    performed_by    UUID           NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_txn_shop    ON inventory_transactions(shop_id);
CREATE INDEX idx_inv_txn_date    ON inventory_transactions(created_at DESC);


-- 31. SUPPLIERS
CREATE TABLE suppliers (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID        NOT NULL REFERENCES shops(id),
    name            VARCHAR(150) NOT NULL,
    phone           VARCHAR(15),
    email           VARCHAR(150),
    address         TEXT,
    product_types   TEXT[],                                     -- ['20L','10L']
    price_per_unit  DECIMAL(8,2),
    notes           TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_shop ON suppliers(shop_id);


-- 32. SUPPLIER_ORDERS
CREATE TABLE supplier_orders (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id),
    supplier_id     UUID           NOT NULL REFERENCES suppliers(id),
    product_id      UUID           NOT NULL REFERENCES shop_products(id),
    quantity_ordered INTEGER        NOT NULL,
    quantity_received INTEGER       NOT NULL DEFAULT 0,
    unit_cost       DECIMAL(8,2),
    total_cost      DECIMAL(10,2),
    status          VARCHAR(15)    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','delivered','cancelled')),
    ordered_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    expected_at     TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    notes           TEXT
);


-- =============================================================================
-- SECTION 8 — NOTIFICATIONS
-- =============================================================================

-- 33. NOTIFICATIONS
CREATE TABLE notifications (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,                       -- order_placed | low_stock | payment_received | etc.
    title           VARCHAR(150) NOT NULL,
    body            TEXT        NOT NULL,
    data            JSONB       NOT NULL DEFAULT '{}',          -- { order_id, shop_id, etc. }
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_sent         BOOLEAN     NOT NULL DEFAULT FALSE,         -- push sent successfully
    deep_link       VARCHAR(200),                               -- thannigo://order/TNG-001
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_notif_user     ON notifications(user_id);
CREATE INDEX idx_notif_unread   ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created  ON notifications(created_at DESC);


-- 34. NOTIFICATION_PREFERENCES
CREATE TABLE notification_preferences (
    id                      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    order_updates           BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_alerts         BOOLEAN NOT NULL DEFAULT TRUE,
    low_water_reminder      BOOLEAN NOT NULL DEFAULT TRUE,
    promotional_offers      BOOLEAN NOT NULL DEFAULT FALSE,
    payment_alerts          BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_reminders  BOOLEAN NOT NULL DEFAULT TRUE,
    new_order_sound         BOOLEAN NOT NULL DEFAULT TRUE,      -- for shops: sound on new order
    new_order_vibrate       BOOLEAN NOT NULL DEFAULT TRUE,
    daily_summary           BOOLEAN NOT NULL DEFAULT TRUE,      -- for shops
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 9 — REVIEWS & COMPLAINTS
-- =============================================================================

-- 35. REVIEWS
CREATE TABLE reviews (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            VARCHAR(30) NOT NULL REFERENCES orders(id),
    customer_id         UUID        NOT NULL REFERENCES users(id),
    shop_id             UUID        NOT NULL REFERENCES shops(id),
    delivery_person_id  UUID        REFERENCES delivery_persons(id),
    shop_rating         SMALLINT    CHECK (shop_rating BETWEEN 1 AND 5),
    delivery_rating     SMALLINT    CHECK (delivery_rating BETWEEN 1 AND 5),
    quality_rating      SMALLINT    CHECK (quality_rating BETWEEN 1 AND 5),
    overall_rating      DECIMAL(3,2) GENERATED ALWAYS AS (
                            (COALESCE(shop_rating,0) + COALESCE(delivery_rating,0) + COALESCE(quality_rating,0))::DECIMAL /
                            NULLIF(
                                (CASE WHEN shop_rating IS NOT NULL THEN 1 ELSE 0 END +
                                 CASE WHEN delivery_rating IS NOT NULL THEN 1 ELSE 0 END +
                                 CASE WHEN quality_rating IS NOT NULL THEN 1 ELSE 0 END), 0
                            )
                        ) STORED,
    review_text         TEXT,
    photo_urls          TEXT[]      NOT NULL DEFAULT '{}',
    quick_tags          TEXT[]      NOT NULL DEFAULT '{}',      -- ['Fast Delivery','Good Quality']
    shop_reply          TEXT,
    shop_replied_at     TIMESTAMPTZ,
    is_verified         BOOLEAN     NOT NULL DEFAULT FALSE,     -- verified purchase
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_shop     ON reviews(shop_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_order    ON reviews(order_id);


-- 36. COMPLAINTS
CREATE TABLE complaints (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        VARCHAR(30) NOT NULL REFERENCES orders(id),
    customer_id     UUID        NOT NULL REFERENCES users(id),
    shop_id         UUID        NOT NULL REFERENCES shops(id),
    category        VARCHAR(50) NOT NULL,                       -- late_delivery | wrong_order | quality | rude | leaking | overcharged | other
    description     TEXT,
    photo_urls      TEXT[]      NOT NULL DEFAULT '{}',
    action_requested VARCHAR(20) NOT NULL DEFAULT 'none'
                        CHECK (action_requested IN ('replacement','refund','none','other')),
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','in_review','resolved','closed','rejected')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('low','normal','high','urgent')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_shop     ON complaints(shop_id);
CREATE INDEX idx_complaints_customer ON complaints(customer_id);
CREATE INDEX idx_complaints_status   ON complaints(status);


-- 37. COMPLAINT_RESOLUTIONS
CREATE TABLE complaint_resolutions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id    UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    resolved_by     UUID        NOT NULL REFERENCES users(id),
    resolution_type VARCHAR(30) NOT NULL,                       -- replacement_sent | refund_issued | apology | no_action | escalated
    resolution_notes TEXT,
    replacement_order_id VARCHAR(30) REFERENCES orders(id),
    refund_amount   DECIMAL(8,2),
    resolved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 10 — PROMOTIONS & LOYALTY
-- =============================================================================

-- 38. COUPONS
CREATE TABLE coupons (
    id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID           REFERENCES shops(id),    -- NULL = platform-wide coupon
    created_by          UUID           NOT NULL REFERENCES users(id),
    code                VARCHAR(20)    NOT NULL UNIQUE,
    description         VARCHAR(200),
    discount_type       VARCHAR(15)    NOT NULL CHECK (discount_type IN ('flat','percentage')),
    discount_value      DECIMAL(8,2)   NOT NULL,
    max_discount_cap    DECIMAL(8,2),                           -- for percentage coupons: max ₹ off
    min_order_value     DECIMAL(8,2)   NOT NULL DEFAULT 0,
    max_uses_total      INTEGER,                                -- NULL = unlimited
    max_uses_per_user   SMALLINT       NOT NULL DEFAULT 1,
    current_uses        INTEGER        NOT NULL DEFAULT 0,
    valid_from          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMPTZ,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    is_first_order_only BOOLEAN        NOT NULL DEFAULT FALSE,
    applicable_products TEXT[]         NOT NULL DEFAULT '{}',   -- empty = all products
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code  ON coupons(code);
CREATE INDEX idx_coupons_shop  ON coupons(shop_id);


-- 39. COUPON_USAGES
CREATE TABLE coupon_usages (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id   UUID        NOT NULL REFERENCES coupons(id),
    order_id    VARCHAR(30) NOT NULL REFERENCES orders(id),
    customer_id UUID        NOT NULL REFERENCES users(id),
    discount_applied DECIMAL(8,2) NOT NULL,
    used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coupon_id, order_id)
);

CREATE INDEX idx_coupon_usage_customer ON coupon_usages(customer_id);
CREATE INDEX idx_coupon_usage_coupon   ON coupon_usages(coupon_id);


-- 40. LOYALTY_POINTS
-- Tracks loyalty points balance per customer per shop (or platform)
CREATE TABLE loyalty_points (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID        NOT NULL REFERENCES users(id),
    shop_id             UUID        REFERENCES shops(id),       -- NULL = platform points
    points_balance      INTEGER     NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    total_earned        INTEGER     NOT NULL DEFAULT 0,
    total_redeemed      INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, shop_id)
);

-- Loyalty point transactions
CREATE TABLE loyalty_point_transactions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID        NOT NULL REFERENCES users(id),
    shop_id         UUID        REFERENCES shops(id),
    type            VARCHAR(10) NOT NULL CHECK (type IN ('earn','redeem','expire','bonus')),
    points          INTEGER     NOT NULL,
    balance_after   INTEGER     NOT NULL,
    description     VARCHAR(150),
    order_id        VARCHAR(30) REFERENCES orders(id),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loyalty_customer ON loyalty_points(customer_id);


-- 41. REFERRALS
CREATE TABLE referrals (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id         UUID        NOT NULL REFERENCES users(id),
    referee_id          UUID        NOT NULL UNIQUE REFERENCES users(id),
    referral_code       VARCHAR(20) NOT NULL,
    status              VARCHAR(15) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','expired','rewarded')),
    referrer_bonus      DECIMAL(6,2) NOT NULL DEFAULT 30.00,    -- ₹30 credit
    referee_discount    DECIMAL(6,2) NOT NULL DEFAULT 10.00,    -- ₹10 off first order
    referrer_credited   BOOLEAN     NOT NULL DEFAULT FALSE,
    referee_credited    BOOLEAN     NOT NULL DEFAULT FALSE,
    trigger_order_id    VARCHAR(30) REFERENCES orders(id),      -- order that completed the referral
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code     ON referrals(referral_code);


-- =============================================================================
-- SECTION 11 — ANALYTICS
-- =============================================================================

-- 42. DAILY_SHOP_SUMMARIES
-- Pre-aggregated daily stats per shop for fast analytics queries
CREATE TABLE daily_shop_summaries (
    id                      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id                 UUID           NOT NULL REFERENCES shops(id),
    summary_date            DATE           NOT NULL,
    total_orders            INTEGER        NOT NULL DEFAULT 0,
    delivered_orders        INTEGER        NOT NULL DEFAULT 0,
    cancelled_orders        INTEGER        NOT NULL DEFAULT 0,
    failed_orders           INTEGER        NOT NULL DEFAULT 0,
    total_revenue           DECIMAL(12,2)  NOT NULL DEFAULT 0,
    cash_revenue            DECIMAL(12,2)  NOT NULL DEFAULT 0,
    upi_revenue             DECIMAL(12,2)  NOT NULL DEFAULT 0,
    wallet_revenue          DECIMAL(12,2)  NOT NULL DEFAULT 0,
    new_customers           INTEGER        NOT NULL DEFAULT 0,
    returning_customers     INTEGER        NOT NULL DEFAULT 0,
    avg_order_value         DECIMAL(8,2)   NOT NULL DEFAULT 0,
    avg_delivery_minutes    DECIMAL(5,1)   NOT NULL DEFAULT 0,
    peak_hour               SMALLINT,                           -- hour with most orders (0-23)
    cans_dispatched         INTEGER        NOT NULL DEFAULT 0,
    empty_cans_returned     INTEGER        NOT NULL DEFAULT 0,
    stock_opening           INTEGER        NOT NULL DEFAULT 0,
    stock_closing           INTEGER        NOT NULL DEFAULT 0,
    eod_reconciled          BOOLEAN        NOT NULL DEFAULT FALSE,
    eod_cash_expected       DECIMAL(10,2),
    eod_cash_counted        DECIMAL(10,2),
    eod_difference          DECIMAL(10,2),
    eod_reconciled_at       TIMESTAMPTZ,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, summary_date)
);

CREATE INDEX idx_daily_summary_shop ON daily_shop_summaries(shop_id, summary_date DESC);


-- =============================================================================
-- ADDITIONAL SHOP TABLES
-- =============================================================================

-- SHOP_HOLIDAYS — days the shop is closed
CREATE TABLE shop_holidays (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    holiday_date DATE       NOT NULL,
    reason      VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, holiday_date)
);

-- SHOP_DELIVERY_CHARGES — distance-based delivery pricing
CREATE TABLE shop_delivery_charges (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    min_distance_km DECIMAL(4,1)   NOT NULL DEFAULT 0,
    max_distance_km DECIMAL(4,1)   NOT NULL,
    charge_amount   DECIMAL(6,2)   NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, min_distance_km, max_distance_km)
);

-- BULK_DISCOUNT_RULES — shop-level bulk order discounts
CREATE TABLE bulk_discount_rules (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    min_quantity    SMALLINT       NOT NULL,                    -- e.g. 5+ cans
    discount_type   VARCHAR(15)    NOT NULL CHECK (discount_type IN ('flat','percentage')),
    discount_value  DECIMAL(6,2)   NOT NULL,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- CUSTOMER_BLOCK_LIST — shops blocking specific customers
CREATE TABLE customer_block_list (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID        NOT NULL REFERENCES shops(id),
    customer_id UUID        NOT NULL REFERENCES users(id),
    reason      TEXT,
    blocked_by  UUID        NOT NULL REFERENCES users(id),
    blocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (shop_id, customer_id)
);

-- CUSTOMER_CREDIT_LIMITS — COD credit per customer per shop
CREATE TABLE customer_credit_limits (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id         UUID           NOT NULL REFERENCES shops(id),
    customer_id     UUID           NOT NULL REFERENCES users(id),
    credit_limit    DECIMAL(8,2)   NOT NULL DEFAULT 0,
    current_due     DECIMAL(8,2)   NOT NULL DEFAULT 0,
    last_paid_at    TIMESTAMPTZ,
    set_by          UUID           NOT NULL REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, customer_id)
);

-- CUSTOMER_NOTES — shop owner notes on customers
CREATE TABLE customer_notes (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID        NOT NULL REFERENCES shops(id),
    customer_id UUID        NOT NULL REFERENCES users(id),
    note_text   TEXT        NOT NULL,
    created_by  UUID        NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID           NOT NULL REFERENCES users(id),
    shop_id             UUID           NOT NULL REFERENCES shops(id),
    product_id          UUID           NOT NULL REFERENCES shop_products(id),
    frequency           VARCHAR(15)    NOT NULL CHECK (frequency IN ('daily','alternate_days','weekly','biweekly','monthly')),
    quantity_per_delivery SMALLINT     NOT NULL DEFAULT 1,
    preferred_slot_start TIME          NOT NULL DEFAULT '08:00',
    preferred_slot_end  TIME           NOT NULL DEFAULT '10:00',
    delivery_address_id UUID           NOT NULL REFERENCES customer_addresses(id),
    payment_method      VARCHAR(10)    NOT NULL CHECK (payment_method IN ('upi','wallet')),
    upi_id              VARCHAR(100),
    status              VARCHAR(15)    NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','paused','cancelled','expired')),
    paused_until        DATE,
    pause_reason        VARCHAR(100),
    price_per_delivery  DECIMAL(8,2)   NOT NULL,
    next_delivery_date  DATE,
    last_delivery_date  DATE,
    total_deliveries    INTEGER        NOT NULL DEFAULT 0,
    start_date          DATE           NOT NULL DEFAULT CURRENT_DATE,
    end_date            DATE,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_shop     ON subscriptions(shop_id);
CREATE INDEX idx_subscriptions_next     ON subscriptions(next_delivery_date) WHERE status = 'active';


-- SUBSCRIPTION_DELIVERIES — log of each auto-generated delivery from subscription
CREATE TABLE subscription_deliveries (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID        NOT NULL REFERENCES subscriptions(id),
    order_id        VARCHAR(30) REFERENCES orders(id),
    scheduled_date  DATE        NOT NULL,
    status          VARCHAR(15) NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','placed','delivered','skipped','failed')),
    skip_reason     VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_deliveries_sub  ON subscription_deliveries(subscription_id);
CREATE INDEX idx_sub_deliveries_date ON subscription_deliveries(scheduled_date);


-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        ', tbl, tbl);
    END LOOP;
END;
$$;

-- Function to generate Thannigo order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    seq_num TEXT;
BEGIN
    seq_num := LPAD((nextval('order_seq'))::TEXT, 5, '0');
    RETURN 'TNG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- Function to check shop is open RIGHT NOW
CREATE OR REPLACE FUNCTION is_shop_open_now(shop_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    today_dow SMALLINT;
    current_time TIME;
    working_hours shop_working_hours%ROWTYPE;
    shop_accepting BOOLEAN;
    shop_busy BOOLEAN;
BEGIN
    today_dow    := EXTRACT(DOW FROM NOW())::SMALLINT;
    current_time := CURRENT_TIME;

    SELECT is_accepting_orders, is_busy_mode
    INTO shop_accepting, shop_busy
    FROM shops WHERE id = shop_uuid;

    IF NOT shop_accepting OR shop_busy THEN
        RETURN FALSE;
    END IF;

    -- Check holiday
    IF EXISTS (
        SELECT 1 FROM shop_holidays
        WHERE shop_id = shop_uuid
          AND holiday_date = CURRENT_DATE
    ) THEN
        RETURN FALSE;
    END IF;

    SELECT * INTO working_hours
    FROM shop_working_hours
    WHERE shop_id = shop_uuid AND day_of_week = today_dow;

    RETURN working_hours.is_open
       AND current_time BETWEEN working_hours.open_at AND working_hours.close_at;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- VIEWS (for common queries)
-- =============================================================================

-- V1: Active orders with full detail
CREATE OR REPLACE VIEW v_active_orders AS
SELECT
    o.id, o.status, o.total_amount, o.payment_method, o.placed_at,
    u.name AS customer_name, u.phone AS customer_phone,
    s.name AS shop_name,
    o.delivery_address_line1, o.delivery_city,
    o.delivery_otp_hash, o.estimated_minutes,
    dp.user_id AS delivery_person_id
FROM orders o
JOIN users u  ON u.id  = o.customer_id
JOIN shops s  ON s.id  = o.shop_id
LEFT JOIN delivery_persons dp ON dp.id = (
    SELECT delivery_person_id FROM delivery_assignments
    WHERE order_id = o.id
    ORDER BY assigned_at DESC LIMIT 1
)
WHERE o.status NOT IN ('delivered','cancelled','failed');


-- V2: Shop stats today
CREATE OR REPLACE VIEW v_shop_today_stats AS
SELECT
    s.id AS shop_id, s.name,
    COUNT(o.id) FILTER (WHERE o.status = 'delivered')    AS delivered_today,
    COUNT(o.id) FILTER (WHERE o.status = 'placed')       AS pending,
    COUNT(o.id) FILTER (WHERE o.status = 'cancelled')    AS cancelled_today,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS revenue_today,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered' AND o.payment_method = 'cod'), 0) AS cash_today,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered' AND o.payment_method = 'upi'), 0) AS upi_today
FROM shops s
LEFT JOIN orders o ON o.shop_id = s.id
    AND o.placed_at >= CURRENT_DATE::TIMESTAMPTZ
GROUP BY s.id, s.name;


-- V3: Customer order summary
CREATE OR REPLACE VIEW v_customer_order_summary AS
SELECT
    customer_id,
    COUNT(*)                                                 AS total_orders,
    COUNT(*) FILTER (WHERE status = 'delivered')             AS delivered_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled')             AS cancelled_orders,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS total_spent,
    MAX(placed_at)                                           AS last_order_at,
    MIN(placed_at)                                           AS first_order_at
FROM orders
GROUP BY customer_id;


-- V4: Low stock shops
CREATE OR REPLACE VIEW v_low_stock_shops AS
SELECT
    s.id AS shop_id, s.name AS shop_name,
    s.phone AS shop_phone,
    p.name AS product_name, p.variant,
    i.full_cans AS current_stock,
    i.min_stock_alert,
    (i.full_cans - i.min_stock_alert) AS stock_gap
FROM inventory i
JOIN shops s         ON s.id  = i.shop_id
JOIN shop_products p ON p.id  = i.product_id
WHERE i.full_cans <= i.min_stock_alert
ORDER BY stock_gap ASC;


-- =============================================================================
-- SEED DATA — reference values used in application
-- =============================================================================

-- Order cancel reasons (for dropdown validation reference)
CREATE TABLE cancel_reason_categories (
    id          SERIAL      PRIMARY KEY,
    role        VARCHAR(15) NOT NULL CHECK (role IN ('customer','shop','delivery')),
    category    VARCHAR(50) NOT NULL UNIQUE,
    label       VARCHAR(100) NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE
);

INSERT INTO cancel_reason_categories (role, category, label) VALUES
    ('customer', 'changed_mind',        'Changed my mind'),
    ('customer', 'wrong_order',         'Ordered by mistake'),
    ('customer', 'better_price',        'Found better price elsewhere'),
    ('customer', 'shop_too_slow',       'Shop taking too long'),
    ('customer', 'wrong_address',       'Incorrect delivery address'),
    ('customer', 'other',               'Other reason'),
    ('shop',     'out_of_stock',        'Out of stock'),
    ('shop',     'area_not_serviceable','Area not serviceable'),
    ('shop',     'too_busy',            'Too busy right now'),
    ('shop',     'customer_unreachable','Customer unreachable'),
    ('shop',     'other',               'Other reason'),
    ('delivery', 'not_home',            'Customer not home'),
    ('delivery', 'wrong_address',       'Wrong address provided'),
    ('delivery', 'cancelled_at_door',   'Customer cancelled at door'),
    ('delivery', 'access_denied',       'Gate / access denied'),
    ('delivery', 'other',               'Other reason');


-- Complaint categories
CREATE TABLE complaint_categories (
    id          SERIAL      PRIMARY KEY,
    category    VARCHAR(50) NOT NULL UNIQUE,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    color       VARCHAR(10),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE
);

INSERT INTO complaint_categories (category, label, icon, color) VALUES
    ('late_delivery',  'Late Delivery',   'schedule',   '#E67E22'),
    ('wrong_order',    'Wrong Order',     'error',      '#0077B6'),
    ('water_quality',  'Water Quality',   'water',      '#48CAE4'),
    ('rude_behavior',  'Rude Delivery',   'person-off', '#C0392B'),
    ('leaking_can',    'Leaking Can',     'water-drop', '#0096C7'),
    ('overcharged',    'Overcharged',     'payments',   '#27AE60'),
    ('missing_items',  'Missing Items',   'inventory',  '#9C27B0'),
    ('other',          'Other',           'edit',       '#74777C');


-- =============================================================================
-- END OF SCHEMA
-- Total Tables Created: 47
--   Core tables:   42
--   Extra tables:  5 (shop_holidays, delivery_charges, bulk_discount_rules,
--                     customer_block_list, customer_credit_limits)
--   Views:         4
--   Functions:     3
--   Triggers:      auto-applied to all tables with updated_at
-- =============================================================================