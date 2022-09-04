namespace $ {
	
	export class $hyoo_sync_client extends $hyoo_sync_yard< WebSocket > {
		
		@ $mol_memo.method
		async db() {
			
			type Scheme = {
				Unit: {
					//     land,              head,              self
					Key: [ $mol_int62_string, $mol_int62_string, $mol_int62_string ]
					Doc: $hyoo_crowd_unit
					Indexes: {
						//      land
						Land: [ $mol_int62_string ]
					}
				}
			}
			
			const db2 = await this.$.$mol_db< Scheme >( '$hyoo_sync_client_db2' )
			await db2.kill()
			
			return await this.$.$mol_db< Scheme >( '$hyoo_sync_client_db',
				mig => mig.store_make( 'Unit' ),
				mig => mig.stores.Unit.index_make( 'Land', [ 'land' ] ),
			)
			
		}
		
		async db_land_load( land: $hyoo_crowd_land ) {
			
			const db = await this.db()
			const Unit = db.read( 'Unit' ).Unit
			
			const recs = await Unit.indexes.Land.select([ land.id() ])
			if( !recs ) return []
			
			const units = recs.map( rec => new $hyoo_crowd_unit(
				rec.land, rec.auth,
				rec.head, rec.self,
				rec.next, rec.prev,
				rec.time, rec.data,
				new $hyoo_crowd_unit_bin( rec.bin!.buffer ),
			) )
			
			return units
		}
		
		async db_land_save( land: $hyoo_crowd_land, units: readonly $hyoo_crowd_unit[] ) {
			
			const db = await this.db()
			const trans = db.change( 'Unit' )
			const Unit = trans.stores.Unit
			
			for( const unit of units ) {
				Unit.put( unit, [ unit.land, unit.head, unit.self ] )
			}
			
			await trans.commit()
			
		}
		
		
		@ $mol_mem
		reconnects( reset?: null ): number {
			return ( $mol_wire_probe( ()=> this.reconnects() ) ?? 0 ) + 1
		}
		
		master_cursor = 0
		
		@ $mol_mem
		master() {
			
			this.reconnects()
			
			const line = new $mol_dom_context.WebSocket(
				this.$.$hyoo_sync_masters[ this.master_cursor ]
			)
			line.binaryType = 'arraybuffer'
			
			line.onmessage = async( event )=> {
				
				if( event.data instanceof ArrayBuffer ) {
					await this.line_receive( line, new Uint8Array( event.data ) )
				} else {
					
					this.$.$mol_log3_fail({
						place: this,
						message: 'Wrong data',
						data: event.data
					})
					
				}
				
			}

			line.onclose = ()=> {
				setTimeout( ()=> this.reconnects( null ), 5000 )
			}
			
			Object.assign( line, {
				destructor: ()=> line.close()
			} )
			
			return new Promise< typeof line >( ( done, fail )=> {
				
				line.onopen = ()=> {
					
					this.$.$mol_log3_come({
						place: this,
						message: 'Connected to Master',
						line: $mol_key( line ),
					})
		
					done( line )
				}
				
				line.onerror = ()=> {
					this.master_cursor = ( this.master_cursor + 1 ) % this.$.$hyoo_sync_masters.length 
					fail( new Error( `Master is unabailable` ) )
				}
				
			} ) as any as WebSocket
			
		}
		
		line_send( line: WebSocket, message: Uint8Array ) {
			line.send( message )
		}
		
	}
	
}
