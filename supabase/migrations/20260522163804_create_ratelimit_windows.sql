CREATE TABLE IF NOT EXISTS ratelimit_windows (
    identifier TEXT PRIMARY KEY,
    timestamps BIGINT[] NOT NULL DEFAULT '{}'
);
