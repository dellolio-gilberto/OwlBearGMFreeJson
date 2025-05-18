addEventListener("fetch", event => {
	event.respondWith(handle(event.request))
})

/**
 * CORS Proxy for Tabletop Almanac API
 */
async function handle(request) {

  const url = new URL(request.url);

  const apiPath = url.pathname.replace(/^\/proxy/, "");
  const targetUrl = `https://api.tabletop-almanac.com/api/v1${apiPath}${url.search}`;
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      }
    });
  }
  // API request
  const apiResponse = await fetch(targetUrl, {
    // additional headers can be added here
  });

  const { status } = apiResponse;
  const contentType = apiResponse.headers.get("content-type") || "";

  // arrayBuffer for JSON
  const body = await apiResponse.arrayBuffer();

  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }
  });
}