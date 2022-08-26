namespace $ {
	
	export class $hyoo_sync_client extends $mol_object2 {
		
		@ $mol_mem
		db() {
			return $mol_wire_sync( this as $hyoo_sync_client ).db_init()
		}
		
		async db_init() {
			
			type Scheme = {
				Unit: {
					//     land,              head,              self
					Key: [ $mol_int62_string, $mol_int62_string, $mol_int62_string ]
					Doc: $hyoo_crowd_unit
					Indexes: {
						//      land
						Land: [ $mol_int62_string ]
					}
				}
			}
			
			const db1 = await this.$.$mol_db< Scheme >( '$hyoo_sync_client_db' )
			await db1.kill()
			
			return await this.$.$mol_db< Scheme >( '$hyoo_sync_client_db2',
				mig => mig.store_make( 'Unit' ),
				mig => mig.stores.Unit.index_make( 'Land', [ 'land' ] ),
			)
			
		}
		
		server() {
			// return `ws://localhost:9090/`
			// return $mol_dom_context.document.location.origin.replace( /^\w+:/ , 'ws:' )
			return `wss://sync.hyoo.ru/`
		}
		
		@ $mol_mem_key
		db_clocks(
			land: $mol_int62_string,
			next = null as null | readonly[ $hyoo_crowd_clock, $hyoo_crowd_clock ],
		) {
			$mol_wire_solid()
			return next
		}
		
		@ $mol_mem_key
		server_clocks(
			land: $mol_int62_string,
			next = null as null | readonly [ $hyoo_crowd_clock, $hyoo_crowd_clock ]
		) {
			return next
		}
		
		@ $mol_mem
		peer() {
			
			const path = this + '.peer()'
			
			let serial = this.$.$mol_state_local.value( path ) as null | { public: string, private: string }
			if( serial ) {
				
				return $mol_wire_sync( $hyoo_crowd_peer ).restore(
					$mol_base64_decode( serial.public ),
					$mol_base64_decode( serial.private ),
				)

			} else {
			
				const peer = $mol_wire_sync( $hyoo_crowd_peer ).generate()
				
				serial = {
					public: $mol_base64_encode( peer.key_public_serial ),
					private: $mol_base64_encode( peer.key_private_serial ),
				}
				
				this.$.$mol_state_local.value( path, serial )
				
				return peer
			}
			
		}
		
		@ $mol_mem
		world() {
			const world = new this.$.$hyoo_crowd_world( this.peer() )
			world.land_init = land => this.land_init( land )
			return world
		}
		
		@ $mol_mem
		request_done( next?: ( res: unknown )=> void ) {
			return ( res: unknown )=> {}
		}
		
		@ $mol_mem_key
		land_init( land: $mol_int62_string ) {
			$mol_wire_solid()
			$mol_wire_sync( this ).db_load( land )
			// this.server_init( land.id )
		}
		
		@ $mol_mem
		sync() {
			$mol_wire_race(
				()=> this.db_sync(),
				()=> this.server_sync(),
			)
		}
		
		async db_load( land_id: $mol_int62_string ) {
			
			const db = this.db()
			const Unit = db.read( 'Unit' ).Unit
			
			const recs = await Unit.indexes.Land.select([ land_id ])
			if( !recs ) return
			
			const units = recs.map( rec => {
				return new $hyoo_crowd_unit(
					rec.land, rec.auth,
					rec.head, rec.self,
					rec.next, rec.prev,
					rec.time, rec.data,
					new $hyoo_crowd_unit_bin( rec.bin!.buffer ),
				)
			} )
			units.sort( $hyoo_crowd_unit_compare )
			
			// const world = this.world()
			// let clocks = this.db_clocks( land_id )
			
			// const queue = units.slice().reverse()
			
			
			// const apply = async( unit: $hyoo_crowd_unit )=> {
				
			// 	const error = await world.apply_unit( unit )
					
			// 	if( error ) {
			// 		this.$.$mol_log3_fail({
			// 			place: this,
			// 			message: error,
			// 			unit,
			// 		})
			// 	} else {
			// 		clocks[ unit.group() ].see_peer( unit.auth(), unit.time )
			// 	}
				
			// }
			
			// while( queue.length ) {
				
			// 	const unit = queue.pop()!
				
			// 	if( unit.group() === $hyoo_crowd_unit_group.auth ) {
			// 		await apply( unit )
			// 		continue
			// 	} else {
			// 		await Promise.allSettled( queue.map( apply ) )
			// 		break
			// 	}
				
			// }
			
			const clocks = [ new $hyoo_crowd_clock, new $hyoo_crowd_clock ] as const
			this.db_clocks( land_id, clocks )
			
			const land = this.world()._lands.get( land_id )!
			land.apply( units )
			
			for( const unit of units ) {
				clocks[ unit.group() ].see_peer( unit.auth, unit.time )
			}
			
			this.$.$mol_log3_done({
				place: this,
				message: 'DB Load',
				land: land_id,
				units,
			})
			
		}
		
		@ $mol_mem
		db_sync() {
			
			this.db()
			
			for( const land of this.world().lands.values() ) {
				
				const land_clocks = land.clocks
				
				const db_clocks = this.db_clocks( land.id() )
				
				if( db_clocks ) {
					const ahead = land_clocks.some( ( land_clock, i )=> land_clock.ahead( db_clocks[i] ) )
					if( !ahead ) continue
				}
				
				try {
					$mol_wire_sync( this ).db_save( land )
				} catch( error ) {
					$mol_fail_log( error )
				}
				
			}
			
		}
		
		async db_save( land: $hyoo_crowd_land ) {
			
			const clocks = this.db_clocks( land.id() )!
			
			const units = [] as $hyoo_crowd_unit[]
			for( const unit of await this.world().delta_land( land, clocks ) ) {
				units.push( unit )
			}
			
			if( units.length === 0 ) return null
			
			const db = this.db()
			const trans = db.change( 'Unit' )
			const Unit = trans.stores.Unit
			
			for( const unit of units ) {
				Unit.put( unit, [ unit.land, unit.head, unit.self ] )
			}
			
			for( const [ index, clock ] of Object.entries( clocks ) ) {
				clock.sync( land.clocks[ index ] )
			}
			
			await trans.commit()
			
			this.$.$mol_log3_done({
				place: this,
				message: 'DB Save',
				land: land.id(),
				units,
			})
			
			return null
		}
		
		@ $mol_mem
		server_sync() {
			
			// this.socket()
			
			for( const land of this.world().lands.values() ) {
				
				try {
				
					this.land_init( land.id() )
					this.server_init( land.id() )
					
					const server_clocks = this.server_clocks( land.id() )
					const land_clocks = land.clocks

					if( server_clocks ) {
						const ahead = land_clocks.some( ( land_clock, i )=> land_clock.ahead( server_clocks[i] ) )
						if( !ahead ) continue
						$mol_wire_sync( this ).server_send( land )
					}
				
				} catch( error ) {
					$mol_fail_log( error )
				}
				
			}

		}
		
		@ $mol_mem_key
		server_init( land: $mol_int62_string ) {
			
			$mol_wire_solid()
			
			const socket = this.socket()
			const clocks = this.world()._lands.get( land )!._clocks
			const bin = $hyoo_crowd_clock_bin.from( land, clocks )
			
			socket.send( bin )
			
			this.$.$mol_log3_come({
				place: this,
				message: 'Sync Ask',
				land,
				clocks,
			})
			
		}
		
		async server_send( land: $hyoo_crowd_land ) {
			
			const socket = this.socket()
			
			let clocks = this.server_clocks( land.id() )!
			
			const delta = await this.world().delta_land( land, clocks )
			
			for( const unit of delta ) {
				socket.send( unit.bin! )
			}
			
			this.$.$mol_log3_rise({
				place: this,
				message: 'Send',
				land: land.id(),
				delta,
			})
			
			for( let i = 0; i < clocks?.length; ++i ) {
				clocks[i].sync( land.clocks[i] )
			}
			
		}
		
		grab(
			king_level = $hyoo_crowd_peer_level.law,
			base_level = $hyoo_crowd_peer_level.get,
		) {
			return $mol_wire_sync( this.world() ).grab( king_level, base_level )
		}
		
		@ $mol_mem_key
		land( id: $mol_int62_string ) {
			return this.world().land_sync( id )
		}
		
		@ $mol_action
		file(
			reg: $hyoo_crowd_reg,
			king_level = $hyoo_crowd_peer_level.law,
			base_level = $hyoo_crowd_peer_level.get,
		) {
			
			let land_id = reg.value() as $mol_int62_string | null
			if( land_id ) return this.land( land_id )
			
			const land = this.grab( king_level, base_level )
			reg.value( land.id() )
			return land
			
		}
		
		@ $mol_mem
		socket( reset?: null ) {
			return $mol_wire_sync( this ).socket_connect() as WebSocket
		}
		
		socket_connect() {
			
			// this.heartbeat()
			
			const world = this.world()
			const socket = new $mol_dom_context.WebSocket( this.server() )
			socket.binaryType = 'arraybuffer'
			
			const necks = new Map< $mol_int62_string, Promise<any> >()
			
			socket.onmessage = event => {
				
				const message = event.data
				if(!( message instanceof ArrayBuffer )) {
					this.$.$mol_log3_fail({
						place: this,
						message: 'Wrong data',
						data: message
					})
					return
				}
				
				const data = new Int32Array( message )
				const land_id = $mol_int62_to_string({
					lo: data[0] << 1 >> 1,
					hi: data[1] << 1 >> 1,
				})
				
				if( data[0] << 1 >> 1 ^ data[0] ) {
						
					const bin = new $hyoo_crowd_clock_bin( data.buffer )
					
					let clocks = [ new $hyoo_crowd_clock, new $hyoo_crowd_clock ] as const
					this.server_clocks( land_id, clocks )
					
					clocks[ $hyoo_crowd_unit_group.auth ].see_bin( bin, $hyoo_crowd_unit_group.auth )
					clocks[ $hyoo_crowd_unit_group.data ].see_bin( bin, $hyoo_crowd_unit_group.data )
					
					this.$.$mol_log3_done({
						place: this,
						message: 'Sync Ans',
						land: land_id,
						clocks,
					})
					
					return
				}
			
				const handle = async( prev?: Promise<any> )=> {
					
					if( prev ) await prev
					
					const bin = new $hyoo_crowd_unit_bin( data.buffer )
					const unit = bin.unit()
					
					const error = await world.apply_unit( unit )
					if( error ) {
						
						this.$.$mol_log3_fail({
							place: this,
							message: error,
							land: unit.land,
							unit,
						})
						
					} else {
						
						let clocks = this.server_clocks( unit.land )
						if( clocks ) {
							const clock = clocks[ unit.group() ]
							clock.see_peer( unit.auth, unit.time )
						}
						
						this.$.$mol_log3_rise({
							place: this,
							message: 'Come Unit',
							land: unit.land,
							unit,
						})
						
					}
						
				}
				
				necks.set( land_id, handle( necks.get( land_id ) ) )
				
			}

			socket.onclose = ()=> {
				setTimeout( $mol_wire_async( ()=> this.socket( null ) ), 5000 )
			}
			
			return new Promise< typeof socket >( done => socket.addEventListener( 'open', ()=> done( socket ) ) )
		}
		
		// @ $mol_mem
		// heartbeat() {
			
		// 	const timer = setInterval( ()=> {
		// 		const socket = this.socket()
		// 		if( socket.readyState !== socket.OPEN ) return
		// 		socket.send('')
		// 	}, 30000 )
			
		// 	return {
		// 		destructor: ()=> clearInterval( timer )
		// 	}
			
		// }
		
		// @ $mol_action
		// send( key: string, next?: readonly $hyoo_crowd_unit[] ) {
			
		// 	const socket = this.socket()
		// 	$mol_wire_sync( this ).wait_connection()
			
		// 	if( socket.readyState !== socket.OPEN ) return
			
		// 	const message = next === undefined ? [ key ] : [ key, ... next ]
		// 	socket.send( JSON.stringify( message ) )
			
		// }
		
		// wait_connection() {
		// 	const socket = this.socket()
		// 	if( socket.readyState !== socket.CONNECTING ) return
		// 	return new Promise( done => socket.addEventListener( 'open', done ) )
		// }
		
		[ $mol_dev_format_head ]() {
			return $mol_dev_format_native( this )
		}
		
	}
	
}
