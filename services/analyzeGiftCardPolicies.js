const ANALYSIS_PROMPT = `You are an AI agent that analyzes Zendesk tickets to identify gift card cancellation or refund policies.

### Input format
You receive { "tickets": [ ... ] }.
Each ticket object has:
- ticket_id
- side_conversation_events (vendor side conversation for THIS ticket only)
- conversation_log (ticket comments; present when gift card name is missing from side conversation)
- gift_name_in_side_conversation (boolean)

### Critical rules
1. Analyze each ticket independently first. NEVER copy a gift_card_name from one ticket to another.
2. For gift_card_name on a ticket:
   - If gift_name_in_side_conversation is true, use the named gift card from side_conversation_events.
   - If gift_name_in_side_conversation is false, IGNORE generic words like "reward" / "gift card" in the side conversation and take the specific gift card name from conversation_log body text for THAT ticket only.
   - If still unknown, use "Not specified".
3. Example: ticket 937 side conversation says "HubSpot gift card"; ticket 947 side conversation only says "reward" but conversation_log says "amazon gift card".
   - 937 => HubSpot gift card
   - 947 => Amazon gift card
   - Do NOT put 947 under HubSpot gift card.
   - Do NOT name 947 as "Reward".
4. IGNORE unrelated tickets (testing, login issues, etc.).
5. vendor_email is the external vendor recipient/sender being asked about policy (not the Klarion/support initiator).
6. cancellation_policy meaning:
   - true = cancellation/refund allowed
   - false = not allowed / refused / replacement only / not confirmed
7. Group by vendor, then by gift_card_name.
8. Each gift card must include:
   - gift_card_name
   - ticket_details: only tickets that belong to THAT gift card
   - cancellation_policy: latest overall for that gift card (last ticket_details item after oldest->newest ordering)
9. Do not invent data. Return only valid JSON.

### Output format
{
  "vendors": [
    {
      "vendor_name": "HubSpot",
      "vendor_email": "james.hubspot@yopmail.com",
      "gift_cards": [
        {
          "gift_card_name": "HubSpot gift card",
          "cancellation_policy": false,
          "ticket_details": [
            { "ticketId": 937, "cancellation_policy": false }
          ]
        },
        {
          "gift_card_name": "Amazon gift card",
          "cancellation_policy": true,
          "ticket_details": [
            { "ticketId": 947, "cancellation_policy": true }
          ]
        }
      ]
    }
  ]
}`;

function extractJson(text) {
  const trimmed = String(text || "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("Model did not return valid JSON");
  }
}

function normalizeAnalysis(parsed) {
  const vendors = Array.isArray(parsed?.vendors) ? parsed.vendors : [];

  return {
    vendors: vendors.map((vendor) => ({
      vendor_name: vendor.vendor_name || "Not specified",
      vendor_email: vendor.vendor_email || "Not specified",
      gift_cards: (Array.isArray(vendor.gift_cards) ? vendor.gift_cards : []).map(
        (card) => {
          const ticketDetails = (
            Array.isArray(card.ticket_details) ? card.ticket_details : []
          ).map((ticket) => ({
            ticketId: Number(ticket.ticketId ?? ticket.ticket_id),
            cancellation_policy: Boolean(ticket.cancellation_policy),
          }));

          const latestFromTickets =
            ticketDetails.length > 0
              ? ticketDetails[ticketDetails.length - 1].cancellation_policy
              : Boolean(card.cancellation_policy);

          return {
            gift_card_name: card.gift_card_name || "Not specified",
            cancellation_policy: latestFromTickets,
            ticket_details: ticketDetails,
          };
        },
      ),
    })),
  };
}

async function analyzeGiftCardPolicies(analysisPayload) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("Missing OPENAI_API_KEY in environment");
    error.status = 500;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYSIS_PROMPT },
        {
          role: "user",
          content: `Analyze each ticket separately. If gift_name_in_side_conversation is false, read conversation_log for that ticket and extract the real gift card name from customer/agent comments (e.g. "amazon gift card"). Do not use generic words like "reward". Never reuse another ticket's gift card name.\n\n${JSON.stringify(analysisPayload)}`,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error("OpenAI request failed");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  const content = data.choices?.[0]?.message?.content;
  return normalizeAnalysis(extractJson(content));
}

module.exports = { analyzeGiftCardPolicies };
