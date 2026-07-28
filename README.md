# aldi-homework

Test automation homework for the ALDI QA Test Automation Engineer position.

The repository contains three bodies of work:

- **[Playwright](https://playwright.dev/) / TypeScript** — UI tests for the login flows on [practicetestautomation.com](https://practicetestautomation.com/practice-test-login/) across Chromium, Firefox and WebKit, plus CRUD API tests for a Task Management API.
- **JUnit 5 / Java** — negative API tests for the same Task Management API, written against Selenium's built-in HTTP client, runnable in Docker and wired into GitHub Actions.
- **Manual testing** — Gherkin scenarios and a bug report from exploratory testing of the ALDI storefront.

All 13 Playwright tests pass once [set up](#setup) — the API suite needs no running service.

## The Task Management API

There is no third-party API behind the API suites. I wrote [`testing/backend/openapi.yaml`](testing/backend/openapi.yaml) as a specification to test against, and [`testing/backend/mock/server.ts`](testing/backend/mock/server.ts) is a reference implementation of it — validation, status codes and the error schema all derive from the document rather than from the tests.

Playwright starts it automatically via the `webServer` hook, so `npm run test:api` works with no setup. Setting `API_URL` skips it entirely and points the suite at a real implementation instead.

This is worth stating plainly: a green API run proves the tests execute and the specification is implementable. It does not validate any third-party system. The suites are structured so that swapping in a real API is a single environment variable.

## Prerequisites

| Suite | Needs |
| --- | --- |
| Playwright | Node.js 22.18 or newer, or 23.6 or newer (developed on v26), and npm |
| Java | JDK 17 and Maven 3.9 — or just Docker, which needs neither |

The reference implementation is TypeScript run directly by Node, which is why the version floor is higher than Playwright alone would need. Those two releases are where type stripping runs unflagged; 22.6 introduced it behind `--experimental-strip-types`, which none of the commands below pass.

## Setup

```bash
npm install
npx playwright install
```

Then create a local environment file from the template:

```bash
cp .env.example .env
```

`.env` is git-ignored; `.env.example` documents every variable the suites read and carries working values for a local run. Skip it and the UI suite points at `localhost` instead of the site under test, while the API suite sends empty credentials and gets a 401 on every request.

## Configuration

TypeScript loads configuration through [`utils/env.ts`](utils/env.ts), which [`playwright.config.ts`](playwright.config.ts) uses for `baseURL`. Java reads the same names in `TaskManagerTest.env(...)`, checking system properties first and falling back to environment variables.

| Variable | Description | Value in `.env.example` | Fallback if unset |
| --- | --- | --- | --- |
| `URL` | Base URL for the UI suite. | `https://practicetestautomation.com` | `http://localhost:8080` |
| `API_URL` | Base URL for the API suites. Unset means the bundled reference implementation. | unset | `http://localhost:8080` |
| `UI_USERNAME` | Username for the login tests and for API basic auth. | `student` | empty |
| `UI_PASSWORD` | Password for the login tests and for API basic auth. | `Password123` | empty |

The fallbacks exist so that reading configuration never throws; they are not usable values for the UI suite. Java falls back differently: `TaskManagerTest.env(...)` defaults to `http://localhost:8080`, `student` and `Password123`, matching the reference implementation.

`URL` and `API_URL` are separate because the UI tests and the API are different systems; collapsing them sends API requests at the UI tests host.

Both API suites prefix every route with `/api/v1`, matching the `servers` entries in the OpenAPI document, and authenticate with HTTP basic auth built from `UI_USERNAME` / `UI_PASSWORD`.

## Running the Playwright suite

```bash
npm test                 # everything: API + all three browsers
npm run test:api         # API tests only, no browser launched
npm run test:ui          # UI tests in Chromium only
npm run test:headed      # watch the browser
npm run report           # open the last HTML report
npm run mock             # run the reference API standalone, for the Java suite
```

Results are written as an HTML report; `npm run report` serves it.

To run the API suite against something other than the reference implementation:

```bash
API_URL=https://tasks.example.com npm run test:api
```

## Running the Java suite

The Java suite has no `webServer` equivalent, so start the reference API first if that is the target:

```bash
npm run mock &
mvn -f testing/selenium/pom.xml test -DAPI_URL=http://localhost:8080
```

Or in Docker, which needs no JDK or Maven on your machine:

```bash
API_URL=https://tasks.example.com docker compose run --rm api-tests
```

Compose requires `API_URL`, `UI_USERNAME` and `UI_PASSWORD`, reading them from your shell or from `.env`. It aborts with a readable message if any is missing rather than silently falling back to `localhost`.

If the API runs on your host machine — including `npm run mock` — use the mapped host alias, since `localhost` inside a container refers to the container itself:

```bash
API_URL=http://host.docker.internal:8080 docker compose run --rm api-tests
```

Surefire reports land in `testing/selenium/target/surefire-reports/` on the host via a bind mount.

## Continuous integration

[`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml) runs the Java suite in Docker on pushes to `main`, on every pull request, and on demand via **Run workflow**. Surefire reports upload as a build artifact on both green and red runs.

CI deliberately points at `API_URL` rather than starting the reference implementation: a pipeline that mocks its own target verifies nothing.

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
├── .env.example                    # template for the git-ignored .env
├── docker-compose.yml              # api-tests service
├── playwright.config.ts            # projects, baseURL, webServer, reporter
├── .github/workflows/
│   └── api-tests.yml               # CI for the Java suite
├── utils/
│   ├── env.ts                      # typed access to environment variables
│   └── type.ts                     # shared TaskData type
└── testing/
    ├── backend/
    │   ├── openapi.yaml            # API specification under test
    │   ├── mock/server.ts          # reference implementation of the spec
    │   ├── ApiHelper.ts            # request wrappers, auth, task factory
    │   └── taskmanager.test.ts     # CRUD tests
    ├── frontend/
    │   ├── pages/                  # page objects
    │   │   ├── login.page.ts
    │   │   └── landing.page.ts
    │   └── tests/
    │       └── login.test.ts
    ├── manual/
    │   ├── tests.feature           # Gherkin scenarios
    │   ├── bugreport.md            # defect found while exploring
    │   └── zero_count.png          # supporting screenshot
    └── selenium/
        ├── pom.xml                 # JUnit 5 + selenium-java
        └── src/test/java/com/rydergaming/app/
            ├── ApiHelper.java      # HTTP client wrapper, basic auth
            └── TaskManagerTest.java
```

Playwright projects are scoped by directory, so the API suite runs once against `testing/backend`, while the three browser projects each run `testing/frontend`. The `api` project declares no `devices`, so it launches no browser, and overrides `baseURL` to reach the API rather than the UI test.

## Test coverage

### Manual (`testing/manual`)

Exploratory testing of the ALDI storefront, covering the product quantity and basket flows. [`tests.feature`](testing/manual/tests.feature) records the scenarios in Gherkin — cases better expressed as specifications than as code against a third-party site:

- Quantity boundary values: 501 disables **Add to Cart**, 500 keeps it enabled.
- A non-numeric custom quantity disables **Add to Cart**.
- Checkout as a guest redirects to the login page.
- Removing an item from the basket clears it from the shopping list.

[`bugreport.md`](testing/manual/bugreport.md) documents the defect found while covering that area: a custom quantity of **0** is accepted and reaches the basket, where the `UpdateCartItemsMutation` request returns 200 with no error. Reported with reproduction steps, expected and actual behaviour, environment, version and a screenshot.

### UI — Playwright (`testing/frontend`)

Page objects encapsulate locators and navigation; tests contain only the flow and its assertions. One scenario per test, so a failure names the behaviour that broke.

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

Negative coverage of the delete endpoint, complementing the positive Playwright cases, and a deliberate demonstration of the same problem in a second stack. Written with `org.openqa.selenium.remote.http.HttpClient` — the client Selenium uses internally for the WebDriver protocol — so `selenium-java` is the only dependency beyond JUnit, and no browser is launched.

`ApiHelper` builds the preemptive basic-auth header and owns the client lifecycle; a single `@ParameterizedTest` drives the cases from a `@CsvSource` table:

- A well-formed id that does not exist returns 404.
- `0` and `-1` return 400, per the `minimum: 1` constraint on `taskId` in the spec.
- A non-numeric id returns 400.


