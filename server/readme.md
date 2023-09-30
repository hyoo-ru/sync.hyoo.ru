# $hyoo_sync_server

CROWD based sync server.

## Run

### Native

	node node.js port=3000 db=postrges://... log=/var/log/sync.log
	
### Docker

```sh
cd ../docker
docker-compose build --no-cache
docker-compose up -d
```

## Admin UI

Dev: http://localhost:3000/watch/
Prod: https://sync.hyoo.ru/watch/

## API

### Sync

Use `$hyoo_sync_client`. Example of WS URI: `wss://sync.hyoo.ru`.

### Query Data

	GET /land=qwerty_qwerty=(title_reg;author_ref(details_text))

## Query Logs

	GET /log

