# Hearth

Hearth is the system that runs a small dining room. Guests look at the menu, ask for a table, and send an order. The kitchen and floor staff move that order from received to served. Managers keep the menu, the staff list, and the day’s numbers. An admin decides who can sign in and what each person is allowed to do.

A guest does not need to know how the software is built. They see a menu, pick a table, and send a ticket. Staff see the tickets that are still open. A price written on a ticket stays on that ticket, even if the menu price changes later.

## What people can do

**Anyone visiting the site** can read the menu, the hours, and how to visit, then sign up or sign in.

**Guest.** Browse dishes, choose a table, and send an order. While the order is still waiting, they can change quantities or cancel it. They can also ask the floor to hold a table.

**Staff.** Take an order through the kitchen: confirm it, start cooking, mark it ready, mark it served, or cancel it. Mark tables available, occupied, or reserved. Serving or cancelling an order frees the table when nothing else is still open on it.

**Manager.** Everything staff can do, plus edit the menu, open or disable staff accounts, and read today’s report: how many orders came in, what they added up to, how many sit in each status, and which dishes were ordered most.

**Admin.** Everything a manager can do, plus people and roles. Turning an account off stops that person from signing in. The admin keeps control of users and of what each role is allowed to do.

## How a meal moves through the room

1. A guest signs in, adds dishes, and sends the order to a table.
2. The order starts as waiting.
3. Staff confirm it, mark it cooking, then ready, then served. They can cancel it instead.
4. The table shows as occupied while an order is open, and returns to available when the last open order on it is served or cancelled.
5. The manager can look at the same day: orders, revenue, status counts, and popular dishes.

## How it is built

Hearth is a web application with a React client and a Java API. The browser talks only to the API. The API checks who the person is, checks what their role allows, and reads and writes MySQL.

| Piece | Choice |
| --- | --- |
| Client | React 18, React Router, Vite |
| API | Java 21, Spring Boot 3.4, Spring Web, Bean Validation |
| Sign-in | Spring Security and signed JWT access tokens |
| Access | Four roles (guest, staff, manager, admin) and twelve permissions, enforced on each API route |
| Data | Spring Data JPA, MySQL 8, Flyway migrations |
| Local database | Docker Compose |
| Shape | Controllers, services, repositories, and domain types in separate layers |

The API exposes the menu, orders, tables, seat requests, users, roles, and the daily report. An order stores the price at the time it was sent, so a later menu edit does not rewrite that ticket. Schema changes live in versioned SQL files and run on startup. The first startup also loads demo categories, dishes, tables, orders, and the four accounts below.

Sign-in failures, disabled accounts, and missing permissions return clear HTTP errors (`401` or `403`) instead of a generic failure.

## Prerequisites

- Java 21
- Maven 3.8 or newer
- Node.js 20 or newer
- Docker Engine with Compose v2

## Environment

Defaults match `docker-compose.yml`. Override them only if your ports or database differ.

| Variable | Default |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/hearth?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8` |
| `DB_USER` | `hearth` |
| `DB_PASSWORD` | `hearth` |
| `SERVER_PORT` | `8080` |
| `JWT_SECRET` | `hearth-dev-secret-change-me-please-32b` (at least 32 bytes) |
| `JWT_EXPIRATION_MS` | `86400000` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |

Compose creates database `hearth`, user `hearth` / password `hearth`, root password `root`, and publishes port `3306`. These values are for local development. Change the database password and `JWT_SECRET` before any shared or public deployment.

## Start

From this directory:

```bash
docker compose up -d
```

Wait until `docker compose ps` shows MySQL as healthy. Then:

```bash
cd backend
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. The first start migrates and seeds. The log line is `Hearth seeded`. A later start says `Seed accounts already exist`.

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to the backend.

## Demo accounts

Password for each account: `Password123!`

| Username | Email | Role |
| --- | --- | --- |
| `admin` | `admin@hearth.test` | ADMIN |
| `manager` | `manager@hearth.test` | MANAGER |
| `staff` | `staff@hearth.test` | STAFF |
| `customer` | `customer@hearth.test` | CUSTOMER |

The seed includes four menu categories, twelve dishes, six tables, and two orders (one waiting on table 1, one cooking on table 3). Table 5 starts reserved.

## Layout

```
backend/     Spring Boot API, Flyway migrations, and seed data
frontend/    React client
docker-compose.yml
```
