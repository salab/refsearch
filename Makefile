.PHONY: up
up:
	PWD=`pwd` docker compose --compatibility up -d --build

.PHONY: down
down:
	docker compose down
