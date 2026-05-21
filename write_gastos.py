content = open('write_gastos_content.html', 'r', encoding='utf-8').read()
with open('klaro-gastos.html', 'w', encoding='utf-8') as f:
    f.write(content)
import os
print('Written', os.path.getsize('klaro-gastos.html'), 'bytes')
