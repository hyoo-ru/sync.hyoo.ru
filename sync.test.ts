namespace $ {
	$.$hyoo_sync_masters = [
		`ws://localhost:9090/`,
		$mol_dom_context.document.location.origin.replace( /^\w+:/ , 'ws:' ),
	]
}
