import urllib.parse

url = 'mongodb+srv://Priiyanka:Prii%401234@priiyankanaturenest.gzmmbgf.mongodb.net/'
parsed = urllib.parse.urlparse(url)

print('Parsed components:')
print('  Scheme:', parsed.scheme)
print('  Username:', parsed.username)
print('  Password:', parsed.password)
print('  Hostname:', parsed.hostname)
print('  Path (database):', parsed.path)
print()
print('Password decoded:', urllib.parse.unquote_plus(parsed.password or ''))