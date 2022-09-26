namespace $ {
	
	$mol_dom_context.addEventListener( 'message', event => {
		
		if( !Array.isArray( event.data ) ) return
		if( event.data[0] !== '$hyoo_sync_peer' ) return
		
		if( $hyoo_sync_origins.every( domain => !event.origin.endsWith( domain ) ) ) {
			return event.source!.postMessage( event.data )
		}
		
		let key = $mol_state_local.value( '$hyoo_sync_peer' ) as string | null
		if( !key ) $mol_state_local.value( '$hyoo_sync_peer', key = event.data[1] )
		
		event.source!.postMessage([ '$hyoo_sync_peer', key ])
		
	} )
	
}
