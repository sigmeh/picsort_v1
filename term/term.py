#!/usr/bin/env python
import cgi
import subprocess as sp
#import session_server
import json
import os
import sys
print


class commands(object):	
	def __init__(self):
		pass
	
	def up(self,current_dir,new_cmd):
		'''Move up file hierarchy one unit (unless at root dir) and `ls` (new) dir contents'''	
		if current_dir != '/':
			current_dir = '/'.join(current_dir.split('/')[:-1])
			if not current_dir:
				current_dir = '/'
		self.ls(current_dir,new_cmd)
		return current_dir
	
			
	def ls(self,current_dir,new_cmd):
		'''Perform `ls` operation on current_dir'''
		result = sp.Popen('ls '+' '.join(new_cmd.split(' ')[1:])+' '+current_dir,stdout=sp.PIPE,shell=True).communicate()[0]
		print json.dumps({'data':result,'current_dir':current_dir,'run_dir_check':True})	
		return current_dir
	
	
	def cd (self, current_dir, new_cmd):
		'''Change directory'''
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
			current_dir = sp.Popen(('echo %s'%cmd1).split(),stdout=sp.PIPE).communicate()[0]
			
		elif cmd1 in dirs:
			current_dir = dirs[cmd1]

		else:	
		
			files = sp.Popen(('ls '+current_dir).split(),stdout=sp.PIPE).communicate()[0]
			
			#new_dir = new_cmd.split()[1]
			if cmd1 in files.split() and os.path.isdir(current_dir+'/'+cmd1):
				current_dir = current_dir + '/' + cmd1
				data = ''
			else:
				data = 'Directory not found'
		print json.dumps({'data':data,'current_dir':current_dir,'run_dir_check':True})
		return current_dir
	
	
	def pwd(self,current_dir,new_cmd):
		'''Print working directory'''
		print json.dumps({'data':current_dir,'current_dir':current_dir})
		return current_dir
	
	
	def mkdir(self,current_dir,new_cmd):
		'''Make new directory'''
		cmd = 'mkdir %s/%s' %(current_dir, ''.join(new_cmd.split()[1:]))
		sp.Popen( cmd.split(' ') )
		print json.dumps({'data':'','current_dir':current_dir,'run_dir_check':True})
		return current_dir
	
	def rm(self,current_dir,new_cmd):
		'''Destroy file/folder'''
		cmd = ' '.join(new_cmd.split(' ')[:-1]) + ' ' + current_dir+'/'+new_cmd.split(' ')[-1]
		sp.Popen(cmd.split(' '))
		print json.dumps({'data':current_dir,'current_dir':current_dir,'run_dir_check':True})
		return current_dir
		
def test(data):
	with open('TEST','w') as f:
		f.write(data)
		
cmds = commands()		


def main():
	
	aliases = {
		'show'	: 'ls -al %current_dir', 
		'lg'	: 'ls %current_dir | grep ', 
		'sg'	: 'ls -al %current_dir | grep '
	}
	
	run_dir_check = False # will set to True for directory change or mkdir command
	
	new_cmd = json.loads(cgi.FieldStorage()['package'].value)

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
		
		if cmd0 in aliases:
			new_cmd = str(aliases[cmd0] + ' '.join(new_cmd.split(' ')[1:])).replace('%current_dir',current_dir)
	
		if cmd0 in [x for x in dir(cmds) if not x.startswith('__')]:
			current_dir = getattr(cmds,cmd0)(current_dir=current_dir,new_cmd=new_cmd)	
		
		else:
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
				 

if __name__ == '__main__':
	main()