namespace $ {
	
	export class $hyoo_sync_server extends $hyoo_sync_yard< InstanceType< $node['ws'] > > {
		
		log_pack( data: any ) {
			if( data instanceof Array ) return data.length
			return $mol_key( data )
		}
		
		@ $mol_mem
		http() {
			
			const server = $node.http.createServer( $mol_wire_async( (
				req: InstanceType< $node['http']['IncomingMessage'] >,
				res: InstanceType< $node['http']['ServerResponse'] >,
			)=> {
				
				const world = this.world()
				
				const query_str = req.url!.slice(1)
				
				// this.$.$mol_log3_rise({
				// 	place: this,
				// 	message: 'HTTP Query',
				// 	query: req.url,
				// })
				
				if( /^(?:watch|auth)\/(?:(?:\w+\.)+\w+)?/.test( query_str ) ) {
					
					const ext = query_str.match(/\.(\w+)$/)?.[1] ?? ''
					
					try {
						
						const content = $node.fs.readFileSync( __dirname + '/' + query_str.replace( /\/$/, '/index.html' ) ).toString()
						
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
				
				const query = $hyoo_harp_from_string( query_str ) as $hyoo_harp_query<string> & {
					blob: {
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
				
				if( !query.land ) {
					res.writeHead( 200, {
						'Content-Type': 'text/plain;charset=utf-8',
						'Access-Control-Allow-Origin': '*',
					} )
					res.end( '$hyoo_sync_server ' + $hyoo_sync_revision )
					return
				}
				
				const entry = query.land["="]![0][0]
				const land = world.land( entry )
				
				const reply = {
					[ entry ]: {}
				}
				
				function proceed( data: {}, node: $hyoo_crowd_struct, query: $hyoo_harp_query ) {
					
					for( let fetch in query ) {
						
						if( /^!?=$/.test( fetch ) ) continue
						
						const [ _, field, type ] = fetch.match( /^(\w+)_([a-z]+)$/ ) ?? [ '', fetch, '' ]
						if( !type ) continue
						
						switch( type ) {
							
							case 'reg':
								data[ fetch ] = node.sub( field, $hyoo_crowd_reg ).value()
								continue
							
							case 'ref':
								
								const id = node.sub( field, $hyoo_crowd_reg ).value()
								
								if( typeof id !== 'string' ) {
									data[ fetch ] = null
									continue
								}
								
								const sub = reply[ id ] = {}
								
								const land = world.land( id as $mol_int62_string )
								if( !land ) continue
								
								proceed( sub, land.chief, query[ fetch ] )
								
								continue
							
							case 'list':
								data[ fetch ] = node.sub( field, $hyoo_crowd_list ).list()
								continue
							
							case 'json':
								data[ fetch ] = node.sub( field, $hyoo_crowd_json ).json()
								continue
							
							case 'text':
								data[ fetch ] = node.sub( field, $hyoo_crowd_text ).text()
								continue
							
							case 'html':
								data[ fetch ] = node.sub( field, $hyoo_crowd_dom ).html()
								continue
							
						}
						
					}
					
				}
				
				proceed( reply[ entry ], land.chief, query.land )
				
				const response = {
					_query: {
						[ query_str ]: {
							reply: [ `land=${ entry }` ],
						},
					},
					land: reply,
				}
				
				res.writeHead( 200, {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				} )
				res.end( JSON.stringify( response, null, '\t' ) )
				
			} ) )
			
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
				server : this.http() ,
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
			const bin = $hyoo_crowd_clock_bin.from( land.id(), land._clocks )
			line.send( new Uint8Array( bin.buffer ), { binary: true } )
		}
		
		async line_send_units(
			line: InstanceType< $node['ws'] >,
			units: readonly $hyoo_crowd_unit[],
		) {
			await this.world().sign_units( units )
			const message = new $node.buffer.Blob( units.map( unit => unit.bin! ) ) 
			line.send( await message.arrayBuffer(), { binary: true } )
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
	
	let port = Number( $mol_state_arg.value( 'port' ) || process.env.PORT )
	if( port ) $hyoo_sync_server.run( port )
	
}
