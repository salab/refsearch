# Development Guide

## Adding refactoring types

To add refactoring types displayed in select box in the UI, add types to `RefactoringTypes` object in `./common/common.ts`.
(Note that the object merges in object defined in `./common/rminer.ts`.)

Backend can ingest any "type" of refactoring data (that is, refactoring data with any "type" field values); this is only for ease of searching refactorings in the UI.

## Deleting data

The easiest way to purge all local data is to remove the `./data` directory.

1. `make down`
2. `sudo rm -r ./data`
3. `make up`

## Upgrading dependencies

After upgrading the dependencies, check that the app is working by launching it with `make up` (see [README.md](../README.md)).

### Node packages

To upgrade the node version itself, edit the versions in `backend.Dockerfile` and `frontend.Dockerfile`.

To upgrade node dependencies, either

- edit dependency versions in `backend/package.json` and `frontend/package.json` directly, and run `yarn install` at each directory,
- or merge dependabot Pull Requests.

### Dockerized tool dependencies

Integrated dockerized tools for detecting refactorings are located in the `tools` directory.

To update gradle version, run `./gradlew wrapper --gradle-version={new version}` and edit the version in `Dockerfile`. 

To update other gradle dependencies, edit the version in `build.gradle.kts`.

- `net.sourceforge.argparse4j:argparse4j` is used to cleanly parse process launch arguments.
- `com.fasterxml.jackson.core:jackson-*` are used to unmarshal / marshal JSON payloads in HTTP API requests.
- `org.eclipse.jgit:org.eclipse.jgit` is used to insert some glue codes to interact with RefactoringMiner APIs. Its version should match with what is specified in RefactoringMiner's dependencies.
