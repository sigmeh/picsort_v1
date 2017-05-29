#!/usr/bin/env python
import cgi
import subprocess as sp
import json
import os
print

def test(msg):
	with open('TEST','w') as f:
		f.write(str(msg))

def main():
	data = cgi.FieldStorage()['package'].value
	
	with open('current_session','r') as f:
		current_session = json.loads(f.read())
	current_dir = current_session['current_dir']
	
	test(current_dir)
	
	if data == 'populate_dir_list':
		cmd = 'ls '+current_dir
		test(cmd.split())
		ls_contents = [x for x in sp.Popen('ls '+current_dir,stdout=sp.PIPE,shell=True).communicate()[0].split('\n') if x]
		realpath_contents = [current_dir+'/'+x for x in ls_contents]
		dir_list = [x.split('/')[-1] for x in realpath_contents if os.path.isdir(x)]
		print json.dumps(dir_list)
	
	pass
if __name__ == '__main__':
	main()