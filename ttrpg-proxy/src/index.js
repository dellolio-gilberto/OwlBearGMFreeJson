addEventListener("fetch", event => {
	event.respondWith(handle(event.request))
})

/**
 * Proxy CORS generico per API Tabletop Almanac
 */
async function handle(request) {

  const url = new URL(request.url);

  // Se l’utente chiama /proxy/... → inoltra a /e5/statblock/...
  // Puoi usare path direttamente:
  const apiPath = url.pathname.replace(/^\/proxy/, "");
  const targetUrl = `https://api.tabletop-almanac.com/api/v1${apiPath}${url.search}`;
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    // Rispondi subito al preflight
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  // Esegui la richiesta all’API
  const apiResponse = await fetch(targetUrl, {
    // se servono header particolari, aggiungili qui
  });

  // Recupera il corpo e i header
  const { status } = apiResponse;
  const contentType = apiResponse.headers.get("content-type") || "";

  // Usa arrayBuffer per supportare JSON e anche altri content type
  const body = await apiResponse.arrayBuffer();

  // Costruisci la risposta con CORS abilitato
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": origin || "*",            // abilita CORS per tutti
      "Access-Control-Allow-Methods": "GET,OPTIONS", // solo GET/OPTIONS
      "Access-Control-Allow-Headers": "Content-Type" // header permessi
    }
  });
}