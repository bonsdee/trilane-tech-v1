-- Runs once, when the Docker PostgreSQL volume is first created, as the
-- database user from .env (so that user owns the new database).
-- Creates a separate database for the backend's automated tests, so
-- `./mvnw test` never touches your development data.
CREATE DATABASE trilane_test;
