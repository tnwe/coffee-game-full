from pathlib import Path
import re

path = Path('frontend/src/pages/Stats.jsx')
lines = path.read_text('utf-8').splitlines()
stack = []

for i, line in enumerate(lines, start=1):
    # match opening div tags (skip self-closing <div ... />)
    for match in re.finditer(r'<div(\s[^>]*?)?>', line):
        tag = match.group(0)
        if tag.endswith('/>'):
            continue
        stack.append((i, line.strip()))

    if '</div>' in line:
        # consume one
        if stack:
            stack.pop()
        else:
            print(f'Extra closing </div> at line {i}')

if stack:
    print('Unclosed <div> tags:')
    for ln, txt in stack:
        print(f'  line {ln}: {txt}')
else:
    print('All divs balanced')
