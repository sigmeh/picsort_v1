#!/usr/bin/env python
'''
Handle operations coming from picsort.js via submit_picsort() 
  and feed data back into function for processing (as callback_function, args)

For callback_function picsort_current_dir, create thubnail library for all relevant pictures
  in the current_dir; thumbnail generation requires the Python Imaging Library (PIL)
  Each thumbnail photo is stored in the newly-created thumbnails gallery; each photo 
    bears its original title
  Then, pass list of file names back to picsort.js for display
'''
import cgi
import subprocess as sp
import json
import re
import os
import sys
import throwup_server
import time
import requests
from PIL import Image
print


	
	
def test(msg):
	with open('TEST','a') as f:
		f.write(str(msg)+'\n')



def bash( cmd, **shell):
	return sp.Popen(cmd if shell else cmd.split(' '),stdout=sp.PIPE,shell = shell if shell else False).communicate()[0]



def get_pic_list( file_list ):
	pic_formats = 'jpg jpeg png tif tiff bmp gif'.split(' ')
	return [x for x in file_list if x.split('.')[-1] in pic_formats]
	


def make_thumbnails(pic_list, current_dir):
	''' Create thumbnails directory at picsort_thumbnails
		Utilize PIL to create thumbnail gallery for viewing/sorting '''
		
	if os.path.isdir('%s/picsort_thumbnails' % current_dir):	#avoid overwriting previous thumbnails
		return
	
	bash('mkdir %s/picsort_thumbnails' % current_dir)
	
	for pic in pic_list: 	
		im = Image.open('%s/%s' % (current_dir, pic))
		new_size = 200,200
		im.thumbnail(new_size)
		im.save('%s/picsort_thumbnails/%s' % (current_dir, pic))
		time.sleep(.1)



def perform_tasks(data, current_dir):
	'''	Extract and follow instructions from data
		Return callback function and arguments to that function'''
	
	callback_function = data['instructions']
	
	
	if callback_function == 'populate_dir_list':
		#ls_contents = bash('ls '+current_dir)
		cmd = 'ls '+current_dir
		ls_contents = [x for x in sp.Popen('ls '+current_dir,stdout=sp.PIPE,shell=True).communicate()[0].split('\n') if x]
		realpath_contents = [current_dir+'/'+x for x in ls_contents]
		dir_list = [x.split('/')[-1] for x in realpath_contents if os.path.isdir(x)]
		
		return callback_function, dir_list
	
	
	if callback_function == 'picsort_current_dir':	
		port = 8004	
		try:			
			pic_list = get_pic_list( json.loads( requests.get( 'http://127.0.0.1:%s/filelist_throwup' % port).text ) )
			test(pic_list)
		except Exception as e:
			test(e)
			throwup_server.throwup( path_to_dir=current_dir, port=port )
			pic_list = get_pic_list( json.loads( requests.get( 'http://127.0.0.1:%s/filelist_throwup' % port).text ) )
			make_thumbnails( pic_list, current_dir )

		return callback_function, pic_list
	
		
	
def main():
	''' Receive data from picsort.js via submit_picsort(); commands come as data['instructions'] 
		Get current_dir from current_session (saved in local root folder)
		Perform intended task in perform_tasks()
		Return callback_function (same as calling function) and its arguments to picsort.js'''
		
	data = cgi.FieldStorage()['package'].value
	data = json.loads(data)

	with open('current_session','r') as f:
		current_session = json.loads(f.read())
	current_dir = current_session['current_dir']
	
	callback_function, args = perform_tasks(data, current_dir)
	
	print json.dumps({
		'callback_function'	: callback_function,
		'args'				: args
	})
	


if __name__ == '__main__':
	main()