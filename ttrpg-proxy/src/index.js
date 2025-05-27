export default {  async fetch(request, env, ctx) {
  const url = new URL(request.url);
  const apiPath = url.pathname;
  let targetUrl = `https://api.tabletop-almanac.com/api/v1${apiPath}${url.search}`;
  const origin = request.headers.get("Origin");
  const auth = request.headers.get("Authorization");
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
  if (auth) {
    headers["Authorization"] = auth;
  }
  const null_item = {
    "id":0,
    "slug":"null",
    "created_at":"0000-00-00T00:00:00.0000000",
    "tags":[],
    "rules":[],
    "name":"Ops...",
    "type":"Error",
    "description":"Your item was not found.",
    "rarity":"Very Rare",
    "consumable":false,
    "sentient":false,
    "can_equip":false,
    "requires_attuning":false,
    "cost":{"id":0,"cp":404,"sp":null,"ep":null,"gp":null,"pp":null,"item":null,"itemId":0},
    "weight":null,
    "range":"",
    "spells":[],
    "source":"null",
    "license":null,
    "active":false,
    "user":null,
    "userId":"null",
    "stats":null,
    "bonus":{"id":0,
      "hp":0,
      "armor_class":0,
      "damage_vulnerabilities":null,
      "damage_resistances":null,
      "damage_immunities":null,
      "condition_immunities":null,
      "senses":[],
      "proficiency":[],
      "actions":[],
      "bonus_actions":[],
      "reactions":[],
      "special_abilities":[],
      "item":null,
      "e5_ItemId":0,
      "stats":null,
      "speed":null,
      "saving_throws":null,
      "skills":null},
    "modifiers":{"id":0,"stats":[],"item":null,"e5_ItemId":0},"charges":null,"costId":null,"e5_StatBlock_Item":null,"Party_Items":null,"ac":null}

  const null_spell = {
    "name":"Ops...",
    "desc":"Your spell was not found.",
    "higher_level":"",
    "range":"",
    "verbal":false,
    "somatic":false,
    "material":false,
    "materials":"",
    "ritual":false,
    "duration":"",
    "concentration":false,
    "casting_time":"",
    "level":0,
    "is_attack":false,
    "damage":null,
    "dc":"",
    "school":"Illusion",
    "classes":[],
    "archetypes":[],
    "circles":[],
    "upcasts":[],
    "id":"null",
    "slug":"null",
    "active":false,
    "source":"null"}

  async function resolveSpells(statblock)
  {
    for (let spell of statblock.spells) {
      let spellDBFetch = await env.EXTRA_SPELLS.get(spell);
      if (spellDBFetch) {
        statblock.spells[statblock.spells.indexOf(spell)] = JSON.parse(spellDBFetch);
      }
      else {
        let spellID = await env.ID_REMAP.get(spell);
        const apiResponse = await fetch(`https://api.tabletop-almanac.com/api/v1/e5/spell/${spellID}`, {
          headers: headers,
          // additional headers can be added here
        });
        spellDBFetch = await apiResponse.json();
        if (spellDBFetch.detail === "Slug null not found in database") {
          console.error(`404 - Spell ${spell} not found in database, using null spell.`);
          spellDBFetch = null_spell;
        }
        statblock.spells[statblock.spells.indexOf(spell)] = spellDBFetch;
      }
    }
    return statblock;
  }

  async function resolveItems(statblock)
  {
    for (let equipment of statblock.equipment) {
      let itemDBFetch = await env.EXTRA_ITEMS.get(equipment.item);
      if (itemDBFetch) {
        itemDBFetch = JSON.parse(itemDBFetch);
        delete itemDBFetch.cost.itemId;
        delete itemDBFetch.cost.item
        delete itemDBFetch.bonus.e5_ItemId;
        delete itemDBFetch.bonus.item;
      }
      else {
        let itemID = await env.ID_REMAP.get(equipment.item);
        const apiResponse = await fetch(`https://api.tabletop-almanac.com/api/v1/e5/item/${itemID}`, {
          headers: headers,
          // additional headers can be added here
        });
        itemDBFetch = await apiResponse.json();
        if (itemDBFetch.detail === "Slug null not found in database") {
          console.error(`404 - Item ${equipment.item} not found in database, using null item.`);
          itemDBFetch = null_item;
        }
      }
      statblock.equipment[statblock.equipment.indexOf(equipment)].item = itemDBFetch;
    }
    return statblock;
  }

  async function resolveStatblock(statblock) {
    try {
      statblock = await resolveSpells(statblock);
      statblock = await resolveItems(statblock);
    }
    catch (error) {
      console.error("Error resolving statblock:", error);
      return {
        ...statblock,
        error: "Failed to resolve statblock data."
      };
    }
    return statblock;
  }

  function validateAndClassify(json)
  {
    const templates = {
    Statblock: [
      "name", "type", "alignment",
      "armor_class.value", "hp.value", "speed.walk",
      "stats.strength", "stats.dexterity", "stats.constitution",
      "saving_throws", "skills", "damage_immunities",
      "senses", "languages", "challenge_rating", "actions", "slug"
    ],
    Spell: [
      "name", "id", "slug", "desc", "level", "school", "range",
      "verbal", "somatic", "material", "duration", "casting_time"
    ],
    Item: [
      "name", "id", "slug", "type", "description", "rarity", "cost",
      "consumable", "sentient", "can_equip", "requires_attuning"
    ]
    }
    for (const [type, fields] of Object.entries(templates)) {
      const missing = fields.filter(field => {
        const keys = field.split(".");
        let value = json;
        for (const key of keys) {
          if (value && typeof value === "object" && key in value) {
            value = value[key];
          } else {
            return true; // Field is missing
          }
        }
        return false; // Field exists
      }
      );
    if (missing.length === 0) {
        return type; // All fields exist for this type
      }
    };
    return "Invalid";
  }

  async function crossSearch(type)
  {
    try {
      const DATABASE = type === "Statblock" ? env.EXTRA_STATBLOCKS : type === "Spell" ? env.EXTRA_SPELLS : env.EXTRA_ITEMS;
      let DBList = await DATABASE.list();
      let itemSkip = 0;
      const urlParams = new URLSearchParams(url.search);
      const searchedName = urlParams.get("search_string");
      let take = urlParams.get("take");
      const searchRegex = new RegExp(String.raw`\b${searchedName}`, "i");
      if (type === "Item")
        {
          targetUrl = targetUrl.replace("/search", "");
          urlParams.set('take', '99999');
          url.search = urlParams.toString();
          targetUrl.replace(/\?.*/, "");
          targetUrl += url.search;
          itemSkip = urlParams.get('skip');
        }
      const apiResponse = await fetch(targetUrl, {headers: headers,});
      let apiSearchBuffer = await apiResponse.arrayBuffer();
      const apiTypedArray = new Uint8Array(apiSearchBuffer);
      const decoder = new TextDecoder();
      let searchResults = JSON.parse(decoder.decode(apiTypedArray));
      if (type === "Item")
          searchResults = searchResults.filter(item => item.name.match(searchRegex));
      for (const key in DBList.keys) {
        let object = await DATABASE.get(DBList.keys[key].name);
        object = JSON.parse(object);
        if (object.name.match(searchRegex))
        {
          if (type === "Statblock")
            object = await resolveStatblock(object);
          searchResults.pop();
          searchResults.unshift(object);
        }
      }
      if (type === "Item")
      {
        for (let i = 0; i < itemSkip; i++)
          searchResults.shift();
        if (searchResults.length > take)
          searchResults = searchResults.slice(0, take);
      }
      if(searchedName === null || searchedName === "")
        console.log(`${type} search completed with ${searchResults.length} results.`);
      else
        console.log(`${type} search completed for ${searchedName} with ${searchResults.length} results.`);
      searchResults = JSON.stringify(searchResults);
      return new Response(searchResults, {
        status: 200,
        headers: headers
      });
    } catch (error) {
      console.error("Error during cross-search:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: headers
      });
    }
  }
  
async function editResponse(type){
  try {
    const requestedID = apiPath.replace(new RegExp(`^/edit/${type.toLowerCase()}/`), "");
    const DATABASE = type === "Statblock" ? env.EXTRA_STATBLOCKS : type === "Spell" ? env.EXTRA_SPELLS : env.EXTRA_ITEMS;
    let DBFetch = await DATABASE.get(requestedID);
    if (DBFetch) {
      let parsedData = JSON.parse(DBFetch);
      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: headers
      });
    }
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: headers
    });
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: headers
    });
  }
}

  if (request.method === "OPTIONS") {
    delete headers["Content-Type"];
    return new Response(null, {
      status: 204,
      headers: headers
    });
  }

  if (request.method === "POST") {
      try {
        const data = await request.json();
        const dataType = validateAndClassify(data);
        if (dataType === "Statblock")
          await env.EXTRA_STATBLOCKS.put(data.slug, JSON.stringify(data));
        else if (dataType === "Spell")
          await env.EXTRA_SPELLS.put(data.id, JSON.stringify(data));
        else if (dataType === "Item")
          await env.EXTRA_ITEMS.put(data.id, JSON.stringify(data));
        else
          throw new Error("Invalid JSON");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: headers
        });
      } catch (error) {
        console.error("Error processing POST request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: headers
        });
      }
    }

  if (apiPath.startsWith("/e5/statblock/search")) {
    return await crossSearch("Statblock");
  } else if (apiPath.startsWith("/e5/spell/search")) {
    return await crossSearch("Spell");
  } else if (apiPath.startsWith("/e5/item/search")) {
    return await crossSearch("Item");
  } else if (apiPath.startsWith("/edit/statblock/")) {
    return await editResponse("Statblock");
  } else if (apiPath.startsWith("/edit/spell/")) {
    return await editResponse("Spell");
  } else if (apiPath.startsWith("/edit/item/")) {
    return await editResponse("Item");
  } else if (apiPath.startsWith("/e5/statblock/")) {
    try {
      const requestedSlug = apiPath.replace(/^\/e5\/statblock\//, "");
      let DBFetch = await env.EXTRA_STATBLOCKS.get(requestedSlug);
      if (DBFetch) {
        let parsedData = JSON.parse(DBFetch);
        parsedData = await resolveStatblock(parsedData);
        return new Response(JSON.stringify(parsedData), {
          status: 200,
          headers: headers
      });
      } else {
        return new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: headers
        });
      }
    } catch (error) {
      console.error("Error fetching statblock data:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: headers
      });
    }
  }

  const apiResponse = await fetch(targetUrl, {headers: headers});
  const { status } = apiResponse;
  const contentType = apiResponse.headers.get("content-type") || "";
  const body = await apiResponse.arrayBuffer();
  headers["Content-Type"] = contentType;

  return new Response(body, {
    status,
    headers: headers
  });
  }
}
