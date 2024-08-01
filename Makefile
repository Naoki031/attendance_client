# ------------------------------------------------------------
# For development
# ------------------------------------------------------------
up-build:
	docker compose up -d --build
client:
	docker container exec -it client_attendance /bin/sh
client-renpm-i:
	docker container exec -it client_attendance rm -rf node_modules package-lock.json && npm install
client-i:
	docker container exec -it client_attendance npm install
client-dev:
	docker container exec -it client_attendance npm run dev
client-build:
	docker container exec -it client_attendance npm run build