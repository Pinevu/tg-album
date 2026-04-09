import os, urllib.request, urllib.error
acct=os.environ['CLOUDFLARE_ACCOUNT_ID']
token=os.environ['CLOUDFLARE_API_TOKEN']
project='tg-album'
url=f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/deployments?env=production'
req=urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as r:
        print(r.status)
        print(r.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP', e.code)
    print(e.read().decode())
