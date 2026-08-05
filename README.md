# 📚 Digital Library & Reading Tracker

A full-stack web application built with Node.js, Express.js, and MongoDB that helps
readers track their reading habits, catalogue books, log reading sessions, write
reviews, and organize books into shelves. It also integrates external APIs for
book discovery, author information, dictionary lookups, and library geocoding.

This is **Assignment 3** of 4 in the *Web Technologies 2 (Back End)* course.
The project has evolved across three assignments:

- **Assignment 1:** Server-rendered reading-time calculator (Express + EJS)
- **Assignment 2:** External API integrations (Open Library, Wikipedia, dictionary,
  geocoding, NYT Best Sellers)
- **Assignment 3:** A full RESTful CRUD API backed by MongoDB/Mongoose, with
  validation, filtering, pagination, and a frontend CRUD interface

---

## Features

- Full CRUD REST API for Books, Reading Logs, Reviews, and Shelves
- MongoDB persistence via Mongoose, with schema-level and cross-document validation
- Filtering (author, genre, rating, completion), sorting, and pagination on list endpoints
- Centralized error handling for validation errors, invalid IDs, and duplicate keys
- Full CRUD frontend interface for the Book Catalogue
- Read/filter frontend interface for Reading Logs
- External API integrations from Assignment 2 (book search, author bios, dictionary,
  library finder, NYT best sellers)
- Postman collection with 45+ documented requests covering success and failure cases

---

## Technologies

- **Node.js** / **Express.js** — server and routing
- **MongoDB** / **Mongoose** — database and schema/validation layer
- **EJS** — server-side templating
- **Vanilla CSS / JavaScript** — no frontend frameworks
- **dotenv** — environment variable management
- **Postman** — API testing and documentation

---

## Installation

```bash
# 1. Clone or unzip the project
cd reading-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in real values (see below)
```

### Required environment variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default: 3000) |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `NYT_BOOKS_API_KEY` | Free API key from developer.nytimes.com (Books API) |

**Local MongoDB (recommended for development):**
```
MONGODB_URI=mongodb://localhost:27017/reading-tracker
```
Requires MongoDB Community Server installed locally (see
https://www.mongodb.com/try/download/community).

---

## Database setup and seeding

Once MongoDB is running and `.env` is configured:

```bash
npm run seed
```

This clears any existing data and seeds the database with:
- **50 real books** across five categories (Kazakh Literature, English Classics,
  Russian Literature, Business & Self-Improvement, Autobiography & Memoir)
- **~100 reading log entries** across those books
- **~25 reviews** with ratings and text
- **5 shelves**, one per category, each pre-populated with its category's books

Re-run `npm run seed` any time to reset the database to this known state.

---

## Running the app

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The app runs at **http://localhost:3000**

---

## Data Models (Mongoose Schemas)

### Book
| Field | Type | Rules |
|---|---|---|
| `isbn` | String | Optional, unique when provided (sparse index) |
| `title` | String | Required |
| `authors` | [String] | Required, at least one |
| `genres` | [String] | Optional, defaults to `[]` |
| `pages` | Number | Required, minimum 1 |

### ReadingLog
| Field | Type | Rules |
|---|---|---|
| `bookId` | ObjectId (ref: Book) | Required; must reference an existing book |
| `date` | Date | Required |
| `pagesRead` | Number | Required, minimum 0; cannot exceed the referenced book's `pages` |
| `minutes` | Number | Required, minimum 1 |

### Review
| Field | Type | Rules |
|---|---|---|
| `bookId` | ObjectId (ref: Book) | Required; must reference an existing book |
| `rating` | Number | Required, 0–5 |
| `text` | String | Optional |

### Shelf
| Field | Type | Rules |
|---|---|---|
| `name` | String | Required |
| `bookIds` | [ObjectId] (ref: Book) | Optional; every ID must reference an existing book |

All models include automatic `createdAt` / `updatedAt` timestamps.

**Relationships:** `Book` is the central entity. `ReadingLog` and `Review` each hold
a single reference to one book (many-to-one). `Shelf` holds an array of book
references (many-to-many). Cross-document rules that depend on the referenced
book (book existence, pagesRead within page length) are enforced in the
controller layer, since Mongoose schema validation cannot query other collections.

---

## API Routes

### Own Database (Assignment 3)

| Method | Path | Description |
|---|---|---|
| POST | `/api/library/books` | Create a book |
| GET | `/api/library/books` | List books (supports `?author=`, `?genre=`, `?sort=`, `?page=`, `?limit=`) |
| GET | `/api/library/books/:id` | Get one book |
| PUT | `/api/library/books/:id` | Update a book |
| DELETE | `/api/library/books/:id` | Delete a book |
| POST | `/api/library/reading-logs` | Create a reading log |
| GET | `/api/library/reading-logs` | List logs (supports `?completion=`, `?sort=`, `?page=`, `?limit=`) |
| GET | `/api/library/reading-logs/:id` | Get one log |
| PUT | `/api/library/reading-logs/:id` | Update a log |
| DELETE | `/api/library/reading-logs/:id` | Delete a log |
| POST | `/api/library/reviews` | Create a review |
| GET | `/api/library/reviews` | List reviews (supports `?rating=`, `?sort=`, `?page=`, `?limit=`) |
| GET | `/api/library/reviews/:id` | Get one review |
| PUT | `/api/library/reviews/:id` | Update a review |
| DELETE | `/api/library/reviews/:id` | Delete a review |
| POST | `/api/library/shelves` | Create a shelf |
| GET | `/api/library/shelves` | List shelves |
| GET | `/api/library/shelves/:id` | Get one shelf |
| PUT | `/api/library/shelves/:id` | Update a shelf |
| DELETE | `/api/library/shelves/:id` | Delete a shelf |

### External APIs (Assignment 2)

| Method | Path | Description |
|---|---|---|
| GET | `/api/books/search` | Search books (Open Library) |
| GET | `/api/books/best-sellers` | NYT Best Sellers lists |
| GET | `/api/books/:id` | Combined book detail (Open Library + ratings + Wikipedia author bio) |
| GET | `/api/authors/search` | Search author candidates (Open Library) |
| GET | `/api/authors/bio` | Author biography (Wikipedia, multilingual) |
| GET | `/api/dictionary` | Word definitions (multilingual) |
| GET | `/api/libraries` | Library finder (geocoded) |

### Pages

| Method | Path | Description |
|---|---|---|
| GET | `/` | Reading plan calculator |
| GET | `/reading-tips` | Reading tips |
| GET | `/search` | Discover hub (external API features) |
| GET | `/admin/books` | Book Catalogue — full CRUD |
| GET | `/admin/reading-logs` | Reading Logs — read/filter |

---

## Query Features

- **Filtering:** books by author/genre (partial, case-insensitive match), reviews
  by rating (exact match), reading logs by completion (derived: pagesRead ≥ the
  referenced book's total pages)
- **Sorting:** any list endpoint accepts `?sort=field` (ascending) or `?sort=-field`
  (descending)
- **Pagination:** `?page=` and `?limit=` (capped at 100 per page), with `total` and
  `totalPages` returned in every list response

---

## Validation & Error Handling

- Schema-level validation (required fields, types, ranges, unique ISBN) via Mongoose
- Cross-document validation (referenced book must exist, pagesRead within book
  length) enforced in controllers before writes
- Centralized error-handling middleware converts:
  - Mongoose `ValidationError` → `400` with combined field error messages
  - Mongoose `CastError` (malformed ObjectId) → `400`
  - MongoDB duplicate key error (code 11000) → `409`
  - Unhandled errors → `500` (generic message; full error logged server-side)

---

## Testing

All endpoints are tested in Postman — see the exported collection
(`postman/Reading Tracker API.postman_collection.json`) for 45+ requests covering:
- Successful CRUD operations for all four resources
- Missing/invalid field validation
- Domain rule violations (nonexistent book references, pagesRead exceeding book
  length, rating out of range)
- 404 handling for nonexistent IDs
- Query feature verification (filtering, sorting, pagination, completion)
- Error handler edge cases (malformed IDs, duplicate ISBN)

---

## Folder Structure

```
reading-tracker/
├── server.js
├── app.js
├── seed.js
├── config/
│   ├── constants.js
│   └── db.js
├── models/
│   ├── Book.js
│   ├── ReadingLog.js
│   ├── Review.js
│   └── Shelf.js
├── controllers/
├── routes/
├── services/
├── utils/
├── validators/
├── middleware/
├── views/
├── public/
└── postman/
```

---

## Future Roadmap

- **Assignment 4:** User accounts, authentication, sessions, and a REST API/dashboard

---

## Author

**Nurdaulet Zhussip**
Web Technologies 2 (Back End) — Assignment 3
