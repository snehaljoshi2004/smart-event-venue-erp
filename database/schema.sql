USE event_erp;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role
        CHECK (role IN ('admin', 'staff'))
);


-- =========================================
-- CUSTOMERS
-- =========================================

CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190),
    phone VARCHAR(40),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_customers_name (name),
    INDEX idx_customers_email (email),
    INDEX idx_customers_phone (phone)
);


-- =========================================
-- VENUES
-- =========================================

CREATE TABLE venues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_venues_name (name),
    INDEX idx_venues_active (is_active)
);


-- =========================================
-- HALLS
-- =========================================

CREATE TABLE halls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venue_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    capacity INT UNSIGNED NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_halls_venue
        FOREIGN KEY (venue_id)
        REFERENCES venues(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_halls_venue_name
        UNIQUE (venue_id, name),

    CONSTRAINT chk_halls_capacity
        CHECK (capacity > 0),

    INDEX idx_halls_venue_active (venue_id, is_active)
);


-- =========================================
-- EVENTS
-- =========================================

CREATE TABLE events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    hall_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(160) NOT NULL,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    guest_count INT UNSIGNED NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',

    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_events_hall
        FOREIGN KEY (hall_id)
        REFERENCES halls(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_events_dates
        CHECK (end_at > start_at),

    CONSTRAINT chk_events_guest_count
        CHECK (guest_count > 0),

    CONSTRAINT chk_events_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_events_status
        CHECK (
            status IN (
                'PLANNED',
                'CONFIRMED',
                'IN PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    INDEX idx_events_hall_status_time
        (hall_id, status, start_at, end_at),

    INDEX idx_events_status_start
        (status, start_at),

    INDEX idx_events_customer_start
        (customer_id, start_at)
);


-- =========================================
-- STAFF
-- =========================================

CREATE TABLE staff (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(190),
    phone VARCHAR(40),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_staff_user
        UNIQUE (user_id),

    INDEX idx_staff_active (is_active),
    INDEX idx_staff_name (name)
);


-- =========================================
-- EVENT STAFF
-- =========================================

CREATE TABLE event_staff (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_staff_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_staff_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_event_staff
        UNIQUE (event_id, staff_id),

    INDEX idx_event_staff_staff_event
        (staff_id, event_id)
);


-- =========================================
-- EQUIPMENT
-- =========================================

CREATE TABLE equipment (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    total_quantity INT UNSIGNED NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_equipment_quantity
        CHECK (total_quantity >= 0),

    INDEX idx_equipment_name (name),
    INDEX idx_equipment_active (is_active)
);


-- =========================================
-- EVENT EQUIPMENT
-- =========================================

CREATE TABLE event_equipment (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_id BIGINT UNSIGNED NOT NULL,
    equipment_id BIGINT UNSIGNED NOT NULL,

    quantity INT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_equipment_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_equipment_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_event_equipment
        UNIQUE (event_id, equipment_id),

    CONSTRAINT chk_event_equipment_quantity
        CHECK (quantity > 0),

    INDEX idx_event_equipment_equipment_event
        (equipment_id, event_id)
);


-- =========================================
-- SERVICES
-- =========================================

CREATE TABLE services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_services_price
        CHECK (unit_price >= 0),

    INDEX idx_services_active (is_active)
);


-- =========================================
-- EVENT SERVICES
-- =========================================

CREATE TABLE event_services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,

    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_services_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_services_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_event_services
        UNIQUE (event_id, service_id),

    CONSTRAINT chk_event_services_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_event_services_price
        CHECK (unit_price >= 0),

    INDEX idx_event_services_service_event
        (service_id, event_id)
);


-- =========================================
-- VENDORS
-- =========================================

CREATE TABLE vendors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(190),
    phone VARCHAR(40),
    service_type VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vendors_name (name),
    INDEX idx_vendors_active (is_active)
);


-- =========================================
-- EVENT VENDORS
-- =========================================

CREATE TABLE event_vendors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_id BIGINT UNSIGNED NOT NULL,
    vendor_id BIGINT UNSIGNED NOT NULL,

    agreed_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_vendors_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_vendors_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_event_vendors
        UNIQUE (event_id, vendor_id),

    CONSTRAINT chk_event_vendors_amount
        CHECK (agreed_amount >= 0),

    INDEX idx_event_vendors_vendor_event
        (vendor_id, event_id)
);


-- =========================================
-- PAYMENTS
-- =========================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    method VARCHAR(30) NOT NULL,

    reference VARCHAR(120),

    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_payments_amount
        CHECK (amount > 0),

    INDEX idx_payments_event_date
        (event_id, paid_at)
);


-- =========================================
-- AUDIT LOGS
-- =========================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,
    event_id BIGINT UNSIGNED NULL,

    action VARCHAR(60) NOT NULL,

    details TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE SET NULL,

    INDEX idx_audit_event_date
        (event_id, created_at),

    INDEX idx_audit_user_date
        (user_id, created_at)
);