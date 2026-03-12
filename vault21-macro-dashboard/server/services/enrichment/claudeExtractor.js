// @ts-check

const { default: Anthropic } = require('@anthropic-ai/sdk');
const config = require('../../config');

/** @typedef {import('../../../shared/contracts.js').ClaudeExtractionPayload} ClaudeExtractionPayload */
/** @typedef {import('../../../shared/contracts.js').NewsArticle} NewsArticle */

const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction system for a private credit market monitoring dashboard. Extract structured data from the provided article text.

Return ONLY valid JSON with this structure:
{
  "events": [
    {
      "date": "YYYY-MM-DD",
      "description": "Concise event description (max 100 chars)",
      "severity": 1-6,
      "category": "redemption|gating|bankruptcy|regulatory|bank_action|market_move|analyst_warning|policy",
      "entities": ["fund names", "company names", "people mentioned"],
      "dollar_amounts": [{"label": "what", "value": 1.2, "unit": "billions"}],
      "percentages": [{"label": "what", "value": 7.9}]
    }
  ],
  "fund_data": [
    {
      "fund_name": "string",
      "manager": "string",
      "aum_billions": number|null,
      "redemption_pct": number|null,
      "redemption_amt_billions": number|null,
      "status": "string",
      "detail": "string"
    }
  ],
  "metrics": [
    {"name": "metric_name", "value": number, "unit": "string"}
  ]
}

Severity scale:
1 = Minor industry news, no market impact
2 = Notable event, limited market impact
3 = Significant stress signal, moderate market reaction
4 = Major fund action (gating, large redemption), broad attention
5 = Systemic-level event, cross-market contagion, multiple funds affected
6 = Phase transition (bank leverage contraction, regulatory intervention, forced liquidation)

If no relevant data can be extracted, return {"events": [], "fund_data": [], "metrics": []}.
Do not hallucinate data. If a number is not explicitly stated, use null.`;

let anthropicClient = null;

/**
 * Lazily create the Anthropic SDK client.
 *
 * @returns {InstanceType<typeof Anthropic>|null} Anthropic client or null when the API key is missing
 */
function getAnthropicClient() {
  if (!config.anthropic.apiKey) {
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  return anthropicClient;
}

/**
 * Extract a JSON object from a model response that may contain wrappers.
 *
 * @param {string} responseText - Raw model text
 * @returns {ClaudeExtractionPayload} Parsed structured payload
 * @throws {Error} When the response does not contain valid JSON
 */
function parseExtractionResponse(responseText) {
  const fenced = responseText.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]
    || responseText.slice(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);

  if (!candidate.trim()) {
    throw new Error('Claude extraction response did not contain a JSON object');
  }

  const parsed = JSON.parse(candidate);

  return {
    events: Array.isArray(parsed.events) ? parsed.events : [],
    fund_data: Array.isArray(parsed.fund_data) ? parsed.fund_data : [],
    metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
  };
}

/**
 * Build the user message passed to Claude for article extraction.
 *
 * @param {NewsArticle} article - Article input
 * @returns {string} Prompt body containing the source context and article text
 */
function buildArticlePrompt(article) {
  return [
    `Source: ${article.sourceName}`,
    `Domain: ${article.sourceDomain}`,
    `Published: ${article.publishedAt || 'unknown'}`,
    `URL: ${article.url}`,
    `Title: ${article.title}`,
    `Snippet: ${article.snippet || 'none'}`,
    '',
    'Article text:',
    article.text.slice(0, 12000),
  ].join('\n');
}

/**
 * Extract structured market data from an article using Claude.
 *
 * @param {NewsArticle} article - Article input
 * @returns {Promise<ClaudeExtractionPayload|null>} Parsed extraction payload, or null when the API key is absent
 */
async function extractArticleData(article) {
  const client = getAnthropicClient();

  if (!client) {
    return null;
  }

  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildArticlePrompt(article),
      },
    ],
  });

  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return parseExtractionResponse(responseText);
}

module.exports = {
  EXTRACTION_SYSTEM_PROMPT,
  extractArticleData,
};
