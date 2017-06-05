#!/usr/bin/env python

'''Look for running server.py process and kill it if found'''

import subprocess as sp

def main():

	cmd = 'ps -fA | grep python'
	results = sp.Popen([cmd],stdout=sp.PIPE,shell=True).communicate()[0].split('\n')
	
	for line in results:
		if ' server.py' in line:
			print 'Found suspected running server process...'
			pid = line.strip().split(' ')[1]
			cmd = 'kill %s' %pid
			sp.Popen(cmd.split())
			print 'Attempted kill complete'
	return
		

if __name__ == '__main__':
	main()