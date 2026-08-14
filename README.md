# store-locator-api

REST API for store management and nearby store search. Users can create, list, update, and delete stores, and search for stores within a specified radius of any US ZIP code. Nearby results include distance in miles.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| MongoDB | Database |
| Mongoose | ODM and geospatial queries |
| Zod | Request validation |
| Jest | Test framework |
| Supertest | HTTP assertion library |

## Project Structure

```
src/
  config/
    db.js               # MongoDB connection
    env.js              # Environment configuration
  controllers/
    store.controller.js # Route handlers
  middleware/
    error-handler.js    # Centralized error handler
    not-found.js        # 404 catch-all
    validate.js         # Zod validation middleware
  models/
    store.model.js      # Mongoose schema with 2dsphere index
  routes/
    store.routes.js     # Express router
  services/
    zip-code.service.js # ZIP code geocoding
  utils/
    app-error.js        # Operational error class
  validators/
    store.validator.js  # Zod schemas
  app.js                # Express application
  server.js             # Server entry point
tests/
  store.api.test.js     # API test suite
```

## Installation

```bash
git clone <repository-url>
cd store-locator-api
npm install
```

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | — (required) |
| `MONGODB_TEST_URI` | Test database connection string | — (used by tests) |

> **Important:** Never commit `.env` or real credentials. The `.env` file is excluded by `.gitignore`.

## Running the Project

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

Ensure MongoDB is running before starting the application.

### Frontend UI

The repository now includes a minimal React UI (`/client`) for visually demonstrating the REST API endpoints.

To run the frontend:

```bash
cd client
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` (defaulting to `http://localhost:3000`) to connect to the backend. Ensure the backend server is running in a separate terminal.

## API Endpoints

### Health Check

```
GET /api/health
```

**Response:** `200`

```json
{
  "success": true,
  "message": "Store Locator API is running"
}
```

---

### Create a Store

```
POST /api/stores
```

**Body:**

```json
{
  "name": "Empire State Store",
  "address": {
    "street": "350 Fifth Avenue",
    "city": "New York",
    "state": "NY",
    "zipCode": "10118"
  },
  "location": {
    "type": "Point",
    "coordinates": [-73.9857, 40.7484]
  }
}
```

**Validation:**

- `name` — required, 2–100 characters
- `address.street` — required, max 200 characters
- `address.city` — required, max 100 characters
- `address.state` — required, exactly 2 letters (normalized to uppercase)
- `address.zipCode` — required, exactly 5 digits
- `location.type` — must be `"Point"` (defaults to `"Point"`)
- `location.coordinates` — `[longitude, latitude]`, longitude -180 to 180, latitude -90 to 90
- Unknown fields are rejected

**Response:** `201`

```json
{
  "success": true,
  "message": "Store created successfully",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Empire State Store",
    "address": {
      "street": "350 Fifth Avenue",
      "city": "New York",
      "state": "NY",
      "zipCode": "10118"
    },
    "location": {
      "type": "Point",
      "coordinates": [-73.9857, 40.7484]
    },
    "createdAt": "2026-08-14T10:00:00.000Z",
    "updatedAt": "2026-08-14T10:00:00.000Z"
  }
}
```

---

### List All Stores

```
GET /api/stores
```

**Response:** `200`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "name": "Empire State Store",
      "address": { "street": "350 Fifth Avenue", "city": "New York", "state": "NY", "zipCode": "10118" },
      "location": { "type": "Point", "coordinates": [-73.9857, 40.7484] },
      "createdAt": "2026-08-14T10:00:00.000Z",
      "updatedAt": "2026-08-14T10:00:00.000Z"
    }
  ]
}
```

Returns `count: 0` and an empty `data` array when no stores exist.

---

### Get Store by ID

```
GET /api/stores/:id
```

**Response:** `200`

```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Empire State Store",
    "address": { "street": "350 Fifth Avenue", "city": "New York", "state": "NY", "zipCode": "10118" },
    "location": { "type": "Point", "coordinates": [-73.9857, 40.7484] },
    "createdAt": "2026-08-14T10:00:00.000Z",
    "updatedAt": "2026-08-14T10:00:00.000Z"
  }
}
```

**Errors:**

| Status | Condition |
|---|---|
| `400` | Invalid ID format |
| `404` | Store not found |

---

### Update a Store

```
PUT /api/stores/:id
```

Requires the complete store body (same validation as creation).

**Response:** `200`

```json
{
  "success": true,
  "message": "Store updated successfully",
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Updated Store Name",
    "address": { "street": "1 Broadway", "city": "Boston", "state": "MA", "zipCode": "02108" },
    "location": { "type": "Point", "coordinates": [-71.0589, 42.3601] },
    "createdAt": "2026-08-14T10:00:00.000Z",
    "updatedAt": "2026-08-14T10:05:00.000Z"
  }
}
```

**Errors:**

| Status | Condition |
|---|---|
| `400` | Invalid ID or invalid body |
| `404` | Store not found |

---

### Delete a Store

```
DELETE /api/stores/:id
```

**Response:** `200`

```json
{
  "success": true,
  "message": "Store deleted successfully"
}
```

**Errors:**

| Status | Condition |
|---|---|
| `400` | Invalid ID format |
| `404` | Store not found |

---

### Find Nearby Stores

```
GET /api/stores/nearby?zipcode=10001&radius=10
```

**Query Parameters:**

| Parameter | Type | Rules |
|---|---|---|
| `zipcode` | string | Required, exactly 5 digits |
| `radius` | number | Required, must be greater than 0 (in miles) |

**How it works:**

1. The ZIP code is sent to the [Zippopotam.us](https://api.zippopotam.us) API to get latitude and longitude.
2. The radius is converted from miles to meters (1 mile = 1,609.344 m).
3. MongoDB `$geoNear` aggregation queries the Store collection using the `2dsphere` index.
4. Results are returned ordered by proximity (nearest first).
5. Each result includes a `distance` field in miles, rounded to 2 decimal places.

**Response:** `200`

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "name": "Midtown Store",
      "address": { "street": "1 Times Sq", "city": "New York", "state": "NY", "zipCode": "10036" },
      "location": { "type": "Point", "coordinates": [-73.9855, 40.7580] },
      "distance": 0.68,
      "createdAt": "2026-08-14T10:00:00.000Z",
      "updatedAt": "2026-08-14T10:00:00.000Z"
    },
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0e",
      "name": "Brooklyn Store",
      "address": { "street": "1 Atlantic Ave", "city": "Brooklyn", "state": "NY", "zipCode": "11201" },
      "location": { "type": "Point", "coordinates": [-73.9762, 40.6862] },
      "distance": 4.35,
      "createdAt": "2026-08-14T10:01:00.000Z",
      "updatedAt": "2026-08-14T10:01:00.000Z"
    }
  ]
}
```

An empty result returns `count: 0` and `data: []` with HTTP `200` (not 404).

**Errors:**

| Status | Condition |
|---|---|
| `400` | Invalid or missing ZIP code |
| `400` | Invalid, missing, zero, or negative radius |
| `404` | ZIP code not found |

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Validation errors include field-level details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "body.name", "message": "Name must be at least 2 characters" },
    { "field": "body.address.zipCode", "message": "ZIP code must contain exactly 5 digits" }
  ]
}
```

| Status | Condition |
|---|---|
| `400` | Validation failure or invalid ID format |
| `404` | Resource not found or unknown route |
| `409` | Duplicate key conflict |
| `500` | Unexpected server error |
| `502` | External service failure |

## ZIP Code Lookup

The nearby-store search uses [Zippopotam.us](https://api.zippopotam.us), a free public API that converts US ZIP codes into geographic coordinates. No API key is required.

## Testing

```bash
npm test
```

Tests use **Jest** and **Supertest** to test the API through the Express application without starting the HTTP server.

**Test database:** Tests connect to a separate MongoDB database configured by `MONGODB_TEST_URI` (defaults to `mongodb://127.0.0.1:27017/store_locator_test`). The development database is never modified by tests.

**Coverage:**

- Store creation (valid and invalid inputs)
- Store retrieval (list, by ID, nonexistent, invalid ID)
- Store update (valid, invalid body, nonexistent)
- Store deletion (valid, repeated, invalid ID)
- Nearby search (with distance, proximity ordering, empty results)
- Nearby validation (missing/invalid ZIP, missing/invalid radius)
- Error handling (unknown routes, health endpoint)

## References

- [Zippopotam.us API](https://api.zippopotam.us) — ZIP code geocoding
- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/) — `$geoNear` and 2dsphere indexes
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Zod](https://zod.dev/)