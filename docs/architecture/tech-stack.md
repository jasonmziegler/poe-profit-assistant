# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All choices are optimized for zero-cost local development while maintaining professional quality.

## Technology Stack Table

| Category             | Technology            | Version | Purpose                      | Rationale                                         |
| -------------------- | --------------------- | ------- | ---------------------------- | ------------------------------------------------- |
| Frontend Language    | TypeScript            | 5.3+    | Type-safe development        | Strong typing for complex item data structures    |
| Frontend Framework   | Next.js               | 14+     | Full-stack React framework   | Excellent DX, can run locally or build static     |
| UI Component Library | Radix UI              | Latest  | Headless components          | Accessible, unstyled components for custom design |
| State Management     | Zustand               | 4.4+    | Client state management      | Simple, lightweight alternative to Redux          |
| Backend Language     | TypeScript            | 5.3+    | API routes & processing      | Same language across stack                        |
| Backend Framework    | Next.js API Routes    | 14+     | Serverless functions locally | Built into Next.js, no separate backend           |
| API Style            | REST                  | -       | Simple HTTP endpoints        | Straightforward for client-side calls             |
| Database             | SQLite                | 3.x     | Local data storage           | Zero-cost file-based database                     |
| Cache                | JSON Files            | -       | API response caching         | Simple file-based caching                         |
| File Storage         | Local FS              | -       | Data and cache files         | User's file system                                |
| Authentication       | localStorage          | -       | Session token storage        | Simple browser storage for POESESSID              |
| Frontend Testing     | Vitest                | 1.0+    | Unit testing                 | Fast, Vite-based testing                          |
| Backend Testing      | Vitest                | 1.0+    | API route testing            | Same tool for consistency                         |
| E2E Testing          | Playwright            | 1.40+   | End-to-end testing           | Works great with local apps                       |
| Build Tool           | Vite (via Next.js)    | 5.0+    | Build optimization           | Built into Next.js                                |
| Bundler              | Webpack (via Next.js) | 5.x     | Module bundling              | Built into Next.js                                |
| IaC Tool             | N/A                   | -       | Not needed                   | Local-first, no infrastructure                    |
| CI/CD                | GitHub Actions        | -       | Build validation             | Free for public repos                             |
| Monitoring           | Console Logging       | -       | Development debugging        | Simple, built-in                                  |
| Logging              | Winston               | 3.11+   | Structured logging           | File-based logs locally                           |
| CSS Framework        | TailwindCSS           | 3.4+    | Utility-first CSS            | Rapid UI development                              |
