-- Trilane Tech schema, version 1.
-- Every table has id, created_at and updated_at.

CREATE TABLE users (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name             VARCHAR(120) NOT NULL,
    email                 VARCHAR(254) NOT NULL,
    password_hash         VARCHAR(100),
    role                  VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    active                BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER      NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_users_email ON users (lower(email));

CREATE TABLE password_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    purpose     VARCHAR(10) NOT NULL CHECK (purpose IN ('INVITE', 'RESET')),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_password_tokens_hash ON password_tokens (token_hash);
CREATE INDEX ix_password_tokens_user ON password_tokens (user_id);

CREATE TABLE refresh_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE services (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug           VARCHAR(80)   NOT NULL,
    name           VARCHAR(120)  NOT NULL,
    category       VARCHAR(20)   NOT NULL CHECK (category IN ('ONE_TIME', 'RETAINER', 'BUNDLE')),
    price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    billing_period VARCHAR(10)   NOT NULL CHECK (billing_period IN ('ONCE', 'MONTHLY')),
    regular_price  NUMERIC(10,2) CHECK (regular_price >= 0),
    timeline       VARCHAR(80),
    hours          INTEGER CHECK (hours > 0),
    summary        TEXT,
    ideal_for      VARCHAR(255),
    display_order  INTEGER       NOT NULL DEFAULT 0,
    published      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_services_slug ON services (slug);

CREATE TABLE service_items (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_id    BIGINT       NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    kind          VARCHAR(15)  NOT NULL CHECK (kind IN ('INCLUDED', 'NOT_INCLUDED')),
    text          VARCHAR(300) NOT NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_service_items_service ON service_items (service_id);

CREATE TABLE stored_files (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    storage_key   VARCHAR(100) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(50)  NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    uploaded_by   BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_stored_files_key ON stored_files (storage_key);

CREATE TABLE team_members (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    position      VARCHAR(120),
    bio           TEXT,
    photo_file_id BIGINT REFERENCES stored_files (id) ON DELETE SET NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    published     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE portfolio_projects (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug          VARCHAR(80)  NOT NULL,
    title         VARCHAR(160) NOT NULL,
    client_name   VARCHAR(160),
    summary       VARCHAR(500),
    description   TEXT,
    service_id    BIGINT REFERENCES services (id) ON DELETE SET NULL,
    project_url   VARCHAR(500),
    cover_file_id BIGINT REFERENCES stored_files (id) ON DELETE SET NULL,
    completed_on  DATE,
    display_order INTEGER      NOT NULL DEFAULT 0,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_portfolio_projects_slug ON portfolio_projects (slug);

CREATE TABLE portfolio_images (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id    BIGINT       NOT NULL REFERENCES portfolio_projects (id) ON DELETE CASCADE,
    file_id       BIGINT       NOT NULL REFERENCES stored_files (id) ON DELETE CASCADE,
    alt_text      VARCHAR(255),
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_portfolio_images_project ON portfolio_images (project_id);

CREATE TABLE faqs (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question      VARCHAR(300) NOT NULL,
    answer        TEXT         NOT NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    published     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE site_settings (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key        VARCHAR(100)  NOT NULL,
    value      VARCHAR(1000) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_site_settings_key ON site_settings (key);

CREATE TABLE leads (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name    VARCHAR(120) NOT NULL,
    email        VARCHAR(254) NOT NULL,
    phone        VARCHAR(40),
    company      VARCHAR(160),
    website_url  VARCHAR(255),
    service_id   BIGINT REFERENCES services (id) ON DELETE SET NULL,
    message      TEXT         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                 CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST')),
    source_page  VARCHAR(255),
    source_cta   VARCHAR(120),
    referrer     VARCHAR(500),
    utm_source   VARCHAR(120),
    utm_medium   VARCHAR(120),
    utm_campaign VARCHAR(120),
    assigned_to  BIGINT REFERENCES users (id) ON DELETE SET NULL,
    follow_up_on DATE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_leads_status ON leads (status);
CREATE INDEX ix_leads_created_at ON leads (created_at);
CREATE INDEX ix_leads_follow_up_on ON leads (follow_up_on);
CREATE INDEX ix_leads_assigned_to ON leads (assigned_to);

CREATE TABLE lead_notes (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lead_id    BIGINT      NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
    author_id  BIGINT REFERENCES users (id) ON DELETE SET NULL,
    body       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_lead_notes_lead ON lead_notes (lead_id);
