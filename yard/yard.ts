namespace $ {
	export class $hyoo_sync_yard extends $mol_object2 {
		
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
		
		land_init( id: $mol_int62_string ) {
		}
		
	}
}
