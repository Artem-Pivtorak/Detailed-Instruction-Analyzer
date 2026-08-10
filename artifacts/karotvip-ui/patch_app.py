import re

filepath = r'D:\код\UI-MARTIN\Detailed-Instruction-Analyzer\artifacts\karotvip-ui\src\App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

asphalt_match = re.search(r'(<div\s+className=\"asphalt-bg\"\s+style=\{\{.*?\}\}\s*>)', content, re.DOTALL)
if not asphalt_match:
    print('Failed to find asphalt div')
    exit(1)
asphalt_str = asphalt_match.group(1)

titlebar_match = re.search(r'(\{\s*typeof\s*\(window\s*as\s*any\)\.pywebview !== \"undefined\" && \(\s*<div\s+style=\{\{\s*position:\s*\"fixed\".*?borderBottom:\s*\"1px solid rgba\(255,255,255,0\.05\)\",\s*\}\}.*?</div>\s*\)\s*\})', content, re.DOTALL)
if not titlebar_match:
    print('Failed to find titlebar')
    exit(1)
titlebar_str = titlebar_match.group(1)

content = content.replace(titlebar_str, '')

new_titlebar = titlebar_str.replace('position: "fixed",', 'flexShrink: 0,').replace('top: 0,\n              left: 0,\n              right: 0,\n', '')

new_asphalt = asphalt_str.replace('width: "100%",', 'flex: 1,').replace('height: "100%",', 'width: "100%", height: "100%",')

wrapper_open = '<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden" }}>\n'
wrapper_close = '\n      </div>'

replace_target = 'return (\n    <I18nProvider lang={language}>\n      ' + asphalt_str
new_target = 'return (\n    <I18nProvider lang={language}>\n      ' + wrapper_open + '        ' + new_titlebar + '\n      ' + new_asphalt

content = content.replace(replace_target, new_target)
content = content.replace('    </I18nProvider>', wrapper_close + '\n    </I18nProvider>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
