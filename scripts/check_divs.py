from pathlib import Path
import re

text = Path('frontend/src/pages/Stats.jsx').read_text('utf-8')
opens = len(re.findall(r'<div(\s[^>]*?)?>', text))
closes = text.count('</div>')
print(f'opens={opens} closes={closes}')

lines = text.splitlines()
print('\nLast 20 lines:')
for i, line in enumerate(lines[-20:], start=len(lines)-19):
    print(f'{i:04d}: {line}')
