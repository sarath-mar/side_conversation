const express = require("express");
const { fetchSideConversationEvents } = require("../services/zendesk");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const body = await fetchSideConversationEvents();
    return res.status(200).json(body);
  } catch (error) {
    console.error("Failed to fetch side conversation events:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Internal server error",
      body: error.body,
    });
  }
});

module.exports = router;
