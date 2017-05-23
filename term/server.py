#!/usr/bin/env python
import BaseHTTPServer
import CGIHTTPServer
import cgitb
import time
import subprocess as sp


def start_server():
	server=BaseHTTPServer.HTTPServer
	handler=CGIHTTPServer.CGIHTTPRequestHandler
	server_address=("", 8000)
	handler.cgi_directories=['/','/cgi-bin']

	httpd=server(server_address, handler)
	httpd.serve_forever()


def main():
	try:
		start_server()
		
	except:
		
		py_proc = sp.Popen(['ps -fA | grep python'],stdout=sp.PIPE,shell=True).communicate()[0]
		serv_proc = sp.Popen(['ps -fA | grep server'],stdout=sp.PIPE,shell=True).communicate()[0]
		
		time.sleep(.5)
		
		print
		print 'Cannot start server...'
		print 'The following information is available:'
		print '#--------python processes--------#'
		print py_proc
		print '#--------------------------------#'
		print '#--------server processes--------#'
		print serv_proc
		print '#-----------------------------------#'
		print
		print 'Kill active server.py processes running elsewhere if necessary.'
		print
		
if __name__ == '__main__':
	main()