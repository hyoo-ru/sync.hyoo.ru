# $hyoo_sync

Shared local-first offline-ready store with [CROWD](https://github.com/hyoo-ru/crowd.hyoo.ru) conflict resolution.

## Comparison

| Property            | $hyoo_sync | [Logux](https://logux.io/)
|---------------------|------------|---------------------------
| Tab synchronization | Auto       | Optional
| Conflict resolution | CROWD      | CRDT (text doesn't support yet) / custom
| Crypto encryption   | Not yet    | Single user
| Crypto signing      | Total      | No
| Long offline        | Available  | Log compress rejects old changes
| Persistent storage  | IndexedDB  | IndexedDB / LocalStorage / custom

### How to raise your server?

Simple: 
```sh
cd ./docker
docker-compose build --no-cache
docker-compose up -d
```

The server will start on port 3000 [(by default)](https://github.com/hyoo-ru/sync.hyoo.ru/blob/master/docker/docker-compose.yml#L8)

You can look at the logs at
[http://localhost:3000/watch/](http://localhost:3000/watch/)
