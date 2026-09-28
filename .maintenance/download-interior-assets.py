import urllib.request, urllib.parse, json, pathlib, hashlib, time
root=pathlib.Path('react-configurator/public/materials');root.mkdir(parents=True,exist_ok=True)
assets=[('teak_veneer',1.0),('white_oak_veneer',0.5),('red_oak_veneer',1.0),('cherry_veneer',1.0),('beige_wall_001',3.0)]
manifest={'schemaVersion':1,'license':'CC0-1.0','source':'https://polyhaven.com','assets':[]}
def read(url,limit):
 assert urllib.parse.urlparse(url).scheme=='https'
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'HomeInterior-AssetSetup/1.0 (+https://github.com/anuragdhar/kitchen)'})
   with urllib.request.urlopen(req,timeout=45) as r:
    data=r.read(limit+1)
    if len(data)>limit: raise ValueError('Response exceeded limit')
    return data
  except Exception:
   if attempt==2: raise
   time.sleep(2+attempt)
for asset,size in assets:
 files=json.loads(read('https://api.polyhaven.com/files/'+asset,2_000_000))
 record={'id':asset,'sourceUrl':'https://polyhaven.com/a/'+asset,'license':'CC0-1.0','physicalSizeMetres':size,'resolution':'1k','maps':{}}
 dest=root/asset;dest.mkdir(exist_ok=True)
 for source,target in [('Diffuse','basecolor'),('nor_gl','normal'),('Rough','roughness')]:
  entry=files[source]['1k']['jpg'];url=entry['url']
  assert urllib.parse.urlparse(url).hostname in ['dl.polyhaven.org','dl.polyhaven.com']
  data=read(url,12_000_000);assert data[:2]==b'\xff\xd8','Not a JPEG: '+url
  name=target+'.jpg';(dest/name).write_bytes(data)
  record['maps'][target]={'path':asset+'/'+name,'sourceUrl':url,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
  time.sleep(.25)
 manifest['assets'].append(record)
 print(asset,[(k,v['bytes']) for k,v in record['maps'].items()])
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'LICENSE.md').write_text('# Material asset licenses\n\nThe five texture sets listed in manifest.json are Poly Haven CC0-1.0 assets.\nSource and license: https://polyhaven.com/license\nWood veneer artist: Jenelle van Heerden. Beige Wall 001: Dimitrios Savva and Rico Cilliers.\nThese bundled maps are served locally; no live API is used by the application.\nDownloads use the public API with the HomeInterior-AssetSetup user agent.\nThe manifest records exact original URLs and SHA-256 hashes. No preview renders, logos or third-party Pinterest images are included.\n')
