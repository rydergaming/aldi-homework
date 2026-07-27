# aldi-homework

Test automation homework for the ALDI QA Test Automation Engineer position.

The repository contains two independent suites against the same system:

- **[Playwright](https://playwright.dev/) / TypeScript** — UI tests for the login flows on [practicetestautomation.com](https://practicetestautomation.com/practice-test-login/) across Chromium, Firefox and WebKit, plus CRUD API tests for a Task Management API.
- **JUnit 5 / Java** — API tests for the same Task Management API, written against Selenium's built-in HTTP client, runnable in Docker and wired into GitHub Actions.

The API under test is described by [`testing/backend/openapi.yaml`](testing/backend/openapi.yaml).

## Prerequisites

| Suite | Needs |
| --- | --- |
| Playwright | Node.js 18 or newer (developed on v26) and npm |
| Java | JDK 17 and Maven 3.9 — or just Docker, which needs neither |

## Setup

```bash
npm install
npx playwright install
```

Then create your local environment file from the template:

```bash
cp .env.example .env
```

`.env` is git-ignored; `.env.example` documents every variable the suites read.

## Configuration

Both suites read the same three variables. TypeScript loads them through [`utils/env.ts`](utils/env.ts), which [`playwright.config.ts`](playwright.config.ts) uses as `baseURL`. Java reads them in `TaskManagerTest.env(...)`, checking system properties first and falling back to environment variables.

| Variable | Description | Example |
| --- | --- | --- |
| `URL` | Base URL for both the UI and the API. All paths are relative to this. | `https://practicetestautomation.com` |
| `UI_USERNAME` | Username for the login tests and for API basic auth. | `student` |
| `UI_PASSWORD` | Password for the login tests and for API basic auth. | `Password123` |

Both API suites prefix every route with `/api/v1`, matching the `servers` entries in the OpenAPI document, and authenticate with HTTP basic auth built from `UI_USERNAME` / `UI_PASSWORD`.

## Running the Playwright suite

```bash
npm test                 # everything: API + all three browsers
npm run test:api         # API tests only, no browser launched
npm run test:ui          # UI tests in Chromium only
npm run test:headed      # watch the browser
npm run report           # open the last HTML report
```

Results are written as an HTML report; `npm run report` serves it.

## Running the Java suite

Against a local Maven install:

```bash
mvn -f testing/selenium/pom.xml test -DURL=http://localhost:8080
```

Or in Docker, which needs no JDK or Maven on your machine:

```bash
docker compose run --rm api-tests
```

Compose reads `URL`, `UI_USERNAME` and `UI_PASSWORD` from your shell or from `.env`, and aborts with a readable message if any is missing rather than silently falling back to `localhost`. To override for a single run:

```bash
URL=https://tasks.example.com docker compose run --rm api-tests
```

If the API runs on your host machine rather than in the compose network, use the mapped host alias — `localhost` inside a container refers to the container itself:

```bash
URL=http://host.docker.internal:8080 docker compose run --rm api-tests
```

Surefire reports land in `testing/selenium/target/surefire-reports/` on the host via a bind mount.

## Continuous integration

[`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml) runs the Java suite in Docker on pushes to `main`, on every pull request, and on demand via **Run workflow**. Surefire reports upload as a build artifact on both green and red runs.

It expects three values under **Settings → Secrets and variables → Actions**:

| Name | Kind | Notes |
| --- | --- | --- |
| `API_URL` | Variable | Base URL of the API, reachable from GitHub-hosted runners |
| `UI_USERNAME` | Secret | Masked in logs |
| `UI_PASSWORD` | Secret | Masked in logs |

## Project structure

```
├── Dockerfile                      # Java suite image (Maven + JDK 17)
├── .dockerignore                   # keeps node_modules and .env out of the build context
├── docker-compose.yml              # api-tests service
├── playwright.config.ts            # projects, baseURL, reporter
├── .github/workflows/
│   └── api-tests.yml               # CI for the Java suite
├── utils/
│   ├── env.ts                      # typed access to environment variables
│   └── type.ts                     # shared TaskData type
└── testing/
    ├── backend/
    │   ├── openapi.yaml            # API specification under test
    │   ├── openapitools.json       # openapi-generator-cli pin
    │   ├── ApiHelper.ts            # request wrappers, auth, task factory
    │   └── taskmanager.test.ts     # CRUD tests
    ├── frontend/
    │   ├── pages/                  # page objects
    │   │   ├── login.page.ts
    │   │   └── landing.page.ts
    │   └── tests/
    │       └── login.test.ts
    └── selenium/
        ├── pom.xml                 # JUnit 5 + selenium-java
        └── src/test/java/com/rydergaming/app/
            ├── ApiHelper.java      # HTTP client wrapper, basic auth
            └── TaskManagerTest.java
```

Playwright projects are scoped by directory, so the API suite runs once against `testing/backend`, while the three browser projects each run `testing/frontend`. The `api` project declares no `devices`, so it launches no browser.

## Test coverage

### UI — Playwright (`testing/frontend`)

Page objects encapsulate locators and navigation; tests contain only the flow and its assertions.

- Successful login lands on the logged-in page.
- An invalid password surfaces the expected error and does not log the user in.
- An invalid username surfaces the expected error and does not log the user in.

### API — Playwright (`testing/backend`)

`ApiHelper` wraps the four endpoints and provides a `createTask` factory used as test setup, so each test creates the data it needs rather than depending on another test or on pre-existing records.

- **Create** — `POST /task` returns 200 and echoes the submitted task.
- **Read** — `GET /task/{taskId}` returns 200 and the created task.
- **Update** — `PUT /task/{taskId}` returns 200 and the updated fields.
- **Delete** — `DELETE /task/{taskId}` returns 200 with the deleted id, and a follow-up read returns 404.

### API — Java (`testing/selenium`)

Negative coverage of the delete endpoint, complementing the positive Playwright cases. Written with `org.openqa.selenium.remote.http.HttpClient` — the client Selenium uses internally for the WebDriver protocol — so `selenium-java` is the only dependency beyond JUnit, and no browser is launched.

`ApiHelper` builds the preemptive basic-auth header and owns the client lifecycle; a single `@ParameterizedTest` drives the cases from a `@CsvSource` table:

- A well-formed id that does not exist returns 404.
- `0` and `-1` return 400, per the `minimum: 1` constraint on `taskId` in the spec.
- A non-numeric id returns 400.
