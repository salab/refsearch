RM_VERSION=2.3.2
REFDIFF_VERSION=2.0.0

.PHONY: rminer
rminer:
	docker build -t ghcr.io/salab/refsearch-rminer:master --build-arg VERSION=$(RM_VERSION) refactoringminer

.PHONY: refdiff
refdiff:
	docker build -t ghcr.io/salab/refsearch-refdiff:master --build-arg VERSION=$(REFDIFF_VERSION) refdiff
