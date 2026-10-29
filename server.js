const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const vendorDetailsRouter = require("./routes/vendorDetails");
const sideConversationEventsRouter = require("./routes/sideConversationEvents");
const giftCardPolicyAnalysisRouter = require("./routes/giftCardPolicyAnalysis");

const app = express();
const PORT = Number(process.env.PORT) || 3006;

app.use(express.json());

app.use("/vendor-details", vendorDetailsRouter);
app.use("/side-conversation-events", sideConversationEventsRouter);
app.use("/gift-card-policy-analysis", giftCardPolicyAnalysisRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
