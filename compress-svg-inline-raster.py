import xml.etree.ElementTree as ET
import sys
import base64
import os
from io import StringIO, BytesIO
from PIL import Image
import glob

PREFIX_PNG = "data:image/png;base64,"
PREFIX_JPG = "data:image/jpg;base64,"
PREFIX_JPEG = "data:image/jpeg;base64,"
ATTR = "{http://www.w3.org/1999/xlink}href"
DEFAULT_NS = "http://www.w3.org/2000/svg"

for svgfile in glob.glob('images-svg-converted/*.svg'):
#with open(sys.argv[1]) as svgfile:
    with open(svgfile, 'r') as f:

        if os.path.exists('images-svg-pass2/' + os.path.basename(svgfile)):
            continue

        #print(svgfile)

        try:
            root = ET.fromstring(str(f.read())) #ET.parse(svgfile)
            #except:
            #    print('retrying')
            #    root = ET.fromstring(str(f.read()).encode('utf-8').decode('utf-8'))

            file_id = 1
            base_name = os.path.splitext(svgfile)[0]
            images = root.findall(".//{%s}image" % DEFAULT_NS)
            if len(images) < 1:
                continue

            print(svgfile)

            for i,e in enumerate(images):
                href = e.get(ATTR)

                PREFIX = None
                if href:
                    if href.startswith(PREFIX_PNG):
                        PREFIX = PREFIX_PNG
                    elif href.startswith(PREFIX_JPG):
                        PREFIX = PREFIX_JPG
                    elif href.startswith(PREFIX_JPEG):
                        PREFIX = PREFIX_JPEG

                if href and PREFIX:

                    outimage = BytesIO()
                    datastring = href[len(PREFIX):]
                    pad = len(datastring) % 4
                    datastring += "="*pad

                    decoded = base64.b64decode(datastring)
                    output = Image.open(BytesIO(decoded), formats=['PNG' if PREFIX == PREFIX_PNG else 'JPEG'])
                    #print(PREFIX, len(href), output.mode)
                    #output.load()

                    #output.save('test1-'+str(i)+'.png', 'PNG', quality=50)

                    if output.mode == 'RGBA':
                        output.load()
                        fixed = Image.new('RGB', output.size, (255,255,255))
                        fixed.paste(output, mask=output.split()[3])  # 3 is the alpha channel
                    elif output.mode != 'RGB':
                        fixed = output.convert('RGB')
                    else:
                        fixed = output

                    width, height = fixed.size
                    maxsize = 1024
                    if width > maxsize or height > maxsize:
                        if width >= height:
                            r = (maxsize/float(width))
                            h2 = max(1, int((float(height)*float(r))))
                            fixed = fixed.resize((maxsize,h2), Image.Resampling.LANCZOS)
                        else:
                            r = (maxsize/float(height))
                            w2 = max(1, int((float(width)*float(r))))
                            fixed = fixed.resize((w2,maxsize), Image.Resampling.LANCZOS)

                    fixed.save(outimage, 'JPEG', quality=60)

                    #fixed.save('test2-'+str(i)+'.jpg', 'JPEG', quality=50)

                    #sys.exit(0)

                    e.set(ATTR, PREFIX + base64.b64encode(outimage.getvalue()).decode('utf-8'))

            tree = ET.ElementTree(root)
            tree.write('images-svg-pass2/' + os.path.basename(svgfile))

        except e:
            print(e)
            print('FAILED', svgfile)

        #sys.exit(0)

#root.write(sys.argv[1])
