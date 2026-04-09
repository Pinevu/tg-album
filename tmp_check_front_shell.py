import urllib.request
for path in ['https://img.5i.wiki/','https://img.5i.wiki/login']:
    html=urllib.request.urlopen(path).read().decode('utf-8','ignore')
    print('---', path, '---')
    print('has 相册系统 =', '相册系统' in html)
    print('len =', len(html))
