namespace $.$$ {
	
	export class $hyoo_sync_watch_search extends $.$hyoo_sync_watch_search {
		
		query( next?: string ) {
			return this.$.$mol_state_arg.value( 'search', next ) ?? ''
		}
		
		@ $mol_mem
		search_query( next?: string ) {
			return next ?? this.query()
		}
		
		search_start() {
			this.query( this.search_query() )
		}
		
		@ $mol_mem
		found_lands() {
			
			const query = this.query()
			if( !query ) return []
			
			const id = $mol_int62_string_ensure( query )
			if( id ) return [ id ]
			
			const request = $hyoo_harp_to_string({
				search: {
					'=': [[ query ]],
				},
			})
			
			const origin = this.$.$mol_dom_context.location.protocol + '//' + this.yard().master_list()[ this.yard().master_cursor() ]
			
			const response = this.$.$mol_fetch.json( `${origin}/${request}` ) as { land: Record< $mol_int62_string, {} > }
			return Object.keys( response.land )
				
		}
		
		@ $mol_mem
		spreads() {
			
			const spreads = {} as Record< string, $mol_view >
			
			for( const land of this.found_lands() ) {
				spreads[ land ] = this.Land( land )
			}
			
			return spreads
		}
		
		land_id( id: $mol_int62_string ) {
			return id
		}
		
		@ $mol_mem
		menu_links() {
			
			const links = super.menu_links()
			if( links.length ) return links
			
			return [ this.Grab() ]
			
		}
		
		grab_submit() {
			
			type Rule = $mol_int62_string | ''
			const rules = [ [], [], [] ] as Rule[][]

			rules[ this.def_level() ]?.push( '0_0' )
			rules[ this.self_level() ]?.push( '' )
			
			const land = this.yard().land_grab( ... rules )
			this.land_id( land.id() )
			
		}
		
	}
	
}
