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

### Import raw data per repository per tool via CLI

`$ node import.js repo-url tool-name path/to/data.json`

Example:
`$ docker exec -it rs-backend node backend/src/cmd/import.js https://github.com/gradle/gradle RefactoringMiner path/to/data.json`

To actually load formatted data and to search refactorings,
enqueue jobs from UI after importing raw data.

### Export raw data per repository per tool via CLI
 
`$ node export.js repo-url tool-name path/to/data.json`

Example:
`$ docker exec -it rs-backend node backend/src/cmd/export.js https://github.com/gradle/gradle RefactoringMiner path/to/data.json`
