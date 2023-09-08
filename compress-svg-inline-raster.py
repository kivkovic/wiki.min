import xml.etree.ElementTree as ET
import sys
import base64
import os
from io import StringIO
from PIL import Image
import glob

PREFIX_PNG = "data:image/png;base64,"
PREFIX_JPG = "data:image/jpg;base64,"
ATTR = "{http://www.w3.org/1999/xlink}href"
DEFAULT_NS = "http://www.w3.org/2000/svg"

for svgfile in glob.glob('images/*.svg'):
#with open(sys.argv[1]) as svgfile:
    with open(svgfile, 'r', errors='replace') as f:

        #print(svgfile)

        #try:
        root = ET.fromstring(str(f.read())) #ET.parse(svgfile)
        #except:
        #    print('retrying')
        #    root = ET.fromstring(str(f.read()).encode('utf-8').decode('utf-8'))

        file_id = 1
        base_name = os.path.splitext(svgfile)[0]
        images = root.findall(".//{%s}image" % DEFAULT_NS)
        if len(images) < 1:
            continue

        '''
        for e in images:
            href = e.get(ATTR)
            if href and href.startswith(PREFIX_PNG):
                pngimage = StringIO.StringIO()
                jpgimage = StringIO.StringIO()
                pngimage.write(base64.b64decode(href[len(PREFIX_PNG):]))
                Image.open(pngimage).save(jpgimage, "JPEG")
                e.set(ATTR, PREFIX_JPG + base64.b64encode(jpgimage.getvalue()))
        '''

#root.write(sys.argv[1])
