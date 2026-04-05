from pathlib import Path
import json,re

p = Path('/var/minis/workspace/tg-album/src/pages/PublicHome.vue')
text = p.read_text()

if "const iconVersion = ref('')" not in text:
    text = text.replace("const installTip = ref('')\nconst isStandalone = ref(false)", "const installTip = ref('')\nconst iconVersion = ref('')\nconst isStandalone = ref(false)")

text = re.sub(r"const iconUrl = computed\(\(\) => slug.value \? `/api/private-albums/\$\{encodeURIComponent\(slug.value\)\}/icon\.svg` : '/icon\.svg'\)", "const iconUrl = computed(() => slug.value ? `/api/private-albums/${encodeURIComponent(slug.value)}/icon.svg${iconVersion.value ? `?v=${iconVersion.value}` : ''}` : '/icon.svg')", text)
text = text.replace("setMeta('theme-color', '#2563eb')", "setMeta('theme-color', '#ffffff')")
text = text.replace("setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')", "setMeta('apple-mobile-web-app-status-bar-style', 'default')")
text = text.replace("  albumTitle.value = data.name || '私密相册'\n    slug.value = pureSlug\n    setManifestForSlug(pureSlug)\n    syncHead()", "  albumTitle.value = data.name || '私密相册'\n    slug.value = pureSlug\n    iconVersion.value = data.icon_version || ''\n    setManifestForSlug(pureSlug)\n    syncHead()")
text = text.replace("  slug.value = ''\n  albumTitle.value = '相册系统'", "  slug.value = ''\n  iconVersion.value = ''\n  albumTitle.value = '相册系统'")
text = text.replace("<div class=\"min-h-screen text-slate-900 font-sans\" :class=\"[rootClass, isStandalone ? 'pb-6 standalone-safe' : '']\">", "<div class=\"min-h-screen text-slate-900 font-sans bg-white\" :class=\"[rootClass, isStandalone ? 'pb-6 standalone-safe' : '']\">")

p.write_text(text)

pkg=Path('/var/minis/workspace/tg-album/package.json')
j=json.loads(pkg.read_text())
j['version']='1.1.5'
pkg.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\\n')
login=Path('/var/minis/workspace/tg-album/src/pages/Login.vue')
login.write_text(re.sub(r'版本 v[0-9.]+','版本 v1.1.5',login.read_text()))
print('patched PublicHome iconVersion and bumped to 1.1.5')
