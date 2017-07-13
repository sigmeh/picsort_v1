/*

	picsort.js handles javascript routines not covered by term.js (which wraps the virtual CLI)
	This includes transferring data to and from picsort.py, which runs on the server
	This script handles button clicks, dynamic html, image viewing, and dialogue with the backend
*/

var removed_dirs = [];
var selected_pic = null;

/*  button click handlers  */
$(document).on('click','.x',function(){
	removed_dirs.push( $(this).next().html() );
	$(this).parent().remove();
});

//-------------------------//

$(document).on('click','#picsort_current_dir',function(){
	$('#file_list_outer').fadeIn(900).css({'display':'inline-block'});
	picsort_current_dir( null );
});

$(document).on('click','.file_list_pic', function(){
	$('.file_list_pic').removeClass('selected_pic');
	$(this).addClass('selected_pic');
	view_image( $(this).html() );
	
	//selected_pic = $(this);
});
$(document).on('mouseover','*',function(e){
	e.stopPropagation();
	$('.file_list_pic').removeClass('hovered_pic');	
	if ( $(this).hasClass('file_list_pic') && ! $(this).hasClass('selected_pic') ){
		$(this).addClass('hovered_pic');
	}
});

/*  button click handlers  */

function view_image( image_name ){
	$('#image').attr('src', 'http://127.0.0.1:8004/picsort_thumbnails/'+image_name );
	$('#image_name').html(image_name);
	var h = $('#image').height();
	var w = $('#image').width();
	
	if ( Math.abs(200 - h) < Math.abs(300 - w) ){		// optimize image size for viewer
		$('#image').height(200);
	}
	else{
		$('#image').width(300);
	}	
}


function picsort_current_dir( pic_list ){
	// Function 1: Tell picsort.py to start a server from the current_dir (in term) using throwup_server
	// Function 2: picsort.py returns the contents of the current_dir as a json list
	if (! pic_list ){
		submit_picsort( { 'instructions' : 'picsort_current_dir' } );
	}
	else{
		for ( i=0; i < pic_list.length; i++ ){
			$('#pic_list').append( 
				'<div class="file_list_pic">'+pic_list[i]+'</div>'
			 );
		}	
		$('.file_list_pic').first().addClass('selected_pic');
		view_image( $('.selected_pic')[0].innerHTML );
	}
}


function submit_picsort( submission ){
	//  Centralized ajax information transfer to picsort.py
	//  Receives callback_function (same as *calling* function) + args from picsort.py
	
	con('Sending server request. Data in transit...');
	
	$.ajax({
		method 	: 'post',
		url		: 'picsort.py',
		data	: { 'package' : JSON.stringify(submission) }, 
		success : function( result ){
			con('...Server response received.');
			
			var re = /\{[^]*\}/;		// extract json data from internal python prints (that get dumped here)
			var json = result.match(re)[0];
			
			con( 'Python print statements from last action:'); 
			var python_stdout = result.replace(re,'').trim();
			con( python_stdout || 'None');
			result = JSON.parse(json);

			f = result.callback_function;
			a = result.args;
			con(result);
			if ( a ){		
				eval( f+'('+JSON.stringify(a)+')' );	//callback
			}		
		}
	});
}

var old_dir_list = 'none';
function populate_dir_list( dir_list ){
	//  Function 1: dir_list == null: get directory list from current_dir (in current_session)
	//  Function 2: dir_list returned with callback function; clear #dir_list and append new directory content
	
	if ( ! dir_list ){		//  Put dir_list in #dir_list
		submit_picsort({'instructions' : 'populate_dir_list'});		
	}
	else{
		if (dir_list === old_dir_list){				// look up javascript array comparison   
			return;
		}
		old_dir_list = dir_list;
		$('#dir_list').html('');	
		$('#rmdir_list').html('');
		
		$(dir_list).each(function(){	
			// dir_list sits next to rmdir_list
			var dir_list_source = $('#dir_list_source').html();
			$('#dir_list').append(
				dir_list_source.replace('<!--NAME_HERE-->',this)	
			);
			
			var rmdir_source = $('#rmdir_source').html();
			$('#rmdir_list').append(
				rmdir_source
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
	//$('#picsort_current_dir').click();
});