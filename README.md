# $hyoo_sync_server

CROWD based sync server

## Run

	node node.js port=9090 db=postrges://... log=/var/log/sync.log
	
## API

### Sync

Use `$hyoo_crowd_sync`. Example of server uri: `wss://sync.hyoo.ru`.

### Query Data

	GET /land=qwerty_qwerty[title_reg;author_ref[details_text]]

## Query Logs

	GET /log

