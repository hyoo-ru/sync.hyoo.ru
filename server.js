const http = require('http')
const express = require('express')
const cors = require('cors')
const ws = require('ws')

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
      state: new Map,
      watch: new Map,
    } )
  }
  
  return room
}

/** Returns value by keys and subscribes line to value cahnges */
function get( origin, key, line ) {

  const room = Room( origin )

  if( line ) {

    let keys = room.watch.get( line )
    if( !keys ) room.watch.set( line, keys = new Set )
    
    keys.add( key )
  }
  
  return room.state.get( key )
}

/** Unsubscribes line from all keys */
function forget( origin, line ) {
  const room = Room( origin )
  room.watch.delete( line )
}

/** Put value by key and notify all subscribed lines except current */
function put( origin, key, val, line ) {

  const room = Room( origin )

  val = Object.assign( room.state.get( key ) ?? {}, val )
  room.state.set( key, val )

  for( const [ other, keys ] of room.watch ) {
    if( line === other ) continue
    if( !keys.has( key ) ) continue
    other.send( JSON.stringify([ key, val ]) )
  }
  
  return val
}

/** GET /key */
router.get( '*', ( req, res )=> {
  res.set( 'Content-Type', 'application/json' )
  res.send( JSON.stringify( get( req.headers.origin, req.url.slice(1) ) ?? null ) )
} )

/** PUT /key */
router.put( '*', ( req, res )=> {
  res.set( 'Content-Type', 'application/json' )
  res.send( JSON.stringify( put( req.headers.origin, req.url.slice(1), req.body ) ?? null ) )
} )

/**
 * Get & Subscribe: [ key ]
 * Put | Notification: [ key, patch ]
 * Unsubscribe: disconnect
 */
socket.on( 'connection' , ( line, req )=> {

  const origin = req.headers.origin

  line
  .on( 'message' , message => {
    
    try {
      message = JSON.parse( message )
    } catch( error ) {
      console.error( error )
      return
    }

    if( !Array.isArray( message ) ) return

    const [ key, val ] = message

    if( val ) {
      put( origin, key, val, line )
    } else {
      line.send( JSON.stringify([ key, get( origin, key, line ) ]) )
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
