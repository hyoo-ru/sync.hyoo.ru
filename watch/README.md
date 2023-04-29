# $hyoo_sync

Shared local-first offline-ready store with [CROWD](https://github.com/hyoo-ru/crowd.hyoo.ru) conflict resolution.

## Libs

- [Server](https://github.com/hyoo-ru/sync.hyoo.ru/tree/master/server)
- [Client](https://github.com/hyoo-ru/sync.hyoo.ru/tree/master/client)

## Comparison

| Property            | $hyoo_sync | [Logux](https://logux.io/)
|---------------------|------------|---------------------------
| Conflict resolution | CROWD      | Manual
| Crypto encryption   | Manual     | Single user
| Crypto signing      | Total      | No
| Long offline        | Available  | Log compress rejects old changes
| Persistent storage  | IndexedDB  | IndexedDB / LocalStorage / custom
