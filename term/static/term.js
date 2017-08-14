/*

term.js

-- Part of PICSORT app contents --

General logic of functionality in term.js:
	
	1. Receive user-typed shell commands from virtual-terminal ('term') portion of picsort app GUI 
	2. Communicate with term.py running on the server via jquery ajax to transfer shell commands
	3. Receive output (stdout) from a term.py subprocess executing the desired shell commands
	4. Print shell output to virtual terminal
	5. Call populate_dir_list (in picsort.js) to change dir_list, if necessary

*/

// Initialize variables
var current_command = '';
var current_dir = ''
var ignore_keys = [9,16,17,18,27,37,38,39,40];	//224
var command_key_down = false;
var cmd_history = [];
var history_pointer = 0;

// Test functions		
function print(msg){$('#msgbox').append(msg);}
function con(msg){console.log(msg);} 

//
//
var startup_commands = 'cd ../../../try/pics'.split(';');
//
//


// Start new session with server on page load
$(document).ready(function(){
	$('#commandline').focus();
	screen_append('## Starting new session ##');
	$('#screen').focus();
	submit( 'new session' );
	for ( c = 0; c < startup_commands.length; c++ ){
		submit( startup_commands[c].trim() );
	}

});

// Print to terminal screen 
function screen_append(text){
	var screen_text = $('#screen').val();
	$('#screen').val( screen_text + text );
}

function current_command_remove(){
	var screen_text = $('#screen').val();
	$('#screen').val( screen_text.substring(0,screen_text.length - current_command.length) );			
}

function ps(data, newline, is_command, current_dir){
	//print to screen
	if (typeof data == 'string'){
		screen_append(data);
		newline ? screen_append('\n') : {};
	}
	else{				
		for (i=0; i<data.length; i++){
			screen_append(data[i]+'\n');
		}
	}
	if ( ! is_command ){
		screen_append(current_dir+' $  ');
	}
	$('#screen').scrollTop($('#screen')[0].scrollHeight);
}
//---------------------------

  
// Send new command to server
function submit(submission){
	$.ajax({
		method:'post',
		url:'term.py',
		data:{'package':JSON.stringify(submission)},
		success:function(result){
			con(result);
			result = JSON.parse(result);
			data = result.data;
			current_dir = result.current_dir;

			if (data == 'session started'){
				data = '';
			}
			else{
				populate_dir_list(null);
			}
			
			ps( data=data.trim().split('\n'), newline=null, is_command=false, current_dir=current_dir );
		}
	});
}


// Keypress handler
$(document).on('keydown','#screen',function(e){
	switch(e.which){
		
		// ----- Enter ----- //
		case 13:	
			if (current_command.length == 0){
				con('length 0');
				ps(data='',newline=true,is_command=false,current_dir=current_dir);
			}
			else{
				//append history; submit command; print newline
				cmd_history.push(current_command);
				history_pointer = cmd_history.length;
				submit( current_command );
				ps(data='',newline=true,is_command=true);	
			}
			current_command = '';
			break;
		
		
		// ----- Backspace ----- //	
		case 8:		
			if ( current_command.length > 0 ){
				current_command = current_command.substring(0,current_command.length-1);
				var window_text = $('#screen').val();
				$('#screen').val( window_text.substring(0,window_text.length-1) );
			}
			break;
		
		
		// ----- Command (key) ----- //
		case 224:	
			command_key_down = true;
			break;
		
		
		// ----- v (key): handle paste [Cmd+v] ----- //
		
		/*
		case 86:
			// Exploit time delay in paste process to:
			// 1. Switch focus to #dummybox textarea (hidden) immediately
			// 2. Contents get pasted during 1ms Timeout
			// 3. Transfer pasted contents to #screen
			// 4. Transfer focus to #screen
			// 5. Delete #dummybox value
			if ( command_key_down ){	
				con('here');			
				$('#dummybox').focus();
				setTimeout(function(){
					var pasted = $('#dummybox').val();
					current_command += pasted;
					var screen_text = $('#screen').val();
					$('#screen').val( screen_text + pasted );
					$('#screen').focus();
					$('#dummybox').val('');
				},1);
				break;
			} 
			else{
				con('yes');
				
				current_command += e.key;
				con(current_command);
				
				ps(data=e.key, newline=false, is_command=true);
			}
			*/
		
		// ----- ArrowUp (key) - retrieve command from history (backwards) ----- //	
		case 38:
			
			if (cmd_history.length == 0){
				break;
			}
			current_command_remove();	
			history_pointer > 0 ? history_pointer-- : {};	
			current_command = cmd_history[history_pointer];
			screen_append(current_command);
			
			break;
		
		
		// ----- ArrowDown (key) - retrieve command from history (forwards), or show blank line ----- //		
		case 40:

			current_command_remove();
			current_command = '';
			
			if ( history_pointer < cmd_history.length - 1 ){
				history_pointer++;
				screen_append( cmd_history[history_pointer] );
				current_command = cmd_history[history_pointer];
			}
			else{
				history_pointer = cmd_history.length;
				current_command_remove();
				
			}
			break;
		
		
		// ----- c (key): prevent writing 'c' when copying [Cmd+c] ----- //		
		case 67:
			if (command_key_down){
				break;
			}
		
		
		// ----- Default keydown - add keystroke to current_command ----- //	
		default:
			con('default');
			
			if ( $.inArray(e.which, ignore_keys) != -1 ){
				return;
			}
			else if ( command_key_down && e.which == 86){	
				// Moved this code from case selection (e.which == 86) where pressing v caused a bug		
				$('#dummybox').focus();
				setTimeout(function(){
					var pasted = $('#dummybox').val();
					current_command += pasted;
					var screen_text = $('#screen').val();
					$('#screen').val( screen_text + pasted );
					$('#screen').focus();
					$('#dummybox').val('');
				},1);
				break;
			} 	
			else {
				if (command_key_down){
					// command_key_down remains true when switching windows with CMD+tab; 
					// this code prevents term from ignoring input
					// when returning to the browser window from another application
					command_key_down = false;
					$('#screen').focus();
				}
				
				current_command += e.key;
				ps(data=e.key, newline=false, is_command=true);
			}		
	}
});



$(document).on('keyup','*',function(e){
	switch(e.which){
		case 224:
			command_key_down = false;
	}
});
