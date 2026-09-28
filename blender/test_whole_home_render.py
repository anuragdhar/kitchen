import copy
import json
import tempfile
import unittest
from pathlib import Path
from whole_home_render_contract import SIZES, load_job, validate_job, support_fits


def sample():
    return {'schema':'a501.whole-home-render','version':1,'units':'metres','axes':'BLENDER_Z_UP',
            'preset':'day','quality':'draft','rooms':[{'id':'drawing','name':'Drawing Room',
            'bounds':[9.89,-14.37,13.21,-9.03],'artifacts':[]}]}


class RenderContractTests(unittest.TestCase):
    def test_preserves_input(self):
        job = sample()
        before = copy.deepcopy(job)
        self.assertIs(validate_job(job), job)
        self.assertEqual(job, before)

    def test_all_artifacts(self):
        for kind in SIZES:
            job = sample()
            job['rooms'][0]['artifacts'] = [{'kind':kind,'support':'Element 167'}]
            validate_job(job)

    def test_unknown_formats_and_presets(self):
        for key, value in [('version',2),('version',True),('units','mm'),('axes','Y_UP'),('preset','x'),('quality','ultra')]:
            with self.subTest(key=key, value=value):
                job = sample()
                job[key] = value
                with self.assertRaises(ValueError): validate_job(job)

    def test_bad_room_ids_and_bounds(self):
        for field, value in [('id','../escape'),('bounds',[1,2,1,4]),('bounds',[1,2,3,float('nan')]),('bounds',[1,2,3,True]),('name','')]:
            job = sample()
            job['rooms'][0][field] = value
            with self.assertRaises(ValueError): validate_job(job)

    def test_duplicate_rooms_and_supports(self):
        job = sample()
        job['rooms'].append(copy.deepcopy(job['rooms'][0]))
        with self.assertRaises(ValueError): validate_job(job)
        job['rooms'][1]['id'] = 'other'
        for room in job['rooms']:
            room['artifacts'] = [{'kind':'books','support':'Same table'}]
        with self.assertRaises(ValueError): validate_job(job)

    def test_no_unknown_or_unanchored_artifact(self):
        for item in [{'kind':'pirated-model','support':'table'}, {'kind':'books','support':''}]:
            job = sample()
            job['rooms'][0]['artifacts'] = [item]
            with self.assertRaises(ValueError): validate_job(job)

    def test_footprint_height_and_room_boundary(self):
        room = [0,-4,4,0]
        self.assertTrue(support_fits(([1,-3,.6],[2,-2,.75]),room,'wooden-bowl'))
        self.assertFalse(support_fits(([1,-3,.6],[1.1,-2,.75]),room,'wooden-bowl'))
        self.assertFalse(support_fits(([1,-3,0],[2,-2,.02]),room,'books'))
        self.assertFalse(support_fits(([3.8,-3,.6],[4.8,-2,.75]),room,'books'))

    def test_file_size_and_utf8_bom(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder)/'job.json'
            file.write_text(json.dumps(sample()),encoding='utf-8-sig')
            self.assertEqual(load_job(file)['rooms'][0]['id'],'drawing')
            file.write_text(' '*200001)
            with self.assertRaises(ValueError): load_job(file)


if __name__ == '__main__':
    unittest.main()
