namespace $ {
	
	export class $hyoo_sync_server extends $mol_object2 {
		
		@ $mol_mem
		http() {
			
			const server = $node.http.createServer( ( req, res )=> {
				
				const world = this.world()
				
				const query_str = req.url!.slice(1)
				
				this.$.$mol_log3_come({
					place: this,
					message: 'HTTP Query',
					query: query_str,
				})
				
				const query = $hyoo_harp_from_string( query_str )
				if( !query.land ) {
					res.writeHead( 200, {
						'Content-Type': 'text/plain;charset=utf-8',
						'Access-Control-Allow-Origin': '*',
					} )
					res.end( '$hyoo_sync_server ✅' + $hyoo_crowd_test )
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
								data[ fetch ] = node.sub( field, $hyoo_crowd_html ).html()
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
				
			} )
			
			server.listen( this.port() )
			
			console.log( 'Server started http://localhost:' + this.port() + '/' )
			
			return server
		}
		
		lines = new Set< InstanceType< $node['ws'] > >()
		
		@ $mol_mem_key
		line_clocks( { line, land }: {
			line: InstanceType< typeof $node.ws.WebSocket >,
			land: $mol_int62_string,
		} ) {
			return [
				new $hyoo_crowd_clock,
				new $hyoo_crowd_clock,
			] as const
		}
		
		@ $mol_mem
		socket() {

			const socket = new $node.ws.Server({
				server : this.http() ,
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

			socket.on( 'connection' , line => {

				this.$.$mol_log3_come({
					place: this,
					message: 'Peer join',
					line: $mol_key( line ),
				})
				
				this.lines.add( line )
				
				line.on( 'close', ()=> {
					this.$.$mol_log3_done({
						place: this,
						message: 'Peer leave',
						line: $mol_key( line ),
					})	
				} )
				
				const necks = new Map< $mol_int62_string, Promise<any> >()
				
				line.on( 'message', async( message )=> {
					
					if( typeof message === 'string' ) return
					if( message instanceof Array ) return
					
					const data8 = new Uint8Array( message )
					const data32 = new Int32Array( data8.buffer )
					
					const land_id = $mol_int62_to_string({
						lo: data32[0] << 1 >> 1,
						hi: data32[1] << 1 >> 1,
					})
						
					const handle = async( prev?: Promise<any> )=> {
						
						if( prev ) await prev
						
						if( data32[0] << 1 >> 1 ^ data32[0] ) {
							
							const line_bin = new $hyoo_crowd_clock_bin( data32.buffer )
							const land = this.world().land( land_id )
							const line_clocks = this.line_clocks({ line, land: land_id })
		
							line_clocks[ $hyoo_crowd_unit_group.auth ].see_bin( line_bin, $hyoo_crowd_unit_group.auth )
							line_clocks[ $hyoo_crowd_unit_group.data ].see_bin( line_bin, $hyoo_crowd_unit_group.data )
							
							const self_bin = $hyoo_crowd_clock_bin.from( land.id(), land._clocks )
							line.send( self_bin, { binary: true } )
							
							this.$.$mol_log3_come({
								place: this,
								message: 'Sync Start',
								line: $mol_key( line ),
								land: land_id,
							})
							
							for await( const batch of this.world().delta_batch( land, line_clocks ) ) {
								line.send( batch, { binary: true } )
							}
							
							return
						}
							
						const { allow, forbid } = await this.world().apply( data8 )
						
						for( const [ unit, error ] of forbid ) {
							
							this.$.$mol_log3_fail({
								place: this,
								message: error,
								line: $mol_key( line ),
								unit: {
									kind: $hyoo_crowd_unit_kind[ unit.kind() ],
									land: unit.land,
									auth: unit.auth,
									head: unit.head,
									self: unit.self,
									next: unit.next,
									prev: unit.prev,
									time: unit.time,
								},
							})
							
						}
								
						if( !allow.length ) return
								
						const land = this.world().land( allow[0].land )
						const line_clocks = this.line_clocks({ line, land: land.id() })
						
						for( const unit of allow ) {
							line_clocks[ unit.group() ].see_peer( unit.auth, unit.time )
						}
						
						this.$.$mol_log3_done({
							place: this,
							message: 'Come',
							line: $mol_key( line ),
							land: land.id(),
							units: allow.length
						})
					
						for( const other of this.lines ) {
							if( line === other ) continue
							other.send( message, { binary: true } )
						}
						
						// for( const other of this.lines ) {
						// 	if( line === other ) continue
						// 	const other_clocks = this.line_clocks({ line: other, land: land.id() })
						// 	if( other_clocks[ unit.group() ].fresh( unit.auth, unit.time ) ) {
						// 		other.send( message, { binary: true } )
						// 	}
						// }
						
					}
					
					necks.set( land_id, handle( necks.get( land_id ) ) )
					
				} )

			} )

			return socket

		}
		
		@ $mol_mem
		world() {
			return new $hyoo_crowd_world
		}

		port() { return 0 }
		
		static run( port: number ) {
			const server = new this
			server.port = $mol_const( port )
			server.socket()
			return server
		}
		
	}
	
	let port = Number( process.env.PORT || $mol_state_arg.value( 'port' ) )
	if( port ) $hyoo_sync_server.run( port )
	
}
