from pathlib import Path
import json,re
pkg=Path('/var/minis/workspace/tg-album/package.json')
j=json.loads(pkg.read_text())
j['version']='1.1.3'
pkg.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
login=Path('/var/minis/workspace/tg-album/src/pages/Login.vue')
login.write_text(re.sub(r'版本 v[0-9.]+','版本 v1.1.3',login.read_text()))
print('bumped to 1.1.3')
