/* Klaro — shared Supabase auth guard
   Include AFTER the Supabase CDN script on every protected page:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="/auth.js"></script>
*/

const SUPABASE_URL      = 'https://rhyobhcgvrqobouqymqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeW9iaGNndnJxb2JvdXF5bXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjY0MDQsImV4cCI6MjA5MTk0MjQwNH0.Yc7wiTJ8_66uzqusGTU4dEele5B4C6ZCMlYNMf3w_3U';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  // Fast fill from session — no extra round-trip
  const emailFallback = session.user.email;
  const initialsFallback = emailFallback.slice(0, 2).toUpperCase();
  document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = emailFallback; });
  document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = initialsFallback; });
  document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = emailFallback; });

  // Fetch profile and upgrade to real name + city
  try {
    const { data: profile } = await _sb
      .from('profiles')
      .select('full_name, city')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      const displayName = profile.full_name || emailFallback;
      const initials    = displayName.slice(0, 2).toUpperCase();
      document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = initials; });
      document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = displayName; });
      if (profile.city) {
        document.querySelectorAll('[data-user-city]').forEach(el => {
          el.textContent = `Freiberufler/a · ${profile.city}`;
        });
      }
    }
  } catch { /* profile fetch is non-critical */ }
})();

async function logout() {
  await _sb.auth.signOut();
  window.location.replace('login.html');
}
