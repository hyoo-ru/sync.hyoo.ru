# $hyoo_sync

Shared local-first offline-ready store with [CROWD](https://github.com/hyoo-ru/crowd.hyoo.ru) conflict resolution.

## Libs

- [Server](https://github.com/hyoo-ru/sync.hyoo.ru/tree/master/server)
- [Client](https://github.com/hyoo-ru/sync.hyoo.ru/tree/master/client)

## Comparison

| Property            | **$hyoo_sync** | [FireBase](https://firebase.google.com/) | [Logux](https://logux.io/)
|---------------------|----------------|--------------------|---------------------------
| Conflict resolution | **CROWD**      | Compare-and-Set    | Manual
| Crypto encryption   | Manual         | Manual             | Single user
| Crypto signing      | **Total**      | No                 | No
| Long offline        | **Available**  | Until session ends | Log compression rejects old changes
| Persistent storage  | **IndexedDB**  | **IndexedDB**      | **IndexedDB** / LocalStorage / custom
