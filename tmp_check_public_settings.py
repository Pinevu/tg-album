import json, urllib.request
url='https://img.5i.wiki/api/public/photos'
with urllib.request.urlopen(url) as r:
    data=json.load(r)
print('has_settings=', 'settings' in data)
print('site_title=', data.get('settings',{}).get('site_title'))
print('public_layout_mode=', data.get('settings',{}).get('public_layout_mode'))
print('lazy_load_enabled=', data.get('settings',{}).get('lazy_load_enabled'))
print('results_count=', len(data.get('results',[])))
