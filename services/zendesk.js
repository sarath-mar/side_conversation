function getZendeskConfig() {
  const cookie = process.env.ZENDESK_COOKIE;
  const sideConversationsUrl = process.env.ZENDESK_SIDE_CONVERSATIONS_URL;
  const baseUrl =
    process.env.ZENDESK_BASE_URL || "https://d3v-klarioninc.zendesk.com";

  if (!cookie) {
    const error = new Error("Missing ZENDESK_COOKIE in environment");
    error.status = 500;
    throw error;
  }

  return { cookie, sideConversationsUrl, baseUrl };
}

async function zendeskGet(url) {
  const { cookie } = getZendeskConfig();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: cookie,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error("Zendesk request failed");
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function fetchSideConversationEvents() {
  const { sideConversationsUrl } = getZendeskConfig();

  if (!sideConversationsUrl) {
    const error = new Error(
      "Missing ZENDESK_SIDE_CONVERSATIONS_URL in environment",
    );
    error.status = 500;
    throw error;
  }

  return zendeskGet(sideConversationsUrl);
}

async function fetchTicketConversationLog(ticketId) {
  const { baseUrl } = getZendeskConfig();
  const url = `${baseUrl}/api/v2/tickets/${ticketId}/conversation_log.json`;
  return zendeskGet(url);
}

function getUniqueTicketIds(events) {
  const ids = new Set();

  for (const event of events || []) {
    if (event.ticket_id != null) {
      ids.add(Number(event.ticket_id));
    }
  }

  return [...ids].filter((id) => Number.isFinite(id));
}

function eventText(event) {
  const message = event.message || {};
  return [message.subject, message.body, message.preview_text]
    .filter(Boolean)
    .join(" ");
}

function sideConversationMentionsGiftName(text) {
  return /[a-z0-9][\w&-]{0,40}\s+(gift|git)\s*cards?/i.test(text);
}

function isGiftCancellationRelated(text) {
  const value = String(text || "").toLowerCase();
  const mentionsGiftOrReward =
    /gift\s*card|giftcard|git\s*card|reward/.test(value);
  const mentionsCancelOrRefund =
    /cancel|cancellation|refund|reimburse|replacement/.test(value);
  return mentionsGiftOrReward && mentionsCancelOrRefund;
}

/**
 * Build one object per relevant ticket:
 * - side_conversation_events for that ticket only
 * - conversation_log when gift card name is not in the side conversation
 */
async function enrichSideConversationsWithTicketLogs(sideConversationPayload) {
  const allEvents = sideConversationPayload?.events || [];
  const relevantEvents = allEvents.filter((event) =>
    isGiftCancellationRelated(eventText(event)),
  );
  const ticketIds = getUniqueTicketIds(relevantEvents);
  const tickets = [];

  for (const ticketId of ticketIds) {
    const sideEvents = relevantEvents.filter(
      (event) => Number(event.ticket_id) === Number(ticketId),
    );
    const sideText = sideEvents.map(eventText).join(" ");
    const needsConversationLog = !sideConversationMentionsGiftName(sideText);

    let conversationLog = null;

    if (needsConversationLog) {
      try {
        const rawLog = await fetchTicketConversationLog(ticketId);
        conversationLog = {
          events: (rawLog.events || []).map((event) => ({
            created_at: event.created_at,
            author: event.author?.display_name || null,
            author_type: event.author?.type || null,
            type: event.type,
            body: String(event.content?.body || "")
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/gi, " ")
              .replace(/\s+/g, " ")
              .trim(),
          })),
        };
      } catch (error) {
        conversationLog = {
          error: error.message,
          status: error.status,
          body: error.body,
        };
      }
    }

    tickets.push({
      ticket_id: ticketId,
      gift_name_in_side_conversation: !needsConversationLog,
      // When false, gift_card_name MUST come from conversation_log comments.
      side_conversation_events: sideEvents.map((event) => ({
        type: event.type,
        created_at: event.created_at,
        ticket_id: event.ticket_id,
        from: event.message?.from || null,
        to: event.message?.to || [],
        subject: event.message?.subject || "",
        body: event.message?.body || "",
      })),
      conversation_log: conversationLog,
    });
  }

  return { tickets };
}

module.exports = {
  fetchSideConversationEvents,
  fetchTicketConversationLog,
  enrichSideConversationsWithTicketLogs,
};
