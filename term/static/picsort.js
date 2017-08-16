/*
	picsort.js handles javascript routines not covered by term.js (which wraps the virtual CLI)
	This includes transferring data to and from picsort.py, which runs on the server
	picsort.js handles button clicks, dynamic html, image viewing, and dialogue with the backend
	
*/

var removed_dirs = [];
var selected_pic = null;
var action = 'copy';
var viewing_pics = false;

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
		$('#image_viewer_outer').fadeIn(900).css({'display':'inline-block'});
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
	})
	
	//
	//  ==========================
	//  switch focus to pic_list
	.on('click','#pic_list',function(){
		$(this).focus();
	})
	
	//
	//  ==========================
	//  iterate over pic_list with arrow keys when focused
	.on('keydown',function(e){
		if ( $('#screen').is(':focus') || ! viewing_pics ){		// do not change pic on arrow press when on #screen (or pics not yet loaded)
			return;
		}	
		switch (e.which){
		
			//
			// ARROW UP  -- select above file, if any
			//
			case 38:	
				e.preventDefault();
				var c = 0;
				$('.file_list_pic').each(function(){
					$(this).hasClass('selected_pic') && c > 0 ? 
						$(this).removeClass('selected_pic') && $(this).prev().addClass('selected_pic') : {};
					c++;
				});
								
				// scroll #pic_list on arrow down if .selected_pic out of view (at bottom of list)	
				if ( $('.selected_pic')[0].offsetTop < $('#pic_list')[0].offsetTop + $('#pic_list')[0].scrollTop ){
					$('#pic_list')[0].scrollTop -= $('.file_list_pic').height();
				}			
				break;		
			
			//
			//	ARROW DOWN	--  select below file, if any
			//
			case 40:	
				e.preventDefault();
				for( c=0; c < $('.file_list_pic').length - 1; c++ ){
					var fc = $($('.file_list_pic')[c]);
					if ( fc.hasClass('selected_pic')	 ){
						fc.removeClass('selected_pic').next().addClass('selected_pic');
						break;
					}				
				};
				
				// scroll #pic_list on arrow down if .selected_pic out of view (at bottom of list)
				if ( $('.selected_pic')[0].offsetTop > ( $('#pic_list')[0].offsetTop + $('#pic_list').height() - $('.selected_pic').height()) ){
					$('#pic_list')[0].scrollTop += $('.file_list_pic').height(); 
				}
				break;			
				
		}
		view_image( $('.selected_pic').html() );
	})
	
	//
	//  ============================
	//		Move file to (or copy file to) clicked directory
	.on('click','.dir',function(){
		if (viewing_pics){
			move_or_copy_file( { dir:$(this).html(), initial:true } );
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

//
//
//
$(window).on('beforeunload', function() {	// prevent #pic_list autoscroll to previous value on page reload
    $('#pic_list').scrollTop(0);
    $('#pic_list').scrollLeft(0);
});


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
		
		$('#pic_list').html('');
		$('#pic_list')[0].scrollTo(0,0);
		for ( i=0; i < pic_list.length; i++ ){
			$('#pic_list').append( 
				'<div class="file_list_pic">'+pic_list[i]+'</div>'
			 );
		}	
		$('.file_list_pic').first().addClass('selected_pic');
		view_image( $('.selected_pic')[0].innerHTML );
		viewing_pics = true;
	}
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
			con('no dirs found');
			$('#dir_list').append( dir_list_source.replace('<!--NAME_HERE-->','(No directories)') );
		}
	}
}





//		=====================================
//		DOCUMENT LOAD
//
$(document).ready(function(){
	populate_dir_list( null );
});




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
			con(result);
			var re = /\{[^]*\}/;		// extract json data from internal python prints (that get dumped here)
			
			var json = result.match(re)[0];
			//json ? json = json[0] : json = 
			
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





//	==============================================
//	MOVE OR COPY FILE
//
function move_or_copy_file( args ){
	var instructions = arguments.callee.name;
	var action_selected = $('.action_selected').html();
	var file = $('.selected_pic').html(); 
	
	args.initial ? submit() : receive();
	
	function submit(){
		submit_picsort({
			'instructions'	: instructions,
			'action'		: action_selected,
			'dir'			: args.dir, 
			'file'			: file
		});
	}
	
	function receive(){
		con('Output from previous command: '+ args.bash_out || 'None' );
		if (action_selected == 'move'){
			$('.file_list_pic').each(function(){
				$(this).html() == file ? $(this).remove() && con('Moved '+file) : {};
			});
		}
	}

	
}