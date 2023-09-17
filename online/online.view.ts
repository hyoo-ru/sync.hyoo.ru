namespace $.$$ {
	export class $hyoo_sync_online extends $.$hyoo_sync_online {
		
		@ $mol_mem
		message() {
			
			try {
				
				this.yard().sync()
				return this.hint()
			
			} catch( error ) {
				if( error instanceof Promise ) $mol_fail_hidden( error )
				
				$mol_fail_log( error )
				return String( error )
				
			}
			
		}
		
		@ $mol_mem
		link_content() {
			
			try {
				
				this.yard().sync()
				return [ this.Well() ]
			
			} catch( error ) {
				if( error instanceof Promise ) $mol_fail_hidden( error )
				
				$mol_fail_log( error )
				return [ this.Fail() ]
				
			}
			
		}
		
		@ $mol_mem
		hint() {
			return super.hint() + ' ' + $hyoo_sync_revision
		}
		
		@ $mol_mem
		master_link() {
			return this.yard().master_link().replace( /^ws(s?):/, 'http$1:' )
		}
		
		master_id( index: number ) {
			return this.dictionary()[ index ].replace( /^ws(s?):/, 'http$1:' )
		}
		
		option_label( index: number ) {
			return this.dictionary()[ index ].replace( /^ws(s?):\/\//, '' )
		}
		
		value( next?: string ) {
			return String( this.master_cursor( next == undefined ? undefined : Number( next ) ) )
		}
		
	}
}
