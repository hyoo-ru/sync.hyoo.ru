namespace $.$$ {
	
	export class $hyoo_sync_watch_log extends $.$hyoo_sync_watch_log {
		
		@ $mol_mem
		source() {
			// const uri = 'https://sync.hyoo.ru/log'
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
		
		@ $mol_mem_key
		type_label( type: string ) {
			const icon = {
				'rise': '💨',
				'come': '🙏',
				'done': '✅',
				'warn': '💢',
				'fail': '💥',
			}[ type ]
			return `${icon} ${type}`
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
		row_fields( row: number ) {
			return this.items()[ row ].kids.filter( kid => kid.type != 'place' ).map( kid => kid.type )
		}
		
		@ $mol_mem_key
		row_content( row: number ) {
			return [
				this.Row_type( row ),
				... this.row_fields( row ).map( field => this.Row_field([ row, field ]) )
			]
		}
		
		@ $mol_mem_key
		Row_field_value( [ row, field ]: [ number, string ] ) {
			switch( field ) {
				case 'time': return this.Row_field_moment([ row, field ])
				case 'land': return this.Row_field_land([ row, field ])
				default: return this.Row_field_text([ row, field ])
			}
		}
		
		row_type( index: number ) {
			const type = this.items()[ index ].type
			return this.type_label( type )
		}
		
		row_field_name( [ row, field ]: [ number, string ] ) {
			return field
		}
		
		@ $mol_mem_key
		row_field_tree( [ row, field ]: [ number, string ] ) {
			return this.items()[ row ].select( field ).kids[0] ?? $mol_tree2.data('')
		}
		
		@ $mol_mem_key
		row_field_moment( [ row, field ]: [ number, string ] ) {
			return new $mol_time_moment( this.row_field_tree([ row, field ]).text() ).toOffset()
		}
		
		@ $mol_mem_key
		row_field_text( [ row, field ]: [ number, string ] ) {
			
			const tree = this.row_field_tree([ row, field ])
			
			switch( tree.type ) {
				
				case 'clocks':
					return tree
						.select( '/', '*', 'last_time', null )
						.kids.map( kid => new $mol_time_moment( $hyoo_crowd_time_stamp( Number( kid.type ) ) ).toOffset().toString( 'YYYY-MM-DD hh:mm:ss' ) )
						.join( ' | ' )
				
				default: return tree.text() + tree.kids.filter( k => k.type ).map( k => k.toString() ).join('').trim()
				
			}
			
		}
		
	}
	
}
