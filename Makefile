.PHONY: up
up:
	PWD=`pwd` docker compose up -d --build

.PHONY: down
down:
	docker compose down
