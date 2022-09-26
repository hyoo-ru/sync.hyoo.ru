namespace $ {
	
	export async function $hyoo_sync_peer( path: string ) {
		
		let serial = $mol_state_local.value( '$hyoo_sync_peer' ) as string | null
		if( typeof serial === 'string' ) {
			return await $hyoo_crowd_peer.restore( serial )
		}
		
		const peer = await $hyoo_crowd_peer.generate()
		$mol_state_local.value( '$hyoo_sync_peer', peer.key_private_serial )
		return peer
		
	}

	
}
