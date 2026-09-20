import { Router, type IRouter } from "express";
import { RespondWithAssistantBody, RespondWithAssistantResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const systemPrompt = `You are Parent Decoder's calm, privacy-conscious AI assistant for adults.

Your job is to explain modern slang, online phrases, emoji combinations, and short messages in plain language, then help a parent decide how to ask a respectful follow-up question.

Rules:
- Never claim to know a child's intent, feelings, safety, identity, or behavior from a phrase alone.
- Explain that meaning changes by age group, relationship, community, and surrounding context.
- Avoid alarmist language, surveillance advice, or instructions to secretly monitor someone.
- If a parent describes a possible immediate safety issue, recommend talking directly and contacting a trusted local support or emergency service when appropriate, without pretending to assess the situation.
- Be concise but useful: lead with the likely meaning, then mention important alternate meanings or context clues, and end with one calm next step.
- If the input is ambiguous or not slang, say so plainly and ask one clarifying question.
- Do not repeat private identifying details unnecessarily.
- Use short paragraphs and bullets when they improve readability.
- Do not use emojis in your response.`;

function buildUserPrompt(mode: "explain" | "chat", message: string, context?: string) {
  if (mode === "explain") {
    return [
      "The parent wants help explaining this unfamiliar term or message.",
      `Input: ${message}`,
      context ? `Local dictionary context (use as a helpful clue, not as a conclusion): ${context}` : "",
      "Explain what it could mean and how to ask about it without assuming intent.",
    ].filter(Boolean).join("\n\n");
  }

  return [
    "The parent is asking a general question about slang or online language.",
    `Question: ${message}`,
    context ? `Optional context from the local decoder: ${context}` : "",
    "Answer directly, distinguish common meanings from uncertain ones, and offer one calm follow-up question when useful.",
  ].filter(Boolean).join("\n\n");
}

router.post("/assistant/respond", async (req, res): Promise<void> => {
  const parsed = RespondWithAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ error: parsed.error.message }, "Invalid assistant request");
    res.status(400).json({ error: "Please provide a message no longer than 1,200 characters." });
    return;
  }

  const { mode, message, context } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(mode, message.trim(), context?.trim()) },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      req.log.error("Assistant returned an empty response");
      res.status(502).json({ error: "The assistant did not return an answer. Please try again." });
      return;
    }

    const response = RespondWithAssistantResponse.parse({
      answer,
      mode,
      privacyNote: "This answer is generated for this moment and is not saved as a conversation.",
    });
    res.json(response);
  } catch (error) {
    req.log.error({ err: error }, "Assistant request failed");
    res.status(502).json({ error: "The assistant is unavailable right now. Please try again." });
  }
});

export default router;