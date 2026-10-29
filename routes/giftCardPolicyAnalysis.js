const express = require("express");
const {
  fetchSideConversationEvents,
  enrichSideConversationsWithTicketLogs,
} = require("../services/zendesk");
const { analyzeGiftCardPolicies } = require("../services/analyzeGiftCardPolicies");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const sideConversations = await fetchSideConversationEvents();
    const enriched =
      await enrichSideConversationsWithTicketLogs(sideConversations);
    const analysis = await analyzeGiftCardPolicies(enriched);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Failed to analyze gift card policies:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Internal server error",
      body: error.body,
    });
  }
});

module.exports = router;
