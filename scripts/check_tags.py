import re
from pathlib import Path

path = Path('frontend/src/pages/Stats.jsx')
text = path.read_text(encoding='utf-8')

for tag in ['div', 'table', 'tbody', 'thead', 'tr', 'td', 'span', 'h2', 'h3', 'form']:
    opens = len(re.findall(fr'<{tag}(\s|>)', text))
    closes = text.count(f'</{tag}>')
    if opens != closes:
        print(f'{tag}: opens={opens} closes={closes}')
