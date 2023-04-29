# $hyoo_sync_client

Synchronizes world state with server and local DB.

## Domain Model

```ts
export class $my_person extends $hyoo_crowd_struct {

  name( next?: string ) {
    return this.sub( 'name', $hyoo_crowd_reg ).str( next )
  }

  descr( next?: string ) {
    return this.sub( 'descr', $hyoo_crowd_text ).text( next )
  }
  
  skills( next?: string[] ) {
    return this.sub( 'skills', $hyoo_crowd_list ).list( next ).map( String )
  }

}
```

## Sync start

```ts
  const yard = new $hyoo_sync_client
  // ...
  yard.sync()
```

## Make new entity

```ts
  const person = yard.world().Fund( $my_person ).make()
  console.log( person.id() )
```

## Use existen entity

```ts
  const person = yard.world().Fund( $my_person ).Item( person_id )
```
