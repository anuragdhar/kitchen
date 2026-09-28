import copy
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
import zipfile
from archviz_contract import blender_bounds, inspect_glb, load_bundle, validate_capture, validate_outputs, sha256


def sample():
    return {'schema':'a501.archviz-source','version':1,'units':'metres','axes':'GLTF_Y_UP','room':'kitchen',
            'sceneId':'kitchen','metresPerSourceUnit':.001,'glbSha256':'a'*64,
            'meshes':[{'id':'mesh-0','min':[0,0,0],'max':[.6,.8,.3],'triangles':12}],
            'camera':{'type':'perspective','position':[2,1.6,2.6],'quaternion':[0,0,0,1],'fov':45,'aspect':1.5}}


def glb(document):
    text=json.dumps(document).encode();text+=b' ' * (-len(text)%4)
    return struct.pack('<4sIIII',b'glTF',2,20+len(text),len(text),0x4e4f534a)+text


class ArchvizTests(unittest.TestCase):
    def test_coordinate_conversion_and_input_preservation(self):
        self.assertEqual(blender_bounds([1,2,3],[4,5,6]),([1,-6,2],[4,-3,5]))
        value=sample();before=copy.deepcopy(value);self.assertIs(validate_capture(value),value);self.assertEqual(value,before)

    def test_bad_format_camera_and_geometry(self):
        for key,value in [('version',True),('version',2),('room','../x'),('units','mm'),('axes','BLENDER_Z_UP'),('glbSha256','no'),('metresPerSourceUnit',0),('metresPerSourceUnit',float('inf')),('meshes',[])]:
            data=sample();data[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):validate_capture(data)
        for camera in [{},{**sample()['camera'],'quaternion':[0,0,0,2]},{**sample()['camera'],'fov':180}]:
            data=sample();data['camera']=camera
            with self.assertRaises(ValueError):validate_capture(data)
        data=sample();data['meshes']*=2
        with self.assertRaises(ValueError):validate_capture(data)

    def test_external_resources_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            p=Path(directory)/'scene.glb'
            for document in [{'buffers':[{'uri':'https://example.com/private'}]}, {'images':[{'uri':'../../secret.png'}]}, {'skins':[{}]}, {'animations':[{}]}]:
                p.write_bytes(glb(document))
                with self.assertRaises(ValueError):inspect_glb(p)
            p.write_bytes(glb({'asset':{'version':'2.0'}}));inspect_glb(p)
            p.write_bytes(b'not a glb')
            with self.assertRaises(ValueError):inspect_glb(p)

    def test_zip_digest_and_safe_extraction(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);out=root/'out';out.mkdir();bundle=root/'room.zip'
            data=sample();binary=glb({'asset':{'version':'2.0'}});data['glbSha256']=hashlib.sha256(binary).hexdigest()
            with zipfile.ZipFile(bundle,'w') as z:
                z.writestr('scene.json',json.dumps(data));z.writestr('scene.glb',binary);z.writestr('../escaped.txt','bad')
            manifest,p=load_bundle(bundle,out);self.assertEqual(manifest,data);self.assertEqual(p.read_bytes(),binary);self.assertFalse((root/'escaped.txt').exists())
            data['glbSha256']='0'*64;(out/'scene.json').write_text(json.dumps(data))
            with self.assertRaises(ValueError):load_bundle(out,out)

    def test_missing_duplicate_archive_entry(self):
        with tempfile.TemporaryDirectory() as directory:
            p=Path(directory)/'room.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('not-scene.json','{}')
            with self.assertRaises(ValueError):load_bundle(p,Path(directory))

    def test_gallery_detects_stale_and_corrupt_images(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);job='0123456789abcdef';folder=root/'renders/archviz'/job;folder.mkdir(parents=True)
            p=folder/'current.png';p.write_bytes(b'\x89PNG\r\n\x1a\n'+struct.pack('>I',13)+b'IHDR'+struct.pack('>II',192,128))
            image={'label':'Current','url':f'/renders/archviz/{job}/current.png','sha256':sha256(p),'size':[192,128]}
            entry={'room':'kitchen','job':job,'images':[image]}
            (folder/'provenance.json').write_text(json.dumps(entry))
            index=root/'renders/archviz/manifest.json';index.write_text(json.dumps({'schema':'a501.archviz-gallery','version':1,'renders':[entry]}))
            self.assertEqual(validate_outputs(root),1)
            p.write_bytes(b'broken')
            with self.assertRaises(ValueError):validate_outputs(root)


if __name__=='__main__':unittest.main()
