import json, os, urllib.request
acct = os.environ['CLOUDFLARE_ACCOUNT_ID']
token = os.environ['CLOUDFLARE_API_TOKEN']
project = 'tg-album'
url = f'https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/deployments?env=production'
req = urllib.request.Request(url, headers={
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
})
with urllib.request.urlopen(req) as r:
    data = json.load(r)
out = '/var/minis/offloads/tg_album_cf_deploys.json'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(out)
print('success=', data.get('success'))
res = data.get('result') or []
print('count=', len(res))
for i, item in enumerate(res[:10], 1):
    env = item.get('environment')
    if isinstance(env, dict):
        env = env.get('name')
    src = item.get('source') if isinstance(item.get('source'), dict) else {}
    latest = item.get('latest_stage') if isinstance(item.get('latest_stage'), dict) else {}
    print(f'--- #{i} ---')
    print('id=', item.get('id'))
    print('url=', item.get('url') or ((item.get('aliases') or [None])[0]))
    print('status=', latest.get('status'))
    print('created_on=', item.get('created_on'))
    print('modified_on=', item.get('modified_on'))
    print('env=', env)
    print('branch=', src.get('branch'))
    print('commit_hash=', src.get('commit_hash'))
    print('commit_message=', src.get('commit_message'))
