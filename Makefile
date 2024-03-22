.DEFAULT_GOAL := up

.PHONY: up
up:
	docker compose --compatibility up -d --build

.PHONY: down
down:
	docker compose down
