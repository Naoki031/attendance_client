# ------------------------------------------------------------
# For development
# ------------------------------------------------------------
dockerName=attendance_client
dataSource=src/core/database/data-source.ts
migrationDir=src/core/database/migrations
seedDir=src/core/database/seeds

up-build:
	docker compose up -d --build
client:
	docker container exec -it ${dockerName} /bin/sh
client-renpm-i:
	docker container exec -it ${dockerName} rm -rf node_modules package-lock.json && npm install
client-i:
	docker container exec -it ${dockerName} npm install
client-dev:
	docker container exec -it ${dockerName} npm run dev
client-build:
	docker container exec -it ${dockerName} npm run build