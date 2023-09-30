namespace $.$$ {
	
	export class $hyoo_sync_watch_land extends $.$hyoo_sync_watch_land {
		
		land_id( next?: string ): string {
			return this.$.$mol_state_arg.value( 'land', next ) ?? ''
		}
		
		land() {
			const id = $mol_int62_string_ensure( this.land_id() )
			return id ? this.yard().land( id ) : null
		}
		
		menu_title() {
			return this.land_id() ?? ''
		}
		
		@ $mol_mem
		spreads() {
			
			const land = this.land()
			if( !land ) return {}
			
			land.pub.promote()
			
			const spreads = {} as Record< string, $mol_view >
			
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
			return this.land()!
				.node( id, $hyoo_crowd_list ).list()
				.filter( id => typeof id === 'string' )
				.map( id => this.Node_link( id ) )
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
		
		node_blob( id: $mol_int62_string ) {
			return this.land()!.node( id, $hyoo_crowd_blob ).uri()
		}
		
		download_blob( head: $mol_int62_string ) {
			const units = this.land()!.unit_list( head ).slice().sort( $hyoo_crowd_unit_compare )
			const bins = units.map( unit => $hyoo_crowd_unit_bin.from_unit( unit ) )
			const blob = new $mol_blob( bins )
			return blob
		}
		
		download_name( head: $mol_int62_string ) {
			return `${ this.land()!.id() }!${ head }.bin`
		}
		
	}
	
}
