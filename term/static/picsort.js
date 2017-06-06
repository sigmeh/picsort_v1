var removed_dirs = [];

$(document).on('click','.x',function(){
	removed_dirs.push( $(this).next().html() );
	$(this).parent().remove();
});

function submit_picsort( submission ){
	$.ajax({
		method 	: 'post',
		url		: 'picsort.py',
		data	: { 'package' : JSON.stringify(submission) }, 
		success : function( result ){
			
			result = JSON.parse(result);		
			f = result.callback_function;
			a = result.args;
			 
			eval( f+'('+JSON.stringify(a)+')' );
		}
	});
}

function populate_dir_list( dir_list ){
	//  Function 1: dir_list == null; get directory list from current_dir (in current_session)
	//  Function 2: dir_list returned on callback function; clear #dir_list and append new directory content
	
	if ( dir_list ){		//  Put dir_list in #dir_list
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
	}
	else{
		submit_picsort({'instructions' : 'populate_dir_list'});
	}
}

function get_pic_list( pic_list ){
	
	if ( pic_list){
		
	}
	else{	
		submit_picsort({'instructions' : 'get_pic_list'});
	}
}

$(document).ready(function(){
	populate_dir_list( null );
});