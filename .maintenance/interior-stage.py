import pathlib, hashlib, json, re
root=pathlib.Path('.')
guards={'react-configurator/src/HomeApp.jsx':'5b3545f3e139913f1c084aa0977ee2d37b37ba91ecef065c8d1757b580391771','react-configurator/package.json':'8f2c415105f221c04c25d77c1ed167cf4389be6ec97a8d3126b474eb04f8b34a','react-configurator/package-lock.json':'b580068d3bd57a0a0fa20ad5bcef13ef649f8cdf0bb58bbed57caa51f46be649'}
for name, expected in guards.items():
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected, 'Source moved: '+name
p=root/'react-configurator/src/HomeApp.jsx'
s=p.read_text();s="import InteriorStudio from './home/InteriorStudio.jsx'\n"+s
assert s.count('Home Design Studio')==1
s=s.replace('Home Design Studio','Home Interior')
anchor='  return <>\n    <HomeHeader'
assert s.count(anchor)==1
s=s.replace(anchor,'  return <>\n    <InteriorStudio/>\n    <HomeHeader')
p.write_text(s)
p=root/'react-configurator/index.html';s=p.read_text();s,n=re.subn(r'<title>.*?</title>','<title>Home Interior</title>',s);assert n==1;p.write_text(s)
p=root/'react-configurator/package.json';d=json.loads(p.read_text());d['name']='home-interior';d['scripts']['test']+=' tests/interior-inspiration.test.mjs';p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'react-configurator/package-lock.json';d=json.loads(p.read_text());d['name']='home-interior';d['packages']['']['name']='home-interior';p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'README.md';s=p.read_text();assert s.startswith('# Home Design Studio\n');s=s.replace('# Home Design Studio\n','# Home Interior\n',1);s+='\n## Whole-home interior studio\n\nOpen **Interior studio** for the room-classified reference library. See\n[Inspiration guide](docs/INSPIRATION.md). Existing kitchen save files remain compatible.\n';p.write_text(s)
print('Guarded branding integration completed; geometry and persistence unchanged.')
