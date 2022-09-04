namespace $ {
	export abstract class $hyoo_sync_yard< Line > extends $mol_object2 {
		
		log_pack( data: any ) {
			return data
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
			world.land_init = land => this.land_sync( land )
			return world
		}
		
		@ $mol_mem_key
		land( id: $mol_int62_string ) {
			return this.world().land_sync( id )
		}
		
		land_grab(
			king_level = $hyoo_crowd_peer_level.law,
			base_level = $hyoo_crowd_peer_level.get,
		) {
			return $mol_wire_sync( this.world() ).grab( king_level, base_level )
		}
		
		home() {
			return this.land( this.peer().id )
		}
		
		
		@ $mol_mem
		sync() {
			
			for( const land of this.world().lands.values() ) {
				this.db_land_sync( land )
			}
			
			const master = this.master()
			if( master ) $mol_wire_race(
				... [ ... this.world().lands.values() ].map( land =>
					()=> this.line_land_sync({ line: master, land })
				)
			)
			
			$mol_wire_race(
				... this.slaves().map( line =>
					()=> this.line_sync( line )
				)
			)
			
		}
		
		@ $mol_mem_key
		land_sync( land: $hyoo_crowd_land ) {
			
			this.db_land_init( land )
			
			try {
				this.db_land_sync( land )
			} catch( error ) {
				$mol_fail_log( error )
			}
			
			try {
				const master = this.master()
				if( master ) this.line_land_sync({ line: master, land })
			} catch( error ) {
				$mol_fail_log( error )
			}
			
			try {
				$mol_wire_race(
					... this.slaves()
						.filter( line => this.line_lands( line ).includes( land ) )
						.map( line => ()=> this.line_land_sync({ line, land }) )
				)
			} catch( error ) {
				$mol_fail_log( error )
			}
			
		}
		
		
		@ $mol_mem_key
		db_land_clocks(
			land: $mol_int62_string,
			next?: readonly[ $hyoo_crowd_clock, $hyoo_crowd_clock ],
		) {
			return next
		}
		
		@ $mol_mem_key
		db_land_sync( land: $hyoo_crowd_land ) {
			
			this.db_land_init( land )
			
			const db_clocks = this.db_land_clocks( land.id() )!
			land.clocks
			// const ahead = land.clocks.some( ( land_clock, i )=> land_clock.ahead( db_clocks[i] ) )
			// if( !ahead ) return
			
			const units = $mol_wire_sync( this.world() ).delta_land( land, db_clocks )
			if( !units.length ) return
			
			$mol_wire_sync( this ).db_land_save( land, units )
			
			for( const unit of units ) {
				db_clocks[ unit.group() ].see_peer( unit.auth, unit.time )
			}
			
			this.$.$mol_log3_rise({
				place: this,
				land: land.id(),
				message: 'Base Save',
				units: this.log_pack( units ),
			})
			
		}
		
		@ $mol_mem_key
		db_land_init( land: $hyoo_crowd_land ) {

			const units = $mol_wire_sync< $hyoo_sync_yard< Line > >( this ).db_land_load( land )
			units.sort( $hyoo_crowd_unit_compare )

			const clocks = [ new $hyoo_crowd_clock, new $hyoo_crowd_clock ] as const
			this.db_land_clocks( land.id(), clocks )
			
			land.apply( units )
			
			for( const unit of units ) {
				clocks[ unit.group() ].see_peer( unit.auth, unit.time )
			}
			
			this.$.$mol_log3_rise({
				place: this,
				land: land.id(),
				message: 'Base Load',
				units: this.log_pack( units ),
			})
			
		}
		
		abstract db_land_load( land: $hyoo_crowd_land ): Promise< $hyoo_crowd_unit[] >
		abstract db_land_save( land: $hyoo_crowd_land, units: readonly $hyoo_crowd_unit[] ): void
		
		master() {
			return null as Line | null
		}
		
		@ $mol_mem
		slaves( next = [] as readonly Line[] ) {
			return next
		}

		@ $mol_mem_key
		line_lands( line: Line, next = [] as $hyoo_crowd_land[] ) {
			return next
		}
		
		@ $mol_mem_key
		line_land_clocks(
			{ line, land }: {
				line: Line,
				land: $hyoo_crowd_land,
			},
			next?: readonly[ $hyoo_crowd_clock, $hyoo_crowd_clock ]
		) {
			return next
		}
		
		@ $mol_mem_key
		line_sync( line: Line ) {
			
			$mol_wire_race(
				... this.line_lands( line ).map( land =>
					()=> this.line_land_sync({ line, land })
				)
			)
			
		}
		
		@ $mol_mem_key
		line_land_sync( { line, land }: {
			line: Line,
			land: $hyoo_crowd_land,
		} ) {
			
			this.line_land_init({ line, land })
			
			let clocks = this.line_land_clocks({ line, land })
			if( !clocks ) return
			
			const packs = $mol_wire_sync( this.world() ).delta_batch( land, clocks )
			
			for( const pack of packs ) {
				
				this.line_send( line, pack )
				
				this.$.$mol_log3_rise({
					place: this,
					land: land.id(),
					message: 'Sync Sent',
					line: $mol_key( line ),
					batch: pack.length,
				})
				
			}
			
			for( let i = 0; i < clocks?.length; ++i ) {
				clocks[i].sync( land.clocks[i] )
			}
			
		}

		@ $mol_mem_key
		line_land_init( { line, land }: {
			line: Line,
			land: $hyoo_crowd_land,
		} ) {
			
			this.db_land_init( land )
			
			// const lands = this.line_land_clocks({ line, land })
			// if( lands ) return
			
			const clocks = land._clocks
			const bin = $hyoo_crowd_clock_bin.from( land.id(), clocks )
			
			this.line_send( line, new Uint8Array( bin.buffer ) )
			
			this.$.$mol_log3_come({
				place: this,
				land: land.id(),
				message: 'Sync Open',
				line: $mol_key( line ),
				clocks,
			})
			
		}
		
		@ $mol_mem_key
		line_land_neck(
			{ line, land }: {
				line: Line,
				land: $hyoo_crowd_land,
			},
			next = [] as Promise<any>[],
		) {
			return next
		}
		
		async line_receive( line: Line, message: Uint8Array ) {
			
			const view = new DataView( message.buffer, message.byteOffset, message.byteLength )
			const int0 = view.getInt32( 0, true )
			const int1 = view.getInt32( 4, true )
			
			const land_id = $mol_int62_to_string({
				lo: int0 << 1 >> 1,
				hi: int1 << 1 >> 1,
			})
			
			const world = this.world()
			const land = await $mol_wire_async<$hyoo_sync_yard< Line >>( this ).land( land_id )
			
			let clocks = this.line_land_clocks({ line, land })!
			if( !clocks ) this.line_land_clocks(
				{ line, land },
				clocks = [ new $hyoo_crowd_clock, new $hyoo_crowd_clock ],
			)
			
			if( int0 << 1 >> 1 ^ int0 ) {
				
				const bin = new $hyoo_crowd_clock_bin( message.buffer, message.byteOffset, message.byteLength )
				
				for( let group = 0; group < clocks.length; ++group ) {
					clocks[ group ].see_bin( bin, group )
				}
				
				const lands = this.line_lands( line )
				if( lands.includes( land ) ) {
					
					this.$.$mol_log3_warn({
						place: this,
						land: land.id(),
						message: 'Already syncing',
						hint: 'Bug at $hyoo_sync_yard',
						line: $mol_key( line ),
						clocks,
					})
					
				} else {
					
					this.line_lands( line, [ ... lands, land ] )
					
					this.$.$mol_log3_done({
						place: this,
						land: land.id(),
						message: 'Sync Pair',
						line: $mol_key( line ),
						clocks,
					})
					
				}
				
				return
			}
		
			const handle = async( prev?: Promise<any> )=> {
				
				if( prev ) await prev
				
				const { allow, forbid } = await world.apply( message )
				
				for( const [ unit, error ] of forbid ) {
					
					this.$.$mol_log3_fail({
						place: this,
						land: land.id(),
						message: error,
						line: $mol_key( line ),
						unit,
					})
					
				}
				
				if( !allow.length ) return
				
				for( const unit of allow ) {
					clocks[ unit.group() ].see_peer( unit.auth, unit.time )
				}
					
				this.$.$mol_log3_rise({
					place: this,
					land: land.id(),
					message: 'Sync Gain',
					line: $mol_key( line ),
					units: this.log_pack( allow ),
				})
					
			}
			
			this.line_land_neck(
				{ line, land },
				[ handle(
					await this.line_land_neck({ line, land })[0]
				) ],
			)

		} 
		
		abstract line_send( line: Line, message: Uint8Array ): void
		
		[ $mol_dev_format_head ]() {
			return $mol_dev_format_native( this )
		}
		
	}
}
