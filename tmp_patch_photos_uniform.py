from pathlib import Path
p = Path('/var/minis/workspace/tg-album/src/pages/Photos.vue')
s = p.read_text()
repls = [
    ('rounded-[16px]', 'rounded-[14px]'),
    ('rounded-[18px]', 'rounded-[14px]'),
    ('rounded-2xl', 'rounded-[14px]'),
    ('text-sm text-center bg-white', 'text-xs text-center bg-white'),
    ('text-xs shadow-sm', 'text-xs'),
    ('shadow-sm disabled:opacity-40', 'disabled:opacity-40'),
    ('shadow-inner', ''),
]
for a,b in repls:
    s = s.replace(a,b)
p.write_text(s)
print('patched Photos.vue')
