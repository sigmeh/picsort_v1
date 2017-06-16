#!/usr/bin/env python
'''
Process terminal console commands derived from terminal GUI or supplied as args to the process() function
'''
import cgi
import subprocess as sp
import json
import os
import sys
import copy
print


class commands(object):	
	'''
	`commands` is a set of shell commands that are intercepted for modification 
	prior to being called via the subprocess module. Mimicking file system traversal
	requires the 'current_dir' to be added explicitly to shell instructions prior to 
	their execution. 
	'''
	
	def __init__(self):
		pass
	#
	#
	
	def up(self,current_dir,new_cmd):
		'''Move up file hierarchy one unit (unless at root dir) and `ls` (new) dir contents'''	
		if current_dir != '/':
			current_dir = '/'.join(current_dir.split('/')[:-1])
			if not current_dir:
				current_dir = '/'
		self.ls(current_dir,new_cmd)
		return current_dir
	#
	#	
		
	def ls(self,current_dir,new_cmd):
		'''Perform `ls` operation on current_dir'''
		result = sp.Popen('ls '+' '.join(new_cmd.split(' ')[1:])+' '+current_dir,stdout=sp.PIPE,shell=True).communicate()[0]
		print json.dumps({'data':result,'current_dir':current_dir,'run_dir_check':True})	
		return current_dir	
	#
	#
	
	def cd (self, current_dir, new_cmd):
		'''cd = change directory
		1. Extract desired directory
		2. Check against special values: {{ ~ $HOME .. / }}
		3. For multi-level traversal, check each level individually and modify current_dir appropriately
		'''
		
		dirs = {
			'..'	: '/'.join(current_dir.split('/')[:-1]),
			'/'		: '/'
		}
		
		try:	
			cmd1 = new_cmd.split()[1]
		except:
			cmd1 = ''
		data = ''	
		
		
		if cmd1 in ['~','$HOME']:
			#	~ $HOME
			current_dir = sp.Popen(('echo %s'%cmd1).split(),stdout=sp.PIPE).communicate()[0]
			
		elif cmd1 in dirs:
			#	.. , /
			current_dir = dirs[cmd1]	
					
		else:
			# Iteratively check each directory for possible multi-level traversal (e.g., cd ../../pics)
	
			cd_path_list = [x for x in cmd1.split('/') if x]	# check list members individually
			current_dir_tmp = copy.copy(current_dir)			# only change current_dir if all levels ok
			
			for dir in cd_path_list:
				files = sp.Popen(('ls '+current_dir_tmp).split(),stdout=sp.PIPE).communicate()[0].split()
				if dir in files and os.path.isdir( current_dir_tmp+'/'+dir ):
					current_dir_tmp += '/' + dir
				elif dir == '..' and current_dir_tmp != '/':
					current_dir_tmp = '/'.join(current_dir_tmp.split('/')[:-1])
				else:
					data = 'Directory %s not found!' %current_dir_tmp
			else:
				# all directory changes valid; proceed with current_dir change
				current_dir = current_dir_tmp
		
		print json.dumps({'data':data,'current_dir':current_dir,'run_dir_check':True})
		return current_dir
	#
	#
	
	def pwd(self,current_dir,new_cmd):
		'''Print working directory'''
		print json.dumps({'data':current_dir,'current_dir':current_dir})
		return current_dir
	#
	#
	
	def mkdir(self,current_dir,new_cmd):
		'''Make new directory'''
		cmd = 'mkdir %s/%s' %(current_dir, ''.join(new_cmd.split()[1:]))
		sp.Popen( cmd.split(' ') )
		print json.dumps({'data':'','current_dir':current_dir,'run_dir_check':True})
		return current_dir
	#
	#
	
	def rm(self,current_dir,new_cmd):
		'''Destroy file/folder'''
		cmd = ' '.join(new_cmd.split(' ')[:-1]) + ' ' + current_dir+'/'+new_cmd.split(' ')[-1]
		sp.Popen(cmd.split(' '))
		print json.dumps({'data':current_dir,'current_dir':current_dir,'run_dir_check':True})
		return current_dir
	#
	#
		
def test(data):
	with open('TEST','w') as f:
		f.write(data)
		
cmds = commands()		

def process( new_cmd ):
	aliases = {
		'show'	: 'ls -al %current_dir', 
		'lg'	: 'ls %current_dir | grep ', 
		'sg'	: 'ls -al %current_dir | grep '
	}
	
	run_dir_check = False # will set to True for directory change or mkdir command
	
	if new_cmd == 'new session':
		current_dir = os.path.dirname(os.path.abspath(__file__))
		current_session = {'history':[],'current_dir':current_dir}
		with open('current_session','w') as f:
			f.write(json.dumps(current_session))
		print json.dumps({'data':'session started','current_dir':current_dir,'run_dir_check':run_dir_check})
	
	else:
	
		with open('current_session','r') as f:
			current_session = json.loads(f.read())
		current_dir = current_session['current_dir']
	
		history = current_session['history']
		cmd0 = new_cmd.split(' ')[0]
		
	
		if cmd0 in aliases:												# aliases
			new_cmd = str(aliases[cmd0] + ' '.join(new_cmd.split(' ')[1:])).replace('%current_dir',current_dir)

		if cmd0 in [x for x in dir(cmds) if not x.startswith('__')]:	# commands class
			current_dir = getattr(cmds,cmd0)( current_dir=current_dir, new_cmd=new_cmd)	
	
		else:															# attempt to execute unknown
			result = sp.Popen(new_cmd,stdout=sp.PIPE,stderr=sp.PIPE,shell=True)
			stdout,stderr=result.communicate()
			if stdout:
				data = stdout
			else:
				data = stderr
		
			print json.dumps({	'data'			:data,
								'current_dir'	:current_dir,
								'run_dir_check'	:run_dir_check
							})
	
		history.append(new_cmd)
		current_session = {'history':history,'current_dir':current_dir}
		with open('current_session','w') as f:
			f.write(json.dumps(current_session))
#		
#
def main():
	new_cmd = json.loads(cgi.FieldStorage()['package'].value)			
	process( new_cmd )
#	
#			 

if __name__ == '__main__':
	main()