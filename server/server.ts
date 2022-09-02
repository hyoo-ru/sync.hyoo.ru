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
					res.end( '$hyoo_sync_server ✅✅' )
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
				
			} ) )
			
			server.listen( this.port() )
			
			console.log( 'Server started http://localhost:' + this.port() + '/' )
			
			return server
		}
		
		async db_land_load( land: $hyoo_crowd_land ): Promise< readonly $hyoo_crowd_unit[] >  {
			return []
		}
		
		async db_land_save( land: $hyoo_crowd_land, units: readonly $hyoo_crowd_unit[] ) {
			
		}
		
		@ $mol_mem
		socket() {
			
			this.world()

			const socket = new $node.ws.Server({
				server : this.http() ,
			})

			socket.on( 'connection' , line => {

				this.$.$mol_log3_come({
					place: this,
					message: 'Peer Join',
					line: $mol_key( line ),
				})
				
				this.slaves([ ... this.slaves(), line ])
				
				line.on( 'close', ()=> {
					
					this.slaves( this.slaves().filter( l => l !== line ) )
					
					this.$.$mol_log3_done({
						place: this,
						message: 'Peer Lost',
						line: $mol_key( line ),
					})
						
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
		
		line_send( line: InstanceType< $node['ws'] >, message: Uint8Array ) {
			line.send( message, { binary: true } )
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
				this.port( port ).socket()
				this.port( port ).sync()
			} catch( error ) {
				$mol_fail_log( error )
			}
		}
		
	}
	
	let port = Number( process.env.PORT || $mol_state_arg.value( 'port' ) )
	if( port ) $hyoo_sync_server.run( port )
	
}
