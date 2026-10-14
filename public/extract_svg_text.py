import re
with open('MacBook Pro 16_ - 43.svg', 'r') as f:
    content = f.read()
texts = re.findall(r'>([^<]{2,})<', content)
for t in texts:
    t = t.strip()
    if t and any(c.isalpha() for c in t) and len(t) < 500:
        print(repr(t))
