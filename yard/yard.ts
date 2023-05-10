namespace $ {
	export class $hyoo_sync_yard< Line > extends $mol_object2 {
		
		db_unit_persisted = new WeakSet< $hyoo_crowd_unit >()
		
		log_pack( data: any ) {
			return data
		}
		
		@ $mol_mem
		peer() {
			return $mol_wire_sync( $hyoo_sync_peer )( this + '.peer()' )
		}
		
		@ $mol_mem
		world() {
			$mol_wire_solid()
			const world = new this.$.$hyoo_crowd_world( this.peer() )
			world.land_init = land => this.land_init( land )
			return world
		}
		
		@ $mol_mem_key
		land_init( land: $hyoo_crowd_land ) {
			this.db_land_init( land )
			
			try {
				this.db_land_sync( land )
			} catch( error ) {
				$mol_fail_log( error )
			}
			
			if( !land.grabbed() ) this.$.$mol_wait_timeout( 10_000 )
		}
		
		land( id: $mol_int62_string ) {
			return this.world().land_sync( id )
		}
		
		land_grab(
			law = [''] as readonly ( $mol_int62_string | '' )[],
			mod = [] as readonly ( $mol_int62_string | '' )[],
			add = [] as readonly ( $mol_int62_string | '' )[],
		) {
			return $mol_wire_sync( this.world() ).grab( law, mod, add )
		}
		
		home() {
			return this.land( this.peer().id )
		}
		
		@ $mol_action
		land_search( query: string ) {
			
			const stat = new Map< $mol_int62_string, number >()
			
			for( const prefix of query.match( /\p{Letter}{2,}/gu ) ?? [] ) {
				
				const caps = prefix.slice( 0, 1 ).toUpperCase() + prefix.slice( 1 )
				const prefs = new Set< string >([
					caps, ' ' + caps,
					prefix, ' ' + prefix,
				])
				
				const lands = new Set< $mol_int62_string >()
				
				const founds = $mol_wire_race(
					... [ ... prefs ].map(
						pref => ()=> $mol_wire_sync( this as $hyoo_sync_yard< Line > ).db_land_search( pref )
					)
				)
				
				for( const found of founds ) {
					for( const land of [ ... found ].reverse() ) lands.add( land )
				}
				
				for( const land of lands ) {
					stat.set( land, ( stat.get( land ) ?? 0 ) + 1 )
				}
				
			}

			return [ ... stat ].sort( ( left, right )=> right[1] - left[1] ).map( pair => pair[0] )
			
		}
		
		@ $mol_mem
		sync() {
			
			this.server()
			
			for( const land of this.world().lands.values() ) {
				this.db_land_sync( land )
			}
			
			$mol_wire_race(
				... this.slaves().map( line =>
					()=> this.line_sync( line )
				)
			)
			
			try {
				const master = this.master()
				if( master ) $mol_wire_race(
					... [ ... this.world().lands.values() ].map( land =>
						()=> this.line_land_sync({ line: master, land })
					)
				)
			} catch( error ) {
				$mol_fail_log( error )
			}
		
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
			$mol_wire_solid()
			return next
		}
		
		@ $mol_mem_key
		db_land_sync( land: $hyoo_crowd_land ) {
			
			this.db_land_init( land )
			
			land.clocks
			
			const units = [] as $hyoo_crowd_unit[]
			for( const unit of land._unit_all.values() ) {
				if( this.db_unit_persisted.has( unit ) ) continue
				units.push( unit )
			}
			if( !units.length ) return
			
			$mol_wire_sync( this.world() ).sign_units( units )
			$mol_wire_sync( this ).db_land_save( land, units )
			
			for( const unit of units ) this.db_unit_persisted.add( unit )
			
			// this.$.$mol_log3_rise({
			// 	place: this,
			// 	land: land.id(),
			// 	message: 'Base Save',
			// 	units: this.log_pack( units ),
			// })
			
		}
		
		@ $mol_mem_key
		db_land_init( land: $hyoo_crowd_land ) {

			try {
				var units = $mol_wire_sync< $hyoo_sync_yard< Line > >( this ).db_land_load( land )
			} catch( error ) {
				
				if(!( error instanceof Error )) $mol_fail_hidden( error )
				
				this.$.$mol_log3_fail({
					place: this,
					land: land.id(),
					message: error.message,
				})
				
				units = []
			}
			
			for( const unit of units ) this.db_unit_persisted.add( unit )
			
			units.sort( $hyoo_crowd_unit_compare )
			land.apply( units )
			
			// this.$.$mol_log3_rise({
			// 	place: this,
			// 	land: land.id(),
			// 	message: 'Base Load',
			// 	units: this.log_pack( units ),
			// })
			
		}
		
		async db_land_load( land: $hyoo_crowd_land ) {
			return [] as $hyoo_crowd_unit[]
		}
		async db_land_search( from: string | number, to = from ) {
			return new Set< $mol_int62_string >()
		}
		async db_land_save( land: $hyoo_crowd_land, units: readonly $hyoo_crowd_unit[] ) { }
		
		
		@ $mol_mem
		master_cursor( next = 0 ) {
			return next
		}
		
		master_list() {
			return this.$.$hyoo_sync_masters
		}
		
		@ $mol_mem
		master_link() {
			const scheme = this.$.$mol_dom_context.document.location.protocol.replace( /^http/ , 'ws' )
			const host = this.master_list()[ this.master_cursor() ]
			return `${scheme}//${host}`
		}
		
		master() {
			return null as Line | null as any
		}
	
		server() {
			return null as any
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
			$mol_wire_solid()
			
			// try{
			// 	this.master()
			// } catch( error ) {
			// 	$mol_fail_log( error )
			// }

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
			
			const units = land.delta( clocks )
			if( !units.length ) return
			
			this.line_send_units( line, units )
			
			this.$.$mol_log3_rise({
				place: this,
				land: land.id(),
				message: 'Sync Sent',
				line: $mol_key( line ),
				units: this.log_pack( units ),
			})
			
			for( const unit of units ) {
				clocks[ unit.group() ].see_peer( unit.auth, unit.time )
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
			
			this.line_send_clocks( line, land )
			
			// this.$.$mol_log3_come({
			// 	place: this,
			// 	land: land.id(),
			// 	message: 'Sync Open',
			// 	line: $mol_key( line ),
			// 	clocks: land._clocks,
			// })
			
		}
		
		@ $mol_mem_key
		line_land_neck(
			{ line, land }: {
				line: Line,
				land: $mol_int62_string,
			},
			next = [] as Promise<any>[],
		) {
			return next
		}
		
		async line_receive( line: Line, message: Uint8Array ) {
			
			if( !message.byteLength ) return
			const view = new DataView( message.buffer, message.byteOffset, message.byteLength )
			const int0 = view.getInt32( 0, true )
			const int1 = view.getInt32( 4, true )
			
			const land_id = $mol_int62_to_string({
				lo: int0 << 1 >> 1,
				hi: int1 << 1 >> 1,
			})
			
			const handle = async( prev?: Promise<any> )=> {
				
				if( prev ) await prev
				
				const world = this.world()
				const land = await $mol_wire_async( world ).land( land_id )
				
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
					
					if( bin.count() + land.delta( clocks ).length < land._unit_all.size ) {
						this.line_land_clocks( { line, land }, clocks = [ new $hyoo_crowd_clock, new $hyoo_crowd_clock ] )
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
						
						// this.$.$mol_log3_done({
						// 	place: this,
						// 	land: land.id(),
						// 	message: 'Sync Pair',
						// 	line: $mol_key( line ),
						// 	clocks,
						// })
						
					}
					
					return
				}
			
				const { allow, forbid } = await world.apply( message )
				
				for( const [ { bin, ... unit }, error ] of forbid ) {
					
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
				{ line, land: land_id },
				[
					handle( this.line_land_neck({ line, land: land_id })[0] )
						.catch( error => {
							this.$.$mol_log3_fail({
								place: this,
								land: land_id,
								message: String( error?.message ?? error ),
							})
						} )
				],
			)

		} 
		
		line_send_clocks(
			line: Line,
			land: $hyoo_crowd_land,
		) {}
		
		async line_send_units(
			line: Line,
			units: readonly $hyoo_crowd_unit[],
		) {}
		
		[ $mol_dev_format_head ]() {
			return $mol_dev_format_native( this )
		}
		
	}
}
