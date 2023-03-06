# RefSearch

## Setup

Requires docker and docker compose v2.

- `make up` to launch the app
- `make down` to take down the app

Go to http://localhost:8080/ to view the app.

## Load / Export Refactorings Data

### Load formatted data via API

`GET https://localhost:8080/api/refactorings`

For query details see [api definition](./backend/src/api/serve/common.ts).

### Import raw data via CLI

`$ node import.js path/to/data.json`

Example:
`$ docker exec -it rs-backend node backend/src/cmd/import.js path/to/data.json`

To actually load formatted data and to search refactorings,
enqueue jobs from UI after importing raw data.

### Export raw data (per repository) via CLI
 
`$ node export.js path/to/data.json [repo-url]`

Example:
`$ docker exec -it rs-backend node backend/src/cmd/export.js path/to/data.json https://github.com/gradle/gradle`
