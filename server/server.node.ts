namespace $ {
	
	const uri_normal = ( uri: string )=> /^https?:/.test( uri ) ? uri : '?' + uri
	const sanit = ( dom: Node )=> {
		if( dom.nodeType === dom.ELEMENT_NODE ) {
			const el = dom as Element
			for( const attr of el.attributes ) {
				const name = attr.localName.toLowerCase()
				if( ![ 'href', 'src', 'data' ].includes( name ) ) continue
				el.setAttributeNS( attr.namespaceURI, attr.localName, uri_normal( attr.nodeValue! ) )
			}
		}
		for( const kid of dom.childNodes ) sanit( kid )
		return dom
	}
	
	export class $hyoo_sync_server extends $hyoo_sync_yard< InstanceType< $node['ws'] > > {
		
		log_pack( data: any ) {
			if( data instanceof Array ) return data.length
			return $mol_key( data )
		}
		
		@ $mol_mem
		http() {
			
			type self = this
			const server = $node.http.createServer( $mol_wire_async( function http_handler(
				this: self,
				req: InstanceType< $node['http']['IncomingMessage'] >,
				res: InstanceType< $node['http']['ServerResponse'] >,
			) {
				
				try {
				
				const world = this.world()
				
				const query_str = req.url!.slice(1)
				
				// this.$.$mol_log3_rise({
				// 	place: this,
				// 	message: 'HTTP Query',
				// 	query: req.url,
				// })
				
				if( !query_str ) {
					res.writeHead( 301, {
						'Content-Type': 'text/plain;charset=utf-8',
						'Location': '/watch/',
						'Access-Control-Allow-Origin': '*',
					} )
					res.end( '$hyoo_sync_server ' + $hyoo_sync_revision )
					return
				}
				
				if( /^(?:watch|auth)\/(?:(?:\w+\.)+\w+)?/.test( query_str ) ) {
					
					const ext = query_str.match(/\.(\w+)$/)?.[1] ?? 'html'
					
					try {
						
						const content = $node.fs.readFileSync( __dirname + '/' + query_str.replace( /\.\./g, '' ).replace( /\/$/, '/index.html' ) ).toString()
						
						res.writeHead( 200, {
							'Access-Control-Allow-Origin': '*',
							'Content-Type': {
								js: 'application/javascript',
								html: 'text/html',
							}[ ext ] ?? '',
						} )
						
						res.end( content )
						
					} catch( error: any ) {
						
						res.writeHead( 500 ).end( error.message ?? error )
							
					}
					
					return
				}
				
				const query = $hyoo_harp_from_string( query_str ) as {
					log?: {},
					land?: {
						'='?: [[ string ]],
					},
					author?: {
						'=': [[ string, string ]],
					},
					search?: {
						'='?: [[ string ]],
					},
					blob?: {
						land: $hyoo_harp_query<string>,
						head: $hyoo_harp_query<string>,
					},
				}
				
				if( query.log ) {
					
					res.writeHead( 200, {
						'Content-Type': 'text/plain;charset=utf-8',
						'Access-Control-Allow-Origin': '*',
					} )
					
					const path = this.$.$mol_state_arg.value( 'log' )
					if( !path ) return res.end( '\\Use `log` parameter to provide path to server logs in tree format\n' )
					
					res.end( $node.fs.readFileSync( path ).toString() )
					
					return
				}
				
				if( query.blob ) {
					
					const land_id = query.blob.land["="]![0][0]
					if( !land_id ) $mol_fail( new Error( 'land is required' ) )
					
					const head_id = query.blob.head["="]![0][0]
					if( !head_id ) $mol_fail( new Error( 'head is required' ) )
					
					const land = world.land( land_id )
					const node = land.node( head_id, $hyoo_crowd_blob )
					const type = node.type()
					
					res.writeHead( 200, {
						'Content-Type': type,
						'Content-Disposition': /^(image|video)\//.test( type ) ? '' : 'attachment',
						'Cache-Control': 'public, proxy-revalidate, max-age=1000', // 15min
						'Access-Control-Allow-Origin': '*',
					} )
					
					res.end( node.buffer() )
					
					return
				}
				
				if( query.author ) {
					
					const peer = $mol_int62_string_ensure( query.author["="][0][0] )
					if( !peer ) $mol_fail( new Error( 'peer id is required' ) )
					
					const lands = $mol_wire_sync( this ).db_land_peer( peer )
					
					res.writeHead( 200, {
						'Content-Type': 'application/json',
					} )
					
					res.end( JSON.stringify([ ... lands ]) )
					
					return
				}
				
				const reply = {} as Record< string, Record< string, any > >
				
				const accept = req.headers.accept ?? 'application/json'
				
				const proceed = ( data: Record< string, any >, node: $hyoo_crowd_struct, query: $hyoo_harp_query )=> {
					
					for( let fetch in query ) {
						
						if( /^!?=$/.test( fetch ) ) continue
						
						const [ _, field, type ] = fetch.match( /^(\w+)_([a-z]+)$/ ) ?? [ '', fetch, '' ]
						
						switch( type ) {
							
							case 'reg':
								data[ fetch ] = node.sub( field, $hyoo_crowd_reg ).value()
								continue
							
							case 'ref':
								
								const ids = node.sub( field, $hyoo_crowd_list ).list()
								data[ fetch ] = ids.map( id => `land=${id}=` )
								
								for( const val of ids ) {
									
									const id = $mol_int62_string_ensure( val )
									if( !id ) continue
									
									const sub = reply[ id ] = {} as Record< string, any >
									
									const param = query[ fetch ]['=']
									if( param && /^\w*$/.test( param[0]?.[0] ?? '' ) ) {
										sub[''] = `?#!${ param[0]?.[0] ?? '' }=${id}`
									}
									
									const land = world.land( id as $mol_int62_string )
									if( !land ) continue
									
									proceed( sub, land.chief, query[ fetch ] )
									
								}
								
								continue
							
							case 'list':
								data[ fetch ] = node.sub( field, $hyoo_crowd_list ).list()
								continue
							
							case 'json':
								data[ fetch ] = node.sub( field, $hyoo_crowd_json ).json()
								continue
							
							case 'text':
								data[ fetch ] = node.sub( field, $hyoo_crowd_text ).text()
								if( accept === 'text/html' ) {
									data[ fetch ] = field === 'title'
										? this.$.$mol_html_encode( data[ fetch ] )
										: this.$.$hyoo_marked_to_html( data[ fetch ] )
								}
								continue
							
							case 'html':
								const dom = node.sub( field, $hyoo_crowd_dom ).dom()
								data[ fetch ] = $mol_dom_serialize( sanit( dom ) )
								continue
							
							case 'blob':
								const blob = node.sub( field, $hyoo_crowd_blob )
								const type = blob.type()
								if( /^text\//.test( type ) ) {
									data[ fetch ] = blob.str()
									if( type === 'text/plain' && accept === 'text/html' ) {
										const dom = this.$.$hyoo_marked_to_dom( data[ fetch ] )
										data[ fetch ] = $mol_dom_serialize( sanit( dom ) )
									}
								} else {
									data[ fetch ] = `blob(land=${ blob.land.id() }=;head=${ blob.head }=)`
								}
								continue
							
							default:
								
								const item = node.sub( field, $hyoo_crowd_struct )
								const sub = data[ fetch ] = {} as Record< string, any >
								sub[''] = item.head
								
								proceed( sub, item, query[ fetch ] )
								
								continue
							
						}
						
					}
					
				}
				
				const entry = $mol_int62_string_ensure( query.land?.["="]![0][0] ?? '' )
				if( entry ) {
					
					const land = world.land( entry )
					
					reply[ entry ] = {}
					proceed( reply[ entry ], land.chief, query.land! )
					
					var response = {
						_query: {
							[ query_str ]: {
								reply: [ `land=${ entry }=` ],
							},
						},
						land: reply,
					}
					
				} else {
					
					const prefix = query.search?.["="]![0][0] ?? ''
					if( !prefix ) return res.writeHead( 404 ).end()
					
					const lands = this.land_search( prefix ).map( id => world.land( id ) )
					
					for( const land of lands ) {
						reply[ land.id() ] = {}
						proceed( reply[ land.id() ], land.chief, query.search! )
					}
					
					var response = {
						_query: {
							[ query_str ]: {
								reply: lands.map( land => `land=${ land.id() }=` ),
							},
						},
						land: reply,
					}
					
				}
				
				switch( accept ) {
					
					case 'text/html':
					
						const styles = `<style>
							
							body {
								font: 1rem/1.5rem sans-serif;
								margin: 0;
							}
							
							body > * {
								padding: .75rem;
								display: block;
							}
							
							body > * > * {
								padding: .5rem .75rem;
								display: block;
							}

       							[hidden], style {
	      							display: none;
							}
							
							section > title {
								font-size: 1.5rem;
							}
							
							h1, h2, h3, h4, h5, h6, p, pre, object {
								margin: 0;
								padding: .5rem .75rem;
								line-height: 1.5rem;
							}
							
							blockquote {
								margin: 0;
								padding: .75rem;
							}
							
							a {
								text-decoration: none;
							}
							
						</style>`
						
						let empty = true
						const html = Object.entries( reply ).flatMap( ([ id, props ])=> [
							props[''] ? `<a id="land=${id}=" href="${props['']}">` : `<section id="land=${id}=">`,
								... Object.entries( props ).flatMap( ([ name, value ])=> {
									if( !name ) return ''
									if( ''+value ) empty = false
									const tag = name.replace( /_.*$/, '' )
									return [
										Array.isArray( value ) && /^land=\w+=$/.test( value[0] )
											? `<${tag} id="land=${id}=(${name})" hidden>`
											: `<${tag} id="land=${id}=(${name})">`,
										value,
										`</${tag}>`,
									]
								} ),
							props[''] ? `</a>` : `</section>`,
						] ).join( '' )
						
						res.writeHead( empty ? 404 : 200, {
							'Content-Type': 'text/html;charset=utf-8',
							'Access-Control-Allow-Origin': '*',
						} )
						
						res.end( styles + html )
						break
					
					default:case 'application/json':
					
						res.writeHead( 200, {
							'Content-Type': 'application/json;charset=utf-8',
							'Access-Control-Allow-Origin': '*',
						} )
						res.end( JSON.stringify( response, null, '\t' ) )
						break
					
				}
				
				} catch( error: any ) {
					
					if( error instanceof Promise ) $mol_fail_hidden( error )
					
					const message = String( error.message || error )
					
					this.$.$mol_log3_fail({
						place: this,
						message,
						stack: String( error.stack || '' ),
						uri: req.url,
					})
					
					res.writeHead( 500, {
						'Access-Control-Allow-Origin': '*',
					} )
					
					res.end( message )
				}
				
			}.bind( this ) ) )
			
			server.listen( this.port() )
			
			this.$.$mol_log3_come({
				place: this,
				message: 'Server Started',
				link: 'http://0.0.0.0:' + this.port() + '/',
			})
			
			return server
		}
		
		@ $mol_memo.method
		db_link() {
			return $mol_state_arg.value( 'db' ) || process.env.DATABASE_URL
		}
		
		@ $mol_memo.method
		async db() {
			
			const link = this.db_link()
			if( !link ) return null
			
			const db = new $node.pg.Pool({
				connectionString: link,
				ssl: { rejectUnauthorized: false },
			})
			
			await db.connect()
			
			await db.query(`
				CREATE TABLE IF NOT EXISTS Unit2 (
					land varchar(16) NOT NULL, auth varchar(16) NOT NULL,
					head varchar(16) NOT NULL, self varchar(16) NOT NULL,
					next varchar(16) NOT NULL, prev varchar(16) NOT NULL,
					time int4 NOT NULL, data jsonb,
					bin bytea NOT NULL
				);
			`)
			
			await db.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS LandHeadSelf2 ON Unit2 ( land, head, self );
			`)
			
			await db.query(`
				CREATE INDEX IF NOT EXISTS Land2 ON Unit2 ( land );
			`)
			
			await db.query(`
				CREATE INDEX IF NOT EXISTS Data2 ON Unit2 USING GIN ( data );
			`)
			
			this.$.$mol_log3_rise({
				place: this,
				message: 'Base Ready',
			})
			
			return db
		}
		
		async db_land_load( land: $hyoo_crowd_land ): Promise< $hyoo_crowd_unit[] >  {
			
			const link = this.db_link()
			if( !link ) return []
			
			const db = await this.db()
			if( !db ) return []

			const res = await db.query<{ bin: Uint8Array }>(
				`SELECT bin FROM Unit2 WHERE land = $1::varchar(16)`,
				[ land.id() ],
			)
			
			const units = res.rows.map( row => {
				
				const bin = new $hyoo_crowd_unit_bin(
					row.bin.buffer,
					row.bin.byteOffset,
					row.bin.byteLength,
				)
				
				return bin.unit()
			})
			
			return units
		}
		
		async db_land_peer( peer: $mol_int62_string ) {
			
			const link = this.db_link()
			if( !link ) return new Set< $mol_int62_string >()
			
			const db = await this.db()
			if( !db ) return new Set< $mol_int62_string >()
			
			const res = await db.query<{ land: $mol_int62_string }>(
				`SELECT land, time FROM Unit2 WHERE auth = $1`,
				[ peer ],
			)
			
			return new Set< $mol_int62_string >( res.rows.map( row => row.land ) )
		}
		
		async db_land_search( from: string, to = from + '\xFF' ) {
			
			const link = this.db_link()
			if( !link ) return new Set< $mol_int62_string >()
			
			const db = await this.db()
			if( !db ) return new Set< $mol_int62_string >()
			
			const res = await db.query<{ land: $mol_int62_string }>(
				`SELECT land FROM Unit2 WHERE data::text LIKE $1::text`,
				[ `"${from}%` ],
			)
			
			return new Set< $mol_int62_string >( res.rows.map( row => row.land ) )
		}
		
		async db_land_save( land: $hyoo_crowd_land, units: readonly $hyoo_crowd_unit[] ) {
			
			const link = this.db_link()
			if( !link ) return
			
			const db = await this.db()
			if( !db ) return
			
			const tasks = units.map( unit => {
				return db.query(
					`
						INSERT INTO Unit2 VALUES(
							$1::varchar(16), $2::varchar(16),
							$3::varchar(16), $4::varchar(16),
							$5::varchar(16), $6::varchar(16),
							$7::int4, $8::jsonb,
							$9::bytea
						)
						ON CONFLICT( land, head, self ) DO UPDATE
						SET
							auth = $2::varchar(16),
							next = $5::varchar(16),
							prev = $6::varchar(16),
							time = $7::int4,
							data = $8::jsonb,
							bin = $9::bytea
						;
					`,
					[
						unit.land, unit.auth,
						unit.head, unit.self,
						unit.next, unit.prev,
						unit.time, unit.data instanceof Uint8Array ? null : JSON.stringify( unit.data ),
						Buffer.from( unit.bin!.buffer ),
					]
				)
			} )
			
			await Promise.all( tasks )
		  
		}
		
		@ $mol_mem
		server() {
			
			this.world()

			const socket = new $node.ws.Server({
				server: this.http(),
				verifyClient: ( { origin, secure, req }: { origin: string; secure: boolean; req: InstanceType< $node['http']['IncomingMessage'] > } )=> 'sec-websocket-protocol' in req.headers,
				handleProtocols: ( ways, req )=> ways.has( '$hyoo_sync_protocol_1' ) ? '$hyoo_sync_protocol_1' : false
			})

			socket.on( 'connection' , line => {

				// this.$.$mol_log3_come({
				// 	place: this,
				// 	message: 'Peer Join',
				// 	line: $mol_key( line ),
				// })
				
				this.slaves([ ... this.slaves(), line ])
				
				line.on( 'close', ()=> {
					
					this.slaves( this.slaves().filter( l => l !== line ) )
					
					// this.$.$mol_log3_done({
					// 	place: this,
					// 	message: 'Peer Lost',
					// 	line: $mol_key( line ),
					// })
						
				} )
				
				line.on( 'message', async( data, isBinary )=> {
					
					if( typeof data === 'string' ) return
					if( data instanceof Array ) return
					if( data instanceof ArrayBuffer ) return
					
					await this.line_receive( line, data )
					
				} )

			} )

			return socket
		}
		
		line_send_clocks(
			line: InstanceType< $node['ws'] >,
			land: $hyoo_crowd_land,
		) {
			line.send( land.clocks_bin, { binary: true } )
		}
		
		async line_send_units(
			line: InstanceType< $node['ws'] >,
			units: readonly $hyoo_crowd_unit[],
		) {
			await this.world().sign_units( units )
			const message = new $node.buffer.Blob( units.map( unit => unit.bin! ) ) 
			line.send( await message.arrayBuffer(), { binary: true } )
		}

		@ $mol_mem
		reconnects( reset?: null ): number {
			return ( $mol_wire_probe( ()=> this.reconnects() ) ?? 0 ) + 1
		}

		@ $mol_mem
		master_link() {
			const host = this.$.$hyoo_sync_masters[ this.master_cursor() ]
			return host
		}
		
		@ $mol_mem
		master() {
			const link = this.master_link()
			if (!link) return

			this.reconnects()

			const line = new $node['ws'].WebSocket( 'wss:' + link, '$hyoo_sync_protocol_1' )
			line.binaryType = 'arraybuffer'
			
			line.onmessage = async( event )=> {
				
				if( event.data instanceof ArrayBuffer ) {
					await this.line_receive( line, new Uint8Array( event.data ) )
				} else {
					
					this.$.$mol_log3_fail({
						place: this,
						message: 'Wrong data',
						data: event.data
					})
					
				}
				
			}
			
			let interval: any

			line.onclose = ()=> {
				clearInterval( interval )
				setTimeout( ()=> this.reconnects( null ), 1000 )
			}
			
			Object.assign( line, {
				destructor: ()=> {
					line.onclose = ()=> {}
					clearInterval( interval )
					line.close()
				}
			} )
			
			return new Promise< typeof line >( ( done, fail )=> {
				
				line.onopen = ()=> {
					
					this.$.$mol_log3_come({
						place: this,
						message: 'Connected to Master',
						line: $mol_key( line ),
						server: link,
					})
					
					interval = setInterval( ()=> line.send( new Uint8Array ), 30000 )
		
					done( line )
				}
				
				line.onerror = ()=> {
					line.onclose = event => {
						fail( new Error( `Master is unavailable (${ event.code })` ) )
					}
					clearInterval( interval )
					this.master_cursor( ( this.master_cursor() + 1 ) % this.$.$hyoo_sync_masters.length )
				}
				
			} ) as any as WebSocket
			
		}

		port() { return 0 }
		
		@ $mol_mem_key
		static port( port: number ) {
			const server = new this
			server.port = $mol_const( port )
			return server
		}
		
		@ $mol_mem_key
		static run( port: number ) {
			try {
				this.port( port ).db()
				this.port( port ).sync()
			} catch( error ) {
				$mol_fail_log( error )
			}
		}
		
	}
	
	const port = Number( $mol_state_arg.value( 'port' ) || process.env.PORT )
	const masters = $mol_state_arg.value( 'masters' )

	$.$hyoo_sync_masters = masters ? masters.split(',').map(val => val.trim()).filter(val => val) : []
	
	if( port ) $hyoo_sync_server.run( port )
	
}
