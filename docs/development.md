# Development Guide

## Adding processor plugins

You can add arbitrary processor plugin into the job pipeline, to detect extra refactorings with.

To configure a processor plugin, do the following:

- Prepare an executable file inside the RefSearch 'runner' docker container,
- and provide the following environment variables to the  RefSearch 'runner' process:
  - `PROCESS_PLUGIN_{NAME}_NAME`: Plugin name. This will be set to the `meta.tool` field of detected refactorings.
  - `PROCESS_PLUGIN_{NAME}_EXECUTABLE`: Plugin executable path. Details below.
  - `{NAME}` inside the environment variable names must not have `_` in it. To add multiple plugins, change the `{NAME}`.

For example, provide the following environment variables:

- `PROCESS_PLUGIN_MYDETECTOR_NAME`: `Awesome Refactoring Detector`
- `PROCESS_PLUGIN_MYDETECTOR_EXECUTABLE`: `/plugins/example-process-plugin.sh`
  - Make sure the RefSearch 'runner' can find this file.

The RefSearch 'runner' component will invoke the executable file with:

- Repository URL as the first argument,
- Commit SHA1 hash as the second argument,
- and cloned repository as the current working directory.

A plugin **must** only output a single JSON array to its stdout, with at least the following properties for each array element (a detected refactoring instance):

```typescript
interface PureRefactoringMeta {
  type: string
  description: string
}
```

Each array element (a refactoring instance) may have more fields in order to ease the search.
Extra fields are ingested as-is into the database.

An example plugin output would be:

```json
[
  {
    "type": "Extract Method",
    "description": "Extracted method m1() from m2(String)",
    "extractMethod": {
      "sourceMethodLines": 10,
      "extractedLines": 5,
      "sourceMethodsCount": 2
    }
  }
]
```

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
