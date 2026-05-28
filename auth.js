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
  // Populate any user-email placeholders in the page
  const emailEls = document.querySelectorAll('[data-user-email]');
  emailEls.forEach(el => { el.textContent = session.user.email; });

  // Populate initials avatars
  const avatarEls = document.querySelectorAll('[data-user-initials]');
  const initials = session.user.email.slice(0, 2).toUpperCase();
  avatarEls.forEach(el => { el.textContent = initials; });
})();

async function logout() {
  await _sb.auth.signOut();
  window.location.replace('login.html');
}
