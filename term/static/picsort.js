/*
	picsort.js handles javascript routines not covered by term.js (which wraps the virtual CLI)
	This includes transferring data to and from picsort.py, which runs on the server
	picsort.js handles button clicks, dynamic html, image viewing, and dialogue with the backend
	
*/

var removed_dirs = [];
var selected_pic = null;
var action = 'move';


/*
	======================================================================
	BUTTON CLICK HANDLERS 
*/

$(document)
	//
	//	==========================
	//  remove dir (from view) on click
	.on('click','.rmdir',function(){
		var dir_index = $('.rmdir').index( $(this) )	
		$( $('.dir_outer')[dir_index] ).remove();
		$( $('.rmdir_outer')[dir_index] ).remove();
	})	
	
	//
	//  ==========================
	//  change action on click (move vs. copy)
	.on('click','.action',function(){
		$('.action').removeClass('action_selected');
		$(this).addClass('action_selected');
	})

	//  
	//  ==========================
	//  picsort current dir on click
	.on('click','#picsort_current_dir',function(){
		$('#file_list_outer').fadeIn(900).css({'display':'inline-block'});
		picsort_current_dir( null );
	})
	
	//
	//  ==========================
	//  change pic in image_viewer
	.on('click','.file_list_pic', function(){
		$('.file_list_pic').removeClass('selected_pic');
		$(this).addClass('selected_pic');
		view_image( $(this).html() );
	})
	
	//
	//  ==========================
	//  remove hover style (class) from .file_list_pic when hovering elsewhere
	.on('mouseover','*',function(e){
		e.stopPropagation();
		$('.file_list_pic').removeClass('hovered_pic');	
		if ( $(this).hasClass('file_list_pic') && ! $(this).hasClass('selected_pic') ){
			$(this).addClass('hovered_pic');
		}
});

/*
	BUTTON CLICK HANDLERS
	===========================================================================
*/


//		=====================================
//		VIEW IMAGE
//
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


//		=====================================
//		PICSORT CURRENT DIR
//
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


//		=====================================
//		AJAX CALLS
//
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


//		=====================================
//		POPULATE DIR LIST
//
var old_dir_list = 'none';
function populate_dir_list( dir_list ){
	//  Function 1: dir_list == null: get directory list from current_dir (in current_session)
	//  Function 2: dir_list returned with callback function; clear #dir_list and append new directory content
	
	if ( ! dir_list ){		//  Put dir_list in #dir_list
		submit_picsort({'instructions' : 'populate_dir_list'});		
	}
	else{
		if ( dir_list.length == old_dir_list.length && dir_list.every(function(v,i){ return v == old_dir_list[i] }) ){				  
			//  Avoid DOM manipulation if dir_list has not changed
			return;
		}
		old_dir_list = dir_list;
		$('#dir_list').html('');	
		$('#rmdir_list').html('');
		
		// 	get dir_list/rmdir_list template sources
		var dir_list_source = $('#dir_list_source').html();
		var rmdir_source = $('#rmdir_source').html();
		
		$(dir_list).each(function(){	
					
			$('#dir_list').append( 		dir_list_source.replace('<!--NAME_HERE-->',this) );
			$('#rmdir_list').append( 	rmdir_source );	
			
		});	
		
		if (dir_list.length == 0){	// show "None" when no directories are present
			$('#dir_list').append( dir_list.source.replace('<!--NAME_HERE-->','None') );
		}
	}
}

//		=====================================
//		DOCUMENT LOAD
//
$(document).ready(function(){
	populate_dir_list( null );
});
