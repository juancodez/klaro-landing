/* Klaro — shared Supabase client + auth guard
   Load on every page after the Supabase CDN script:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="auth.js"></script>

   Public pages (login, signup, reset, new-password): guard is skipped.
   Protected pages: no session → redirect to login.html.
*/

const SUPABASE_URL      = 'https://rhyobhcgvrqobouqymqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeW9iaGNndnJxb2JvdXF5bXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjY0MDQsImV4cCI6MjA5MTk0MjQwNH0.Yc7wiTJ8_66uzqusGTU4dEele5B4C6ZCMlYNMf3w_3U';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const _PUBLIC_PAGES = ['login.html', 'signup.html', 'reset.html', 'new-password.html'];
const _isPublicPage = _PUBLIC_PAGES.some(p => window.location.href.includes(p));

// Use onAuthStateChange so we catch sessions that arrive from email confirmation
// URL-hash tokens (detectSessionInUrl) are resolved before INITIAL_SESSION fires.
_sb.auth.onAuthStateChange((event, session) => {
  if (event !== 'INITIAL_SESSION') return;

  if (_isPublicPage) {
    // On public pages: redirect to app only if already logged in
    if (session) window.location.replace('klaro-dashboard.html');
    return;
  }

  if (!session) {
    window.location.replace('login.html');
    return;
  }

  if (typeof window.identifyUser === 'function') {
    window.identifyUser(session.user.id, {
      email: session.user.email,
      created_at: session.user.created_at,
    });
  }

  // Fast fill from session — no extra round-trip
  const email    = session.user.email;
  const metaName = (session.user.user_metadata || {}).full_name || '';
  const displayName0 = metaName || email;
  const initials0 = metaName
    ? metaName.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).join('').slice(0, 2)
    : email.slice(0, 2).toUpperCase();
  document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = email; });
  document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = initials0; });
  document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = displayName0; });

  // Fetch profile for city (and name only if metadata has none)
  _sb.from('profiles')
    .select('full_name, city')
    .eq('id', session.user.id)
    .single()
    .then(({ data: profile }) => {
      if (!profile) return;
      if (!metaName && profile.full_name) {
        const displayName = profile.full_name;
        const profileInitials = profile.full_name
          .split(' ').filter(Boolean).map(w => w[0].toUpperCase()).join('').slice(0, 2);
        document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = profileInitials; });
        document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = displayName; });
      }
      if (profile.city) {
        document.querySelectorAll('[data-user-city]').forEach(el => {
          el.textContent = `Freiberufler/a · ${profile.city}`;
        });
      }
    })
    .catch(() => { /* profile fetch is non-critical */ });
});

async function logout() {
  await _sb.auth.signOut();
  window.location.replace('login.html');
}
