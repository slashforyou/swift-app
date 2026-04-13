/**
 * GET /swift-app/v1/companies/abn-lookup?abn=XXXXXXXXXXX
 * GET /swift-app/v1/companies/abn-search?name=foo&maxResults=10
 *
 * Proxy vers l'API ABR (Australian Business Register) pour auto-complétion.
 * Le GUID est stocké dans .env (ABR_GUID).
 */

const ABR_BASE = "https://abr.business.gov.au/json";

// ──────────────────────────────────────────────
// GET /companies/abn-lookup?abn=XXXXXXXXXXX
// ──────────────────────────────────────────────
const abnLookupEndpoint = async (req, res) => {
  const rawAbn = (req.query.abn || "").replace(/\s/g, "");
  console.log("[ GET /companies/abn-lookup ]", { abn: rawAbn });

  if (!rawAbn || !/^\d{11}$/.test(rawAbn)) {
    return res.status(400).json({
      success: false,
      error: "Invalid ABN. Must be exactly 11 digits.",
    });
  }

  const guid = process.env.ABR_GUID;
  if (!guid) {
    console.error("❌ ABR_GUID not configured in .env");
    return res.status(500).json({
      success: false,
      error: "ABN lookup is not configured on this server.",
    });
  }

  try {
    const url = `${ABR_BASE}/AbnDetails.aspx?abn=${encodeURIComponent(rawAbn)}&callback=c&guid=${encodeURIComponent(guid)}`;
    const response = await fetch(url);
    const text = await response.text();

    // ABR returns JSONP: c({...})
    const jsonStr = text.replace(/^c\(/, "").replace(/\)$/, "");
    const data = JSON.parse(jsonStr);

    if (data.Message) {
      return res.status(404).json({
        success: false,
        error: data.Message,
      });
    }

    return res.json({
      success: true,
      data: {
        abn: data.Abn || "",
        abn_status: data.AbnStatus || "",
        acn: data.Acn || "",
        entity_name: data.EntityName || "",
        entity_type_code: data.EntityTypeCode || "",
        entity_type_name: data.EntityTypeName || "",
        business_names: data.BusinessName || [],
        gst_registered: !!data.Gst,
        gst_effective_from: data.Gst || null,
        address_state: data.AddressState || "",
        address_postcode: data.AddressPostcode || "",
      },
    });
  } catch (error) {
    console.error("❌ ABN lookup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to query ABR API.",
    });
  }
};

// ──────────────────────────────────────────────
// GET /companies/abn-search?name=foo&maxResults=10
// ──────────────────────────────────────────────
const abnSearchEndpoint = async (req, res) => {
  const name = (req.query.name || "").trim();
  const maxResults = Math.min(parseInt(req.query.maxResults) || 10, 20);
  console.log("[ GET /companies/abn-search ]", { name, maxResults });

  if (!name || name.length < 3) {
    return res.status(400).json({
      success: false,
      error: "Search query must be at least 3 characters.",
    });
  }

  const guid = process.env.ABR_GUID;
  if (!guid) {
    console.error("❌ ABR_GUID not configured in .env");
    return res.status(500).json({
      success: false,
      error: "ABN lookup is not configured on this server.",
    });
  }

  try {
    const url = `${ABR_BASE}/MatchingNames.aspx?name=${encodeURIComponent(name)}&maxResults=${maxResults}&callback=c&guid=${encodeURIComponent(guid)}`;
    const response = await fetch(url);
    const text = await response.text();

    const jsonStr = text.replace(/^c\(/, "").replace(/\)$/, "");
    const data = JSON.parse(jsonStr);

    if (data.Message) {
      return res.status(404).json({
        success: false,
        error: data.Message,
      });
    }

    const results = (data.Names || []).map((n) => ({
      abn: n.Abn || "",
      abn_status: n.AbnStatus || "",
      name: n.Name || "",
      name_type: n.NameType || "",
      state: n.State || "",
      postcode: n.Postcode || "",
    }));

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("❌ ABN search error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to query ABR API.",
    });
  }
};

// ──────────────────────────────────────────────
// GET /companies/postcode-lookup?postcode=XXXX
// ──────────────────────────────────────────────
const postcodeLookupEndpoint = async (req, res) => {
  const postcode = (req.query.postcode || "").trim();
  console.log("[ GET /companies/postcode-lookup ]", { postcode });

  if (!postcode || !/^\d{4}$/.test(postcode)) {
    return res.status(400).json({
      success: false,
      error: "Invalid postcode. Must be exactly 4 digits.",
    });
  }

  try {
    const url = `https://v0.postcodeapi.com.au/suburbs.json?postcode=${encodeURIComponent(postcode)}`;
    const response = await fetch(url);
    const suburbs = await response.json();

    if (!Array.isArray(suburbs) || suburbs.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No suburb found for this postcode.",
      });
    }

    return res.json({
      success: true,
      data: {
        suburb: suburbs[0].name || "",
        state: suburbs[0].state?.abbreviation || "",
        postcode: String(suburbs[0].postcode || postcode),
        all_suburbs: suburbs.map((s) => s.name),
      },
    });
  } catch (error) {
    console.error("❌ Postcode lookup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to query postcode API.",
    });
  }
};

module.exports = { abnLookupEndpoint, abnSearchEndpoint, postcodeLookupEndpoint };
