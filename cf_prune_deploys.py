import os, json, urllib.request, urllib.error
acct=os.environ['CLOUDFLARE_ACCOUNT_ID']
token=os.environ['CLOUDFLARE_API_TOKEN']
project='tg-album'
base=f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/deployments?env=production'
headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

req=urllib.request.Request(base, headers=headers)
with urllib.request.urlopen(req) as r:
    data=json.load(r)

deploys=data.get('result', [])
success=[d for d in deploys if d.get('latest_stage',{}).get('status')=='success']
success_sorted=sorted(success, key=lambda d: d.get('created_on',''), reverse=True)
keep=success_sorted[:4]
delete=success_sorted[4:]
print('KEEP', len(keep))
for d in keep:
    print(' keep', d['id'], d.get('deployment_trigger',{}).get('metadata',{}).get('commit_hash','')[:7], d.get('created_on'))
print('DELETE', len(delete))
for d in delete:
    did=d['id']
    url=f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/deployments/{did}'
    req=urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as r:
            body=json.load(r)
        print(' deleted', did, body.get('success'))
    except urllib.error.HTTPError as e:
        print(' failed', did, e.code, e.read().decode())
