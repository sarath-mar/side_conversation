const express = require("express");
const { vendors } = require("../data/vendors");

const router = express.Router();

function asString(value) {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value !== "string") {
    return "";
  }

  return decodeURIComponent(value.trim()).replace(/\s+/g, " ");
}

function normalizeName(value) {
  return asString(value).toLowerCase();
}

function getQueryValue(query, names) {
  const entries = Object.entries(query || {});

  for (const name of names) {
    const direct = query[name];
    if (direct != null && asString(direct) !== "") {
      return asString(direct);
    }

    const match = entries.find(
      ([key]) => key.toLowerCase() === name.toLowerCase(),
    );
    if (match && asString(match[1]) !== "") {
      return asString(match[1]);
    }
  }

  return "";
}

function matchesGiftName(cardName, giftName) {
  if (!giftName) {
    return true;
  }

  return normalizeName(cardName) === normalizeName(giftName);
}

function customerEmailMatches(vendor, email) {
  const target = email.toLowerCase();
  return vendor.customerEmail.some((value) => value.toLowerCase() === target);
}

function matchesVendor(vendor, { email, customerId, customerEmail, giftName }) {
  // `email` and `customerEmail` both match the customerEmail array
  const customerEmailFilter = customerEmail || email;
  if (customerEmailFilter && !customerEmailMatches(vendor, customerEmailFilter)) {
    return false;
  }

  if (customerId && !vendor.customerId.includes(customerId)) {
    return false;
  }

  if (giftName) {
    const hasGift = vendor.giftCards.some((card) =>
      matchesGiftName(card.giftCardName, giftName),
    );
    if (!hasGift) {
      return false;
    }
  }

  return true;
}

function filterGiftCards(giftCards, giftName) {
  if (!giftName) {
    return giftCards;
  }

  return giftCards.filter((card) =>
    matchesGiftName(card.giftCardName, giftName),
  );
}

function getQueryFilters(query) {
  const email = getQueryValue(query, ["email"]);
  const customerId = getQueryValue(query, ["customerId", "customer_id"]);
  const customerEmail = getQueryValue(query, [
    "customerEmail",
    "customer_email",
  ]);
  const giftName = getQueryValue(query, [
    "giftName",
    "giftCardName",
    "gift_name",
    "gift_card_name",
  ]);

  return {
    email: email || null,
    customerId: customerId || null,
    customerEmail: customerEmail || null,
    giftName: giftName || null,
  };
}

function buildResults(filters) {
  return vendors
    .filter((vendor) => matchesVendor(vendor, filters))
    .map((vendor) => ({
      ...vendor,
      giftCards: filterGiftCards(vendor.giftCards, filters.giftName),
    }));
}

router.get("/", (req, res) => {
  try {
    const filters = getQueryFilters(req.query);
    const results = buildResults(filters);

    res.setHeader("X-Applied-Filters", JSON.stringify(filters));
    return res.status(200).json(results);
  } catch (error) {
    console.error("Failed to fetch vendor details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:vendorId", (req, res) => {
  try {
    const vendorId = asString(req.params.vendorId);
    const filters = getQueryFilters(req.query);

    const vendor = vendors.find(
      (item) => item.vendorId.toLowerCase() === vendorId.toLowerCase(),
    );

    res.setHeader("X-Applied-Filters", JSON.stringify(filters));

    if (!vendor || !matchesVendor(vendor, filters)) {
      return res.status(200).json([]);
    }

    return res.status(200).json([
      {
        ...vendor,
        giftCards: filterGiftCards(vendor.giftCards, filters.giftName),
      },
    ]);
  } catch (error) {
    console.error("Failed to fetch vendor by id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
