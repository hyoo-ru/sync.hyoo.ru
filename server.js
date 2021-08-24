const http = require('http')
const express = require('express')
const cors = require('cors')
const ws = require('ws')
const { Pool } = require('pg')
const {
  $hyoo_crowd_doc,
  $hyoo_crowd_clock
} = require('hyoo_crowd_lib')

const main = async() => {
  
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await db.connect()
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS store (
      key         varchar(255) UNIQUE NOT NULL,
      value       jsonb
    );
  `)
  
  const router = express()
  const server = http.createServer( router )

  router.use( cors() )
  router.use( express.json() )

  const socket = new ws.Server({
    server,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
    }
  })


  const store = new Map

  /** Returns room attached to origin */
  function Room( origin ) {

    let room = store.get( origin )
    
    if( !room ) {
      store.set( origin, room = {
        watch: new Map,
        cache: new Map,
      } )
    }
    
    return room
  }

  /** Returns value by keys and subscribes line to value cahnges */
  async function get( origin, key, line ) {
    
    const room = Room( origin )

    if( line ) {

      let keys = room.watch.get( line )
      if( !keys ) room.watch.set( line, keys = new Set )
      
      keys.add( key )
    }

    let val = room.cache.get( key )
    if( val !== undefined ) return val
    
    const res = await db.query(`SELECT value FROM store WHERE key = $1::text`, [ origin + '/' + key ] )
    
    val = res.rows[0] ? res.rows[0].value.delta : null
    room.cache.set( key, val )

    return val
  }

  /** Unsubscribes line from all keys */
  function forget( origin, line ) {
    const room = Room( origin )
    room.watch.delete( line )
  }

  /** Put value by key and notify all subscribed lines except current */
  async function put( origin, key, delta, line ) {

    const room = Room( origin )
    const prev = await get( origin, key, line ) || {}
    
    const next = merge( prev, delta )
    room.cache.set( key, next )
    
    for( const [ other, keys ] of room.watch ) {
      if( line === other ) continue
      if( !keys.has( key ) ) continue
      other.send( JSON.stringify([ key, delta ]) )
    }
    
    const res = await db.query(
      `
      INSERT INTO store ( key, value )
      VALUES( $1::text, $2::json )
      ON CONFLICT( key ) DO UPDATE
      SET value = $2::json;
      `,
      [ origin + '/' + key, { delta: next } ]
    )

    return next
  }
  
  function like_delta( val ) {
    if( !val ) return false
    if( !Array.isArray( val ) ) return false
    return true
  }

  function merge( left, right ) {
    if( like_delta( right ) ) {
      const store = new $hyoo_crowd_doc( 0 )
      if( like_delta( left ) ) store.apply( left )
      store.apply( right )
      return store.delta()
    } else {
      return Object.assign( left, right )
    }
  }

  /** GET /key */
  router.get( '*', async( req, res )=> {
    const origin = req.headers.origin || req.protocol + '://' + req.headers.host
    res.set( 'Content-Type', 'application/json' )
    res.send( JSON.stringify( await get( origin, req.url.slice(1) ) || null ) )
  } )

  /** PUT /key */
  router.put( '*', async( req, res )=> {
    const origin = req.headers.origin || req.protocol + '://' + req.headers.host
    res.set( 'Content-Type', 'application/json' )
    res.send( JSON.stringify( await put( origin, req.url.slice(1), req.body ) || null ) )
  } )

  /**
   * Get & Subscribe: [ key ]
   * Put | Notification: [ key, patch ]
   * Unsubscribe: disconnect
   */
  socket.on( 'connection' , ( line, req )=> {

    const origin = req.headers.origin

    line
    .on( 'message' , async( message )=> {
      
      // ping
      if( !message ) return

      try {
        message = JSON.parse( message )
      } catch( error ) {
        console.error( error )
        return
      }

      if( !Array.isArray( message ) ) return

      const [ key, val ] = message

      if( val ) {
        // line.send(
          // JSON.stringify([
            // key,
            await put( origin, key, val, line )
          // ])
        // )
      } else {
        line.send(
          JSON.stringify([
            key,
            await get( origin, key, line ),
          ])
        )
      }

    } )
    .on( 'close', ( code, reason )=> {
      forget( origin, line )
    } )

  } )


  server.listen( process.env.PORT || 3000, process.env.IP || "0.0.0.0", ()=> {
    var addr = server.address()
    console.log( "Server listening at ", addr.address + ":" + addr.port )
  } )

}

const start = async ()=> {
  try {
    await main()
  } catch( error ) {
    console.error( error )
    process.exit(1)
  }
}

start()
