const DDG = require("duck-duck-scrape");

function detect(classification) {
  return classification.intents.some((i) => i.type === "time_query");
}

function detectQueryType(userMessage) {
  const msg = userMessage.toLowerCase();

  // World time check — "time in X" / "what time in X"
  const worldMatch = msg.match(/time\s+(?:is it\s+)?in\s+(.+?)[\s?.!]*$/i);
  if (worldMatch) return { type: "world_time", location: worldMatch[1].trim() };

  if (/what time/i.test(msg) || /current time/i.test(msg)) return { type: "time" };
  if (/what day/i.test(msg) || /day of the week/i.test(msg) || /day is it/i.test(msg)) return { type: "day" };
  if (/what('s| is) the date/i.test(msg) || /today('s| is)? date/i.test(msg) || /current date/i.test(msg)) return { type: "date" };
  if (/what year/i.test(msg)) return { type: "year" };
  if (/what month/i.test(msg)) return { type: "month" };

  if (/time/i.test(msg)) return { type: "time" };
  if (/date/i.test(msg)) return { type: "date" };
  if (/day/i.test(msg)) return { type: "day" };

  return { type: "datetime" };
}

function formatLocal(queryType) {
  const now = new Date();

  switch (queryType) {
    case "time":
      return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    case "date":
      return now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    case "day":
      return now.toLocaleDateString("en-US", { weekday: "long" });
    case "year":
      return String(now.getFullYear());
    case "month":
      return now.toLocaleDateString("en-US", { month: "long" });
    case "datetime":
    default:
      return now.toLocaleString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });
  }
}

const LOCATION_HINTS = {
  london: "London, UK",
  paris: "Paris, France",
  sydney: "Sydney, Australia",
  mumbai: "Mumbai, India",
};

async function getWorldTime(location) {
  try {
    const hinted = LOCATION_HINTS[location.toLowerCase()] || location;
    const result = await DDG.time(hinted);
    if (!result || !result.locations || result.locations.length === 0) return null;

    const loc = result.locations[0];
    const dt = loc.time.datetime;
    const tz = loc.time.timezone;

    const hour = dt.hour > 12 ? dt.hour - 12 : dt.hour || 12;
    const ampm = dt.hour >= 12 ? "PM" : "AM";
    const minute = String(dt.minute).padStart(2, "0");
    const timeStr = `${hour}:${minute} ${ampm}`;

    return {
      time: timeStr,
      timezone: tz.zonename,
      abbreviation: tz.zoneabb,
      city: loc.geo.name,
      country: loc.geo.country.name,
      formatted: `${timeStr} ${tz.zoneabb} in ${loc.geo.name}, ${loc.geo.country.name}`,
    };
  } catch {
    return null;
  }
}

async function execute(userMessage) {
  const query = detectQueryType(userMessage);

  if (query.type === "world_time") {
    const worldResult = await getWorldTime(query.location);
    if (worldResult) {
      return {
        type: "datetime",
        success: true,
        queryType: "world_time",
        value: worldResult.formatted,
        formatted: worldResult.formatted,
        details: worldResult,
      };
    }
    return {
      type: "datetime",
      success: false,
      queryType: "world_time",
      error: `Couldn't find time for "${query.location}"`,
    };
  }

  const value = formatLocal(query.type);
  return {
    type: "datetime",
    success: true,
    queryType: query.type,
    value,
    formatted: value,
  };
}

module.exports = { detect, execute };
