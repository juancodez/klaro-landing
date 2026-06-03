/* Klaro — PostHog analytics
   Load on every page BEFORE auth.js:
   <script src="analytics.js"></script>

   Replace phc_YOUR_POSTHOG_PROJECT_TOKEN with your Project API Token
   from eu.posthog.com → Settings → Project → Project token
*/

// PostHog snippet — async, non-blocking, queues calls until library loads
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags bootstrapData".split(" "),i=0;i<o.length;i++)g(u,o[i]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||(window.posthog=[]));

posthog.init('phc_BtyXp86Kp3XN55ug7EjVwTbVAvzYwr5mJBwCYoFq3ax4', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',
});

// Thin wrappers used by every page
window.track = function(event, props) {
  posthog.capture(event, props || {});
};

// Called from auth.js after Supabase session resolves
window.identifyUser = function(userId, props) {
  posthog.identify(userId, props || {});
};
