RM_VERSION=2.3.2
REFDIFF_VERSION=2.0.0

.PHONY: RefactoringMiner
RefactoringMiner:
	docker build -t ghcr.io/salab/refsearch-rminer:master --build-arg VERSION=$(RM_VERSION) refactoringminer

.PHONY: RefDiff
RefDiff:
	docker build -t ghcr.io/salab/refsearch-refdiff:master --build-arg VERSION=$(REFDIFF_VERSION) refdiff
