namespace $.$$ {
	
	export class $hyoo_sync_watch_world extends $.$hyoo_sync_watch_world {
		
		land_id( next?: string ) {
			return ( this.$.$mol_state_arg.value( 'land', next ) ?? '0_0' ) as $mol_int62_string
		}
		
		land() {
			const id = this.land_id()
			return id ? this.yard().land( id ) : null
		}
		
		@ $mol_mem
		spreads() {
			
			const land = this.land()
			if( !land ) return {}
			
			land.pub.promote()
			
			const spreads = {}
			
			for( const head of this.land()?._unit_lists.keys() ?? [] ) {
				spreads[ head ] = this.Node( head )
			}
			
			return spreads
		}
		
		node_id( id: $mol_int62_string ) {
			return id
		}
		
		node_units( id: $mol_int62_string ) {
			this.land()!.pub.promote()
			return this.land()!.unit_list( id )
		}
		
		node_list( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_list ).list()
		}
		
		node_links( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_list ).list().map( id => this.Node_link( id ) )
		}
		
		node_text( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_text ).text()
		}
		
		node_html( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_dom ).html()
		}
		
		node_json( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_json ).json()
		}
		
	}
	
}
