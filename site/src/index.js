const CANONICAL_HOST = "rentresilience.org";

// Hosts that 301 to the canonical domain. rent.kylebrodeur.xyz deliberately
// keeps serving content directly: it is a verified Base app domain.
const REDIRECT_HOSTS = new Set([
  "rentresilience.xyz",
  "www.rentresilience.xyz",
  "www.rentresilience.org",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
