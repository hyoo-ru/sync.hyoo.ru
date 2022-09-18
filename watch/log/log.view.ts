namespace $.$$ {
	
	export class $hyoo_sync_watch_log extends $.$hyoo_sync_watch_log {
		
		@ $mol_mem
		source() {
			// const uri = 'http://localhost:9090/log'
			const uri = '/log'
			const text = this.$.$mol_fetch.text( uri )
			return this.$.$mol_tree2_from_string( text, uri )
		}
		
		@ $mol_mem
		types() {
			const types = new Set< string >()
			for( const item of this.source().kids ) {
				types.add( item.type )
			}
			return [ ... types ]
		}
		
		@ $mol_mem
		items() {
			return this.source().kids.filter( kid => this.type_visible( kid.type ) ).reverse()
		}
		
		@ $mol_mem
		fields() {
			const fields = new Set< string >()
			for( const item of this.items() ) {
				for( const field of item.kids ) {
					fields.add( field.type )
				}
			}
			fields.delete( 'place' )
			return [ ... fields ]
		}
		
		@ $mol_mem
		rows() {
			return this.items().map( ( kid, index )=> this.Row( index ) )
		}
		
		@ $mol_mem_key
		row_content( row: number ) {
			return [
				this.Row_type( row ),
				... this.fields().map( field => this.Row_field([ row, field ]) )
			]
		}
		
		row_type( index: number ) {
			return this.items()[ index ].type
		}
		
		row_field_name( [ row, field ]: [ number, string ] ) {
			return field
		}
		
		row_field_value( [ row, field ]: [ number, string ] ) {
			const tree = this.items()[ row ].select( field ).kids[0]
			if( !tree ) return ''
			return tree.text() + tree.kids.filter( k => k.type ).map( k => k.toString() ).join('')
		}
		
	}
	
}
