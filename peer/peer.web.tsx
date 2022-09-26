/** @jsx $mol_jsx */
namespace $ {
	
	export async function $hyoo_sync_peer( path: string ) {
		
		let serial = $mol_state_local.value( '$hyoo_sync_peer' ) as string | null
		if( typeof serial !== 'string' ) {
			
			serial = $mol_state_local.value( path )
			
			if( typeof serial === 'string' ) {
				$mol_state_local.value( '$hyoo_sync_peer', serial )
				$mol_state_local.value( path, null )
			}
			
		}
		
		const frame = <iframe src="https://sync.hyoo.ru/auth/"></iframe> as HTMLIFrameElement
		frame.style.display = 'none'
		
		await new Promise< any >( ( done, fail )=> {
			
			frame.onload = done
			frame.onerror = fail
			frame.onabort = fail
			
			document.body.appendChild( frame )
			
		} )
		
		const serial_ext = await new Promise< string | null >( ( done, fail )=> {
			
			window.addEventListener( 'message', event => {
				
				if( !Array.isArray( event.data ) ) return
				if( event.data[0] !== '$hyoo_sync_peer' ) return
				
				done( event.data[1] )
				
			} )
			
			frame.contentWindow!.postMessage( [ '$hyoo_sync_peer', serial ], '*' )
			setTimeout( ()=> done( serial ), 5000 )
			
		} )
		
		document.body.removeChild( frame )
		
		if( typeof serial_ext === 'string' ) {
			if( !serial ) $mol_state_local.value( '$hyoo_sync_peer', serial_ext )
			return await $hyoo_crowd_peer.restore( serial_ext )
		}
		
		const peer = await $hyoo_crowd_peer.generate()
		$mol_state_local.value( '$hyoo_sync_peer', peer.key_private_serial )
		
		return peer
	}
	
}
