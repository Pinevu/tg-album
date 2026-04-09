import base64, hashlib, hmac, json, time
header = {'alg':'HS256','typ':'JWT'}
payload = {'uid':1,'username':'admin','exp':int(time.time())+3600}
def b64(obj):
    raw = json.dumps(obj,separators=(',',':')).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b'=')
secret = b'tg-album-fallback-secret'
head = b64(header)
body = b64(payload)
msg = head + b'.' + body
sig = base64.urlsafe_b64encode(hmac.new(secret, msg, hashlib.sha256).digest()).rstrip(b'=')
print((msg + b'.' + sig).decode())
