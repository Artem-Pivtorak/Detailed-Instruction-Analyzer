import sys
import re

filepath = r'D:\код\UI-MARTIN\Detailed-Instruction-Analyzer\artifacts\karotvip-ui\src\App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'const [isNativeMaximized, setIsNativeMaximized]' not in content:
    state_decl = '  const [isNativeMaximized, setIsNativeMaximized] = useState(false);\n'
    idx = content.find('const [windowTransition')
    content = content[:idx] + state_decl + content[idx:]

effect_code = '''
  useEffect(() => {
    const handleResize = () => {
      const isMax = window.outerWidth >= window.screen.availWidth - 5;
      setIsNativeMaximized(isMax);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
'''
if 'const handleResize = () =>' not in content:
    idx2 = content.find('// Auto-scroll to bottom of console')
    if idx2 != -1:
        content = content[:idx2] + effect_code + content[idx2:]

wrapper_match = re.search(r'(<div style=\{\{\s*display:\s*"flex",\s*flexDirection:\s*"column",\s*width:\s*"100%",\s*height:\s*"100%",\s*overflow:\s*"hidden"\s*\}\}>)', content)
if wrapper_match:
    old_wrapper = wrapper_match.group(1)
    new_wrapper = old_wrapper.replace('overflow: "hidden"', 'overflow: "hidden", padding: isNativeMaximized ? "8px" : "0px"')
    content = content.replace(old_wrapper, new_wrapper)
else:
    print('Wrapper not found!')
    sys.exit(1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
