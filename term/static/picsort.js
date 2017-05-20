var removed_dirs = [];

$(document).on('click','.x',function(){
	removed_dirs.push( $(this).next().html() );
	$(this).parent().remove();
});

function populate_dir_list(){
	$('#dir_list').html('');
	$.ajax({
		method:	'post',
		url:	'picsort.py',
		data:	{'package':'populate_dir_list'},
		success:	function(dir_list){
			dir_list = JSON.parse(dir_list);
			for (i=0; i < dir_list.length; i++){
				if ( $.inArray(dir_list[i],removed_dirs) != -1){
					//ignore previously-removed directories
					continue;
				}
				
				$('#dir_list').append(
					'<div class="dir_outer">'+
						'<img class="x border" src="media/x.png" />&nbsp'+
						'<span class="dir">'+dir_list[i]+'</span>'+
					'</div>'
				);
			}
		}
	});
}

$(document).ready(function(){
	populate_dir_list();
});