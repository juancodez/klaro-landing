// Klaro — Bell notifications (shared across all app pages)
// Requires: _sb from auth.js  |  id="bell-btn" on the button  |  id="bell-dot" on the dot
(async function () {
  if (typeof _sb === 'undefined') return;

  const { data: { session } } = await _sb.auth.getSession();
  if (!session) return;
  const uid = session.user.id;

  const y = new Date().getFullYear();
  const DEADLINES = [
    { label: 'UStVA Q1',        due: new Date(y,   3, 10), type: 'ustVA',  q: 1    },
    { label: 'UStVA Q2',        due: new Date(y,   6, 10), type: 'ustVA',  q: 2    },
    { label: 'UStVA Q3',        due: new Date(y,   9, 10), type: 'ustVA',  q: 3    },
    { label: 'UStVA Q4',        due: new Date(y+1, 0, 10), type: 'ustVA',  q: 4    },
    { label: 'Einkommensteuer', due: new Date(y+1, 6, 31), type: 'einkom', q: null },
  ];

  let filed = [];
  try {
    const { data } = await _sb.from('tax_declarations')
      .select('declaration_type,quarter,year,status')
      .eq('user_id', uid).eq('status', 'filed');
    filed = data || [];
  } catch (e) { /* table may not exist yet */ }

  const now = new Date();
  const active = DEADLINES
    .filter(dl => {
      const days = Math.round((dl.due - now) / 86400000);
      if (days < 0 || days > 30) return false;
      return !filed.some(f =>
        f.declaration_type === dl.type &&
        f.quarter          === dl.q   &&
        f.year             === dl.due.getFullYear()
      );
    })
    .map(dl => ({ ...dl, daysLeft: Math.round((dl.due - now) / 86400000) }));

  // Show dot when there are active deadlines
  const dot = document.getElementById('bell-dot');
  if (dot) dot.style.display = active.length > 0 ? '' : 'none';

  // Wire bell button
  const btn = document.getElementById('bell-btn');
  if (!btn) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const existing = document.getElementById('klaro-bell-panel');
    if (existing) { existing.remove(); return; }
    _klaroShowBellPanel(active, btn);
  });
}());

function _klaroShowBellPanel(items, btn) {
  const rect  = btn.getBoundingClientRect();
  const panel = document.createElement('div');
  panel.id = 'klaro-bell-panel';
  panel.style.cssText = [
    'position:fixed',
    `top:${rect.bottom + 8}px`,
    `right:${window.innerWidth - rect.right}px`,
    'z-index:9999',
    'width:292px',
    'border-radius:16px',
    'background:#fff8f1',
    'border:1px solid rgba(164,55,0,0.12)',
    'box-shadow:0 8px 32px rgba(164,55,0,0.14)',
    'overflow:hidden',
  ].join(';');

  const header = `
    <div style="padding:12px 16px 10px;border-bottom:1px solid rgba(164,55,0,0.08)">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(89,65,57,.5);margin:0">
        Plazos fiscales
      </p>
    </div>`;

  let rows = '';
  if (items.length === 0) {
    rows = `<div style="padding:18px 16px;text-align:center;font-size:13px;color:#594139">
      Al día — sin plazos próximos ✓
    </div>`;
  } else {
    rows = items.map(item => {
      const urgent  = item.daysLeft <= 7;
      const accent  = urgent ? '#DC2626' : '#D97706';
      const pillBg  = urgent ? 'rgba(239,68,68,.1)' : 'rgba(217,119,6,.1)';
      const pill    = item.daysLeft === 0 ? 'HOY' : item.daysLeft + 'd';
      const sub     = item.daysLeft === 0 ? 'Vence hoy'
                    : item.daysLeft === 1 ? 'Vence mañana'
                    : `Faltan ${item.daysLeft} días`;
      return `
        <a href="klaro-impuestos.html"
           style="display:flex;align-items:center;gap:12px;padding:10px 16px;
                  border-bottom:1px solid rgba(164,55,0,0.06);text-decoration:none;
                  transition:background .12s"
           onmouseover="this.style.background='rgba(164,55,0,0.03)'"
           onmouseout="this.style.background=''">
          <div style="flex:1;min-width:0">
            <p style="font-size:13px;font-weight:600;color:#1e1b17;margin:0">${item.label}</p>
            <p style="font-size:11px;color:#594139;margin:2px 0 0">${sub}</p>
          </div>
          <span style="font-size:10px;font-weight:800;padding:3px 8px;border-radius:8px;
                       background:${pillBg};color:${accent};flex-shrink:0">${pill}</span>
        </a>`;
    }).join('');
    rows += `
      <div style="padding:10px 12px">
        <a href="klaro-impuestos.html"
           style="display:block;text-align:center;font-size:12px;font-weight:700;
                  padding:8px;border-radius:10px;background:rgba(164,55,0,0.08);
                  color:#a43700;text-decoration:none"
           onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity=''">
          Ver todas las declaraciones →
        </a>
      </div>`;
  }

  panel.innerHTML = header + rows;
  document.body.appendChild(panel);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function close(ev) {
      if (!panel.contains(ev.target)) {
        panel.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 0);
}
