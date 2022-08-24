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
