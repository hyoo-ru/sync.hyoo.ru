namespace $.$$ {
	
	export class $hyoo_sync_watch_world extends $.$hyoo_sync_watch_world {
		
		land_id( next?: string ) {
			return ( this.$.$mol_state_arg.value( 'land', next ) ?? '' ) as $mol_int62_string
		}
		
		land() {
			const id = this.land_id()
			return id ? this.yard().land( id ) : null
		}
		
		@ $mol_mem
		menu_head() {
			return [
				this.Land_config(),
				... this.land_id() ? [] : [ this.Menu_tools() ],
			]
		}
		
		grab_submit() {
			
			type Rule = $mol_int62_string | ''
			const rules = [ [], [], [] ] as Rule[][]

			rules[ this.def_level() ]?.push( '0_0' )
			rules[ this.self_level() ]?.push( '' )
			
			const land = this.yard().land_grab( ... rules )
			this.land_id( land.id() )
			
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
		
		@ $mol_mem
		menu_body() {
			if( !this.land() ) return [ this.Grab() ]
			return super.menu_body()
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
			return `${ this.land()!.id() }+${ head }.bin`
		}
		
	}
	
}
