namespace $ {
	
	export class $hyoo_sync_server extends $mol_object2 {
		
		@ $mol_mem
		http() {
			
			const server = $node.http.createServer( ( req, res )=> {
				res.writeHead( 200, { 'Content-Type': 'text/plain' } )
				res.end( 'Hello World!' )
			} )
			
			server.listen( this.port() )
			
			console.log( 'Server started http://localhost:' + this.port() + '/' )
			
			return server
		}
		
		lines = new Set< InstanceType< $node['ws'] > >()
		
		@ $mol_mem_key
		line_clocks( { line, land }: {
			line: InstanceType< typeof $node.ws.WebSocket >,
			land: $mol_int62_pair,
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
				
				line.on( 'message', async( message, isBinary )=> {
					
					if( !isBinary ) return
					if( message instanceof Array ) return
					
					const data = new Int32Array( new Uint8Array( message ).buffer )
					
					if( data[0] << 1 >> 1 ^ data[0] ) {
						
						const line_bin = new $hyoo_crowd_clock_bin( data.buffer )
						const land = this.world().land( line_bin.land() )
						const line_clocks = this.line_clocks({ line, land: land.id() })
	
						line_clocks[ $hyoo_crowd_unit_group.auth ].see_bin( line_bin, $hyoo_crowd_unit_group.auth )
						line_clocks[ $hyoo_crowd_unit_group.data ].see_bin( line_bin, $hyoo_crowd_unit_group.data )
						
						const self_bin = $hyoo_crowd_clock_bin.from( land.id(), land._clocks )
						line.send( self_bin, { binary: true } )
						
						this.$.$mol_log3_come({
							place: this,
							message: 'Sync Start',
							line: $mol_key( line ),
							land: $mol_int62_to_string( land.id() ),
						})
						
						const delta = await this.world().delta_land( land, line_clocks )
						
						for( const unit of delta ) {
							line.send( unit.bin!, { binary: true } )
						}
						
						return
					}
						
					const bin = new $hyoo_crowd_unit_bin( data.buffer )
					const unit = bin.unit()
					let error
					
					// Serialize units handling
					while( line.isPaused ) {
						await new Promise( done => setTimeout( done ) )
					}

					line.pause()
					try {
						error = await this.world().apply_unit( unit )
					} finally {
						line.resume()
					}

					if( error ) {
						
						this.$.$mol_log3_fail({
							place: this,
							message: error,
							line: $mol_key( line ),
							unit: {
								kind: $hyoo_crowd_unit_kind[ unit.kind() ],
								land: $mol_int62_to_string( unit.land() ),
								auth: $mol_int62_to_string( unit.auth() ),
								head: $mol_int62_to_string( unit.head() ),
								self: $mol_int62_to_string( unit.self() ),
								next: $mol_int62_to_string( unit.next() ),
								prev: $mol_int62_to_string( unit.prev() ),
								time: unit.time,
							},
						})
						return
						
					}
					
					const land = this.world().land( unit.land() )
					const line_clocks = this.line_clocks({ line, land: land.id() })
					
					const clock = line_clocks[ unit.group() ]
					clock.see_peer( unit.auth(), unit.time )
					
					// this.$.$mol_log3_rise({
					// 	place: this,
					// 	message: 'Come',
					// 	line: $mol_key( line ),
					// 	unit: {
					// 		kind: $hyoo_crowd_unit_kind[ unit.kind() ],
					// 		land: $mol_int62_to_string( unit.land() ),
					// 		auth: $mol_int62_to_string( unit.auth() ),
					// 		head: $mol_int62_to_string( unit.head() ),
					// 		self: $mol_int62_to_string( unit.self() ),
					// 		next: $mol_int62_to_string( unit.next() ),
					// 		prev: $mol_int62_to_string( unit.prev() ),
					// 		time: unit.time,
					// 	},
					// })

					for( const other of this.lines ) {
						if( line === other ) continue
						const other_clocks = this.line_clocks({ line: other, land: land.id() })
						if( other_clocks[ unit.group() ].fresh( unit.auth(), unit.time ) ) {
							other.send( message, { binary: true } )
						}
					}
					
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
	if( port ) $hyoo_sync_server/***/.run( port )
	
}
