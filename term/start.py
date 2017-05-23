#!/usr/bin/env python
import subprocess as sp
import time
import requests
import kill_server

def check_localhost():
	'''404 message implies a server at port 8000 is running with a root directory elsewhere'''
	'''if so, kill it'''
	r = requests.get('http://127.0.0.1:8000/term')
	if r.status_code == 404:
		print 'Got 404 message; attempting server kill'
		
		kill_server.main()
	else:
		print 'Returned status code:',r.status_code
		if r.status_code == 200:
			print 'Opening page...'
			#status ok; server running from current directory; open page
			cmd = 'open http://localhost:8000/term'.split()
			sp.Popen(cmd)	#open in default browser
			return
			
	start()

def start():
	port = 8000
	try:
		print 'Starting new python server on port 8000'
		cmd = 'python server.py &'.split()
		sp.Popen(cmd)
		time.sleep(.5)	
		
		cmd = 'open http://localhost:8000/term'.split()
		sp.Popen(cmd)	#open in default browser
		
	except:
		time.sleep(.5)
		print 'Cannot start server.'
		
		
def main():
	try:
		check_localhost()
		
	except:
		'''no connection to localhost found; start server'''
		start()

	
		
if __name__ == '__main__':
	main()

