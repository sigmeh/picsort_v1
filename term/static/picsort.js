var removed_dirs = [];


/*  button click handlers  */
$(document).on('click','.x',function(){
	removed_dirs.push( $(this).next().html() );
	$(this).parent().remove();
});

//-------------------------//

$(document).on('click','#picsort_current_dir',function(){
	picsort_current_dir( null );
});
/*  button click handlers  */


function picsort_current_dir( file_list ){
	// Function 1: Tell picsort.py to start a server from the current_dir (in term) using throwup_server
	// Function 2: picsort.py returns the contents of the current_dir as a json list
	if (! file_list ){
		submit_picsort( { 'instructions' : 'picsort_current_dir' } );
	}
	else{
		for ( i=0; i<file_list.length; i++){
			con( file_list[i] );
		}	
	}
}


function submit_picsort( submission ){
	//  Centralized ajax information transfer to picsort.py
	//  Receives callback_function (same as *calling* function) + args from picsort.py
	$.ajax({
		method 	: 'post',
		url		: 'picsort.py',
		data	: { 'package' : JSON.stringify(submission) }, 
		success : function( result ){
			var re = /\{[^]*\}/;		// extract json data from internal python prints (that get dumped here)
			var json = result.match(re)[0];
			var python_stdout = result.replace(re,'').trim();
			con( 'python print statements from last action: ' + (python_stdout ? python_stdout : 'None') );
			result = JSON.parse(json);		
			
			f = result.callback_function;
			a = result.args;
			if ( a ){
			
				eval( f+'('+JSON.stringify(a)+')' );	//callback
			}
			
		}
	});
}

function populate_dir_list( dir_list ){
	//  Function 1: dir_list == null: get directory list from current_dir (in current_session)
	//  Function 2: dir_list returned on callback function; clear #dir_list and append new directory content
	
	if ( ! dir_list ){		//  Put dir_list in #dir_list
		submit_picsort({'instructions' : 'populate_dir_list'});		
	}
	else{
		$('#dir_list').html('');	
		$(dir_list).each(function(){
			$('#dir_list').append(
				'<div class="dir_outer">'+
					'<img class="x border" src="media/x.png" />&nbsp'+
					'<span class="dir">'+this.substring( 0, this.length )+
					'</span>'+
				'</div>'		
			);
		});
		
		if (dir_list.length == 0){	// show "None" when no directories are present
			$('#dir_list').append(
				'<div class="dir_outer">'+
					'<span class="none_dir"><i>None</i>'+
					'</span>'+
				'</div>'		
			);	
		}
	}
}

//--------
// On document load:
//--------
$(document).ready(function(){
	populate_dir_list( null );
	
});