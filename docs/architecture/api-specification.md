# API Specification

Based on our local-first architecture, the API consists of Next.js API routes that run locally, processing data from SQLite and external PoE APIs.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: POE Profit Assistant Local API
  version: 1.0.0
  description: Local REST API for profit opportunity detection
servers:
  - url: http://localhost:3000/api
    description: Local development server

paths:
  /analyze:
    get:
      summary: Analyze market for profit opportunities
      description: Fetches character data, analyzes demand, and identifies opportunities
      responses:
        '200':
          description: Successful analysis
          content:
            application/json:
              schema:
                type: object
                properties:
                  opportunities:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProfitOpportunity'
                  metadata:
                    type: object

  /characters/fetch:
    post:
      summary: Fetch character data from ladder
      responses:
        '200':
          description: Characters fetched successfully

  /trade/search:
    post:
      summary: Search trade listings for specific items
      responses:
        '200':
          description: Trade listings found

  /preferences:
    get:
      summary: Get user preferences
      responses:
        '200':
          description: User preferences retrieved
    put:
      summary: Update user preferences
      responses:
        '200':
          description: Preferences updated

  /session/validate:
    post:
      summary: Validate POESESSID
      responses:
        '200':
          description: Session valid
        '401':
          description: Invalid session
```
