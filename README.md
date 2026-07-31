# 📚 Digital Library & Reading Tracker

A backend web application built with Node.js and Express.js that helps readers
estimate how long it will take to finish a book, based on their reading speed
and daily time availability.

This is **Assignment 1** of 4 in the *Web Technologies 2 (Back End)* course.
The project is designed to evolve across all four assignments — future work
will add persistent storage, user accounts, and a REST API on top of this
same foundation.

---

## Features

- Server-side reading-time and completion-date calculator
- Full server-side input validation with friendly error messages
- Responsive, accessible, card-based UI (desktop, tablet, mobile)
- Static reading tips page
- Custom 404 and error-handling pages
- Clean MVC-inspired architecture (routes / controllers / utils / validators / middleware)

---

## Technologies

- **Node.js** — JavaScript runtime
- **Express.js** — web framework and routing
- **EJS** — server-side templating engine
- **Vanilla CSS** — no frameworks, custom design system via CSS variables
- **Vanilla JavaScript** — no frontend frameworks
- **Nodemon** — development auto-reload

---

## Installation

```bash
# 1. Clone or unzip the project
cd reading-tracker

# 2. Install dependencies
npm install

# 3. (Optional) copy environment file
cp .env.example .env
```

## Running the app

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The app will be available at **http://localhost:3000**

---

## Routes

| Method | Path                      | Description                          |
|--------|---------------------------|---------------------------------------|
| GET    | `/`                       | Displays the reading plan form        |
| POST   | `/calculate-reading-plan` | Validates input and returns a plan    |
| GET    | `/reading-tips`           | Displays static reading advice        |

---

## Calculation Logic

Given total pages, pages already read, reading speed (pages/hour), minutes
available per day, and a start date:

1. **Remaining pages** = totalPages − pagesRead
2. **Total hours needed** = remainingPages / readingSpeed
3. **Daily hours available** = minutesPerDay / 60
4. **Days needed** = ⌈totalHours / dailyHours⌉ (rounded up)
5. **Completion date** = startDate + daysNeeded

---

## Folder Structure

```
reading-tracker/
├── server.js                 # Entry point — starts the HTTP server
├── app.js                    # Express app configuration (middleware, routes)
├── config/
│   └── constants.js          # App-wide constants (port, conversion factors)
├── controllers/
│   └── readingController.js  # Request/response orchestration
├── routes/
│   └── readingRoutes.js      # Route → controller mapping
├── utils/
│   ├── readingCalculator.js  # Pure calculation functions
│   └── dateUtils.js          # Date math helpers
├── validators/
│   └── readingValidator.js   # Input validation logic
├── middleware/
│   ├── notFound.js           # 404 handler
│   └── errorHandler.js       # Centralized error handler
├── views/
│   ├── index.ejs             # Home page (form + results)
│   ├── readingTips.ejs       # Reading tips page
│   ├── 404.ejs
│   └── 500.ejs
└── public/
    └── css/
        └── style.css          # All styling
```

---

## Screenshots

*(Add screenshots of the home page, validation errors, results, and reading
tips page here before submission.)*

---

## Future Roadmap

- **Assignment 2:** Book management (CRUD), persistent storage
- **Assignment 3:** User accounts, authentication, sessions
- **Assignment 4:** Reading statistics, dashboard, REST API, admin panel

---

## Author

**Nurdaulet Zhussip**
Web Technologies 2 (Back End) — Assignment 1
