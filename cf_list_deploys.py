import os, json, urllib.request
acct=os.environ['CLOUDFLARE_ACCOUNT_ID']
token=os.environ['CLOUDFLARE_API_TOKEN']
project='tg-album'
url=f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/deployments?env=production'
req=urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    data=json.load(r)
print(json.dumps(data, ensure_ascii=False))
