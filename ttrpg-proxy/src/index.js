export default {  async fetch(request, env, ctx) {
  const url = new URL(request.url);
  const apiPath = url.pathname;
  const targetUrl = `https://api.tabletop-almanac.com/api/v1${apiPath}${url.search}`;
  const origin = request.headers.get("Origin");
  const auth = request.headers.get("Authorization");
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      }
    });
  }

  if (request.method === "POST") {
      try {
        const data = await request.json();
        await env.EXTRA_STATBLOCKS.put(data.slug, JSON.stringify(data));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
          }
        });
      }
    }

  const headers = {};
  if (auth) {
    headers["Authorization"] = auth;
  }

  if (apiPath.startsWith("/e5/statblock/search")) {
    let DB = await env.EXTRA_STATBLOCKS.list();
    const searchedName = new URLSearchParams(url.search).get("search_string");
    const searchRegex = new RegExp(String.raw`^${searchedName}`, "i");
    console.log("searchedName", searchedName);
    const searchResults = [];
    for (const key in DB.keys) {
      const statblock = await env.EXTRA_STATBLOCKS.get(DB.keys[key].name);
      console.log("statblock", JSON.parse(statblock).name);
      if (searchedName && JSON.parse(statblock).name.match(searchRegex))
        searchResults.push(statblock);
    }
    return new Response(searchResults, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      }
    });
  }
  else {
    const requestedSlug = apiPath.replace(/^\/e5\/statblock\//, "");
    console.log("requestedSlug", requestedSlug);
    let DBFetch = await env.EXTRA_STATBLOCKS.get(requestedSlug);
    console.log("DBFetch", DBFetch);
    if (DBFetch) {
      const parsedData = JSON.parse(DBFetch);
      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        }
    });
  }
  
  }
  const apiResponse = await fetch(targetUrl, {
    headers: headers,
    // additional headers can be added here
  });

  const { status } = apiResponse;
  const contentType = apiResponse.headers.get("content-type") || "";
  const body = await apiResponse.arrayBuffer();

  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }
  });
  }
}