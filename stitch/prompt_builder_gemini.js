// ============================================================
// AI CONTENT KIT BUILDER — Gemini Version
// New standalone file to keep old no-api script untouched.
// Trigger function for this file: onFormSubmitGemini
// ============================================================

const G_PROMPT_OUTPUT_SHEET_NAME = "✅ Prompts Ready";
const G_AI_OUTPUT_SHEET_NAME = "✅ AI Content Ready";

const G_PROMPT_HEADERS = [
  "📅 Date",
  "🏷️ Brand",
  "🏭 Industry",
  "🎯 Goal",
  "📦 Output Plan",
  "🧠 Creative Snapshot",
  "📋 READY PROMPT — Copy & Paste into Claude/ChatGPT",
];

const G_PROMPT_COLUMN_WIDTHS = [120, 150, 140, 170, 220, 360, 760];

const G_AI_HEADERS = [
  "date",
  "brand",
  "industry",
  "goal",
  "delivery_status",
  "status_badge",
  "model_used",
  "posts_json",
  "images_json",
  "videos_json",
  "strategy_json",
  "sales_json",
  "offer_json",
  "kpi_json",
  "email",
  "brief_json",
  "last_error",
  "correlation_id",
  "retry_button",
];

const G_AI_COLUMN_WIDTHS = [140, 150, 130, 160, 150, 120, 180, 300, 300, 300, 260, 260, 260, 220, 220, 360, 320, 240, 130];

const G_LIMITS = {
  num_posts: { min: 1, max: 25, fallback: 5 },
  num_image_designs: { min: 1, max: 10, fallback: 5 },
  num_video_prompts: { min: 1, max: 10, fallback: 3 },
};

const G_DEFAULT_MODEL = "gemini-3-flash-preview";
const G_DEFAULT_TIMEOUT_MS = 25000;
const G_DEFAULT_MAX_RETRIES = 1;


// ============================================================
// MAIN (Gemini Flow)
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AI Operations")
    .addItem("Setup Row Retry Buttons (One-Time)", "gSetupRetryButtons")
    .addSeparator()
    .addItem("Retry Selected Failed Row", "gRetrySelectedFailedRow")
    .addItem("Retry Latest Failed Row", "gRetryLatestFailedRow")
    .addToUi();
}

function onFormSubmitGemini(e) {
  if (!e || (!e.values && !e.namedValues)) {
    Logger.log("[Gemini] onFormSubmitGemini called without event payload.");
    return;
  }

  const data = gExtractSubmissionData(e);
  const correlationId = Utilities.getUuid();
  const industryModule = gGetIndustryModule(data.industry);
  const settings = gGetGeminiSettings();

  if (!settings.enabled) {
    gHandleGeminiFailure(data, correlationId, "Gemini disabled via Script Properties.", settings);
    return;
  }

  if (!settings.apiKey) {
    gHandleGeminiFailure(data, correlationId, "Missing GEMINI_API_KEY.", settings);
    return;
  }

  try {
    const geminiPrompt = gBuildGeminiInputPrompt(data, industryModule);
    const aiContent = gCallGeminiAPI(geminiPrompt, settings);

    const validationErrors = gValidateGeminiResponse(aiContent, data);
    if (validationErrors.length > 0) {
      throw new Error("Gemini validation failed: " + validationErrors.join(" | "));
    }

    const emailResult = gSendHtmlEmail(data, aiContent);
    const deliveryStatus = gResolveAiDeliveryStatus(emailResult);

    gWriteAiContentToSheet(data, aiContent, {
      deliveryStatus: deliveryStatus,
      modelUsed: settings.model,
      lastError: emailResult.error || "",
      correlationId: correlationId,
    });

    Logger.log("[Gemini] Completed. Status=" + deliveryStatus + " Brand=" + data.brand_name + " CID=" + correlationId);
  } catch (error) {
    gHandleGeminiFailure(data, correlationId, String(error), settings);
  }
}

function gHandleGeminiFailure(data, correlationId, reason, settings) {
  const modelUsed = settings && settings.model ? settings.model : G_DEFAULT_MODEL;
  Logger.log("[Gemini] Generation failed. No client fallback will be sent. Reason=" + reason + " CID=" + correlationId);

  const rowNumber = gWriteAiContentToSheet(data, null, {
    deliveryStatus: "failed_generation",
    modelUsed: modelUsed,
    lastError: reason,
    correlationId: correlationId,
  });

  const clientDelayResult = gSendClientDelayEmail(data, correlationId, settings);
  const adminAlertResult = gSendAdminFailureAlert(
    data,
    reason,
    correlationId,
    rowNumber,
    modelUsed,
    clientDelayResult,
    settings
  );

  Logger.log(
    "[Gemini] Failure handling completed. ClientDelay=" + clientDelayResult.reason +
    " AdminAlert=" + adminAlertResult.reason +
    " CID=" + correlationId
  );
}


// ============================================================
// SETTINGS
// ============================================================
function gGetGeminiSettings() {
  const props = PropertiesService.getScriptProperties();

  const enabled = gParseBooleanProperty(props.getProperty("GEMINI_ENABLED"), true);
  const adminAlertsEnabled = gParseBooleanProperty(props.getProperty("ADMIN_ALERTS_ENABLED"), true);
  const clientDelayEmailEnabled = gParseBooleanProperty(props.getProperty("CLIENT_DELAY_EMAIL_ENABLED"), true);

  const apiKey = String(props.getProperty("GEMINI_API_KEY") || "").trim();
  const model = String(props.getProperty("GEMINI_MODEL") || G_DEFAULT_MODEL).trim();
  const adminAlertEmail = String(props.getProperty("ADMIN_ALERT_EMAIL") || "").trim();

  const timeoutMs = gClamp(
    gParseInteger(props.getProperty("GEMINI_TIMEOUT_MS"), G_DEFAULT_TIMEOUT_MS),
    5000,
    55000
  );

  const maxRetries = gClamp(
    gParseInteger(props.getProperty("GEMINI_MAX_RETRIES"), G_DEFAULT_MAX_RETRIES),
    0,
    6
  );

  return {
    enabled,
    apiKey,
    model,
    timeoutMs,
    maxRetries,
    adminAlertEmail,
    adminAlertsEnabled,
    clientDelayEmailEnabled,
  };
}

function gParseInteger(value, fallback) {
  const matched = String(value ?? "").match(/\d+/);
  if (!matched) return fallback;
  const parsed = parseInt(matched[0], 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function gParseBooleanProperty(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}


// ============================================================
// FORM PARSING
// ============================================================
function gExtractSubmissionData(e) {
  const row = Array.isArray(e.values) ? e.values : [];
  const namedValues = e.namedValues || {};

  return {
    submitted_at: row[0] || new Date(),
    email: gExtractFirstEmail(
      gGetFieldValue(
        namedValues,
        row,
        ["email", "email address", "client email", "الايميل", "البريد الالكتروني", "البريد الإلكتروني"],
        17,
        ""
      )
    ),
    brand_name: gGetFieldValue(namedValues, row, ["brand name", "اسم البراند", "اسم العلامة التجارية", "اسم العلامة"], 1, ""),
    industry: gGetFieldValue(namedValues, row, ["industry", "niche", "المجال", "القطاع"], 2, ""),
    target_audience: gGetFieldValue(namedValues, row, ["target audience", "audience", "الجمهور المستهدف", "الفئة المستهدفة"], 3, ""),
    main_goal: gGetFieldValue(namedValues, row, ["main goal", "campaign goal", "objective", "الهدف الرئيسي", "هدف الحملة"], 4, ""),
    platforms: gGetFieldValue(namedValues, row, ["platforms", "active platforms", "social platforms", "المنصات", "منصات النشر"], 5, ""),
    brand_tone: gGetFieldValue(namedValues, row, ["brand tone", "tone of voice", "نبرة البراند", "نبرة العلامة"], 6, ""),
    brand_colors: gGetFieldValue(namedValues, row, ["brand colors", "ألوان البراند", "الوان البراند", "ألوان العلامة", "الالوان"], 7, ""),
    offer: gGetFieldValue(namedValues, row, ["offer", "key message", "العرض", "الرسالة الرئيسية"], 8, ""),
    competitors: gGetFieldValue(namedValues, row, ["competitors", "competition", "المنافسين", "المنافسون"], 9, ""),
    visual_notes: gGetFieldValue(namedValues, row, ["visual notes", "creative notes", "visual direction", "ملاحظات بصرية", "ملاحظات التصميم"], 10, ""),
    campaign_duration: gGetFieldValue(namedValues, row, ["campaign duration", "duration", "مدة الحملة", "المدة"], 11, ""),
    budget_level: gGetFieldValue(namedValues, row, ["budget", "budget level", "ميزانية", "مستوى الميزانية"], 12, ""),
    best_content_types: gGetFieldValue(namedValues, row, ["best-performing content", "best content types", "content performance", "أفضل أنواع المحتوى", "انجح انواع المحتوى"], 13, ""),
    num_posts: gSanitizeCount(
      gGetFieldValue(namedValues, row, ["number of posts", "num posts", "posts count", "عدد البوستات", "عدد المنشورات"], 14, G_LIMITS.num_posts.fallback),
      G_LIMITS.num_posts.min,
      G_LIMITS.num_posts.max,
      G_LIMITS.num_posts.fallback
    ),
    num_image_designs: gSanitizeCount(
      gGetFieldValue(namedValues, row, ["number of image designs", "num image designs", "images count", "static images", "عدد الصور", "عدد التصميمات"], 15, G_LIMITS.num_image_designs.fallback),
      G_LIMITS.num_image_designs.min,
      G_LIMITS.num_image_designs.max,
      G_LIMITS.num_image_designs.fallback
    ),
    num_video_prompts: gSanitizeCount(
      gGetFieldValue(namedValues, row, ["number of video prompts", "num video prompts", "videos count", "عدد الفيديوهات", "عدد فيديوهات"], 16, G_LIMITS.num_video_prompts.fallback),
      G_LIMITS.num_video_prompts.min,
      G_LIMITS.num_video_prompts.max,
      G_LIMITS.num_video_prompts.fallback
    ),
  };
}

function gGetFieldValue(namedValues, row, aliases, fallbackIndex, defaultValue) {
  const fromNamedValues = gFindValueInNamedValues(namedValues, aliases);
  if (fromNamedValues) return fromNamedValues;

  const fromRow = row[fallbackIndex];
  if (fromRow !== undefined && fromRow !== null && String(fromRow).trim() !== "") {
    return String(fromRow).trim();
  }

  return String(defaultValue ?? "");
}

function gFindValueInNamedValues(namedValues, aliases) {
  if (!namedValues || typeof namedValues !== "object") return "";

  const normalizedAliases = aliases.map(gNormalizeKey);
  let bestScore = 0;
  let bestValue = "";

  Object.keys(namedValues).forEach((key) => {
    const normalizedKey = gNormalizeKey(key);
    let score = 0;

    normalizedAliases.forEach((alias) => {
      if (!alias) return;

      if (normalizedKey === alias) {
        score = Math.max(score, 100 + alias.length);
      } else if (normalizedKey.includes(alias)) {
        score = Math.max(score, 60 + alias.length);
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestValue = gNormalizeCellValue(namedValues[key]);
    }
  });

  return bestValue;
}

function gNormalizeCellValue(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean).join(", ");
  }
  return String(value || "").trim();
}

function gNormalizeKey(value) {
  return gNormalizeCellValue(value)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\-_\/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\u0600-\u06FF ]/g, "")
    .trim();
}

function gSanitizeCount(rawValue, min, max, fallback) {
  const numericMatch = String(rawValue ?? "").match(/\d+/);
  const parsed = numericMatch ? parseInt(numericMatch[0], 10) : NaN;
  if (Number.isNaN(parsed)) return fallback;
  return gClamp(parsed, min, max);
}

function gClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function gExtractFirstEmail(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const matched = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return matched ? matched[0] : "";
}

function gIsValidEmail(email) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(email || "").trim());
}

function gBuildPreferredArabicBrandName(brandName) {
  const raw = String(brandName || "").trim();
  if (!raw) return "";

  // If already Arabic, keep it exactly as provided.
  if (/[\u0600-\u06FF]/.test(raw)) {
    return raw;
  }

  const clean = raw.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return raw;

  const twoLetterMap = {
    sh: "ش",
    kh: "خ",
    gh: "غ",
    th: "ث",
    dh: "ذ",
    ph: "ف",
    ch: "تش",
    ou: "و",
    oo: "و",
    ee: "ي",
    ie: "ي",
    aa: "ا",
  };

  const oneLetterMap = {
    a: "ا",
    b: "ب",
    c: "ك",
    d: "د",
    e: "ي",
    f: "ف",
    g: "ج",
    h: "ه",
    i: "ي",
    j: "ج",
    k: "ك",
    l: "ل",
    m: "م",
    n: "ن",
    o: "و",
    p: "ب",
    q: "ق",
    r: "ر",
    s: "س",
    t: "ت",
    u: "و",
    v: "ف",
    w: "و",
    x: "كس",
    y: "ي",
    z: "ز",
  };

  const words = clean.split(" ").filter(Boolean).map((word) => {
    let out = "";
    let i = 0;

    while (i < word.length) {
      const pair = word.slice(i, i + 2);
      if (twoLetterMap[pair]) {
        out += twoLetterMap[pair];
        i += 2;
        continue;
      }

      const ch = word[i];
      if (/\d/.test(ch)) {
        out += ch;
      } else if (ch === "a" && i === 0) {
        out += "أ";
      } else {
        out += oneLetterMap[ch] || "";
      }

      i += 1;
    }

    return out;
  });

  return words.join(" ").trim() || raw;
}


// ============================================================
// GEMINI PROMPT + API
// ============================================================
function gBuildGeminiInputPrompt(d, industryModule) {
  const highBudgetMode = gIsHighBudget(d.budget_level);
  const officialBrandName = String(d.brand_name || "").trim();
  const preferredArabicBrandName = gBuildPreferredArabicBrandName(officialBrandName);

  return [
    "You are a world-class AI Creative Director and Growth Strategist.",
    "Return ONLY valid JSON, no markdown, no code fences, no extra text.",
    "Brand Name Lock: Never translate, replace, or alter the brand name spelling.",
    "Official brand token: " + officialBrandName,
    "If Arabic script is needed, use this exact Arabic spelling: " + preferredArabicBrandName,
    "Use Arabic (Egyptian Dialect) for post captions and video script text unless brand tone clearly says otherwise.",
    "Keep outputs practical and easy to execute: avoid long theory and keep wording concise.",
    "Post captions should be short and punchy: target around 35-75 words per caption unless platform best-practice requires shorter.",
    "Every post and video should open with a strong hook in the first line (surprise, pain point, bold promise, or sharp question).",
    "Section A posts are standalone text/copy posts; do NOT require an image or video asset for each post.",
    "Image and video prompts must be highly detailed, production-ready, and non-generic.",
    "Core output counts are strict.",
    "",
    "COUNTS:",
    "posts=" + d.num_posts,
    "image_designs=" + d.num_image_designs,
    "video_prompts=" + d.num_video_prompts,
    highBudgetMode
      ? "High budget mode active: you may add at most +1 optional item in posts/image_designs/video_prompts."
      : "Normal budget mode: do not add extra items beyond core counts.",
    "",
    "RULES:",
    "- Content type rule: " + gGetContentTypeRules(d.best_content_types).replace(/\n/g, " "),
    "- Goal rule: " + gGetGoalRules(d.main_goal),
    "- Platform adaptation for: " + d.platforms,
    "- Budget adaptation: " + gGetBudgetRules(d.budget_level),
    "- Competitor differentiation against: " + d.competitors,
    "",
    "CLIENT BRIEF:",
    "Brand Name: " + d.brand_name,
    "Industry: " + d.industry,
    "Target Audience: " + d.target_audience,
    "Main Goal: " + d.main_goal,
    "Active Platforms: " + d.platforms,
    "Brand Tone: " + d.brand_tone,
    "Brand Colors: " + d.brand_colors,
    "Offer / Key Message: " + d.offer,
    "Competitors: " + d.competitors,
    "Visual Notes: " + d.visual_notes,
    "Campaign Duration: " + d.campaign_duration,
    "Budget Level (1-7): " + d.budget_level,
    "Best-Performing Content: " + d.best_content_types,
    "",
    "INDUSTRY MODULE:",
    industryModule,
    "",
    "JSON CONTRACT REMINDERS:",
    "- posts[].hashtags must be an array of strings.",
    "- posts are copy-only outputs; image/video attachments are optional and handled separately.",
    "- posts[].caption should start with a hook-first opening line, then clear value, then close/CTA; target around 35-75 words unless platform constraints require shorter copy.",
    "- image_designs[].full_ai_image_prompt must include aspect ratio guidance (1:1 or 9:16).",
    "- image_designs[].full_ai_image_prompt must be very detailed: subject, scene, camera angle/lens, lighting, mood, composition, color palette, textures, and negative constraints.",
    "- image_designs[].text_policy must follow Arabic-vs-English rule.",
    "- Any mention of the brand in captions/scripts/overlays must keep the exact brand token or the exact Arabic spelling provided above. No alternative transliterations.",
    "- Keep marketing_strategy and sales_system concise and action-first; prefer practical short steps over long explanations.",
    "- video_prompts[].ai_tool_instructions must be very detailed: shot plan, camera movement, transitions, pacing, voiceover tone, music/SFX, subtitles, and color grading.",
    "- video scene text and overlays should be short, hook-driven, and easy to execute.",
    "- sales_system.objection_handling must be array of objects: { objection, response }.",
    highBudgetMode
      ? "- Include kpi_tracking object."
      : "- Do not include kpi_tracking key.",
    "",
    "Now output valid JSON only.",
  ].join("\n");
}

function gCallGeminiAPI(promptText, settings) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(settings.model) + ":generateContent";
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: gGetGeminiResponseSchema(),
      temperature: 0.4,
      topP: 0.9,
    },
  };

  const startedAt = Date.now();
  let lastError = "";

  for (let attempt = 0; attempt <= settings.maxRetries; attempt++) {
    if (Date.now() - startedAt > settings.timeoutMs) {
      throw new Error("Gemini timeout exceeded " + settings.timeoutMs + "ms. LastError=" + lastError);
    }

    try {
      const response = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: {
          "x-goog-api-key": settings.apiKey,
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      const statusCode = response.getResponseCode();
      const rawBody = response.getContentText() || "";

      if (statusCode >= 200 && statusCode < 300) {
        const parsedBody = JSON.parse(rawBody);
        const modelText = parsedBody
          && parsedBody.candidates
          && parsedBody.candidates[0]
          && parsedBody.candidates[0].content
          && parsedBody.candidates[0].content.parts
          && parsedBody.candidates[0].content.parts[0]
          && parsedBody.candidates[0].content.parts[0].text;

        if (!modelText) {
          throw new Error("Gemini response missing candidates[0].content.parts[0].text");
        }

        return gParseJsonFromModelText(modelText);
      }

      lastError = "HTTP " + statusCode + " - " + gTruncate(rawBody, 800);

      if (!gShouldRetryGemini(statusCode) || attempt >= settings.maxRetries) {
        throw new Error("Gemini API error: " + lastError);
      }

      Utilities.sleep(gGetBackoffMs(attempt));
    } catch (error) {
      lastError = String(error);
      if (attempt >= settings.maxRetries) {
        throw new Error("Gemini request failed after retries: " + lastError);
      }
      Utilities.sleep(gGetBackoffMs(attempt));
    }
  }

  throw new Error("Gemini failed unexpectedly.");
}

function gShouldRetryGemini(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function gGetBackoffMs(attempt) {
  // Between the first and second attempt, use a variable delay between 2 and 5 minutes.
  if (attempt === 0) {
    return gRandomIntInclusive(120000, 300000);
  }

  const base = 1000;
  const max = 8000;
  return Math.min(max, base * Math.pow(2, attempt));
}

function gRandomIntInclusive(min, max) {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function gParseJsonFromModelText(text) {
  let normalized = String(text || "").trim();

  if (normalized.startsWith("```")) {
    normalized = normalized.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  return JSON.parse(normalized);
}

function gGetGeminiResponseSchema() {
  return {
    type: "OBJECT",
    required: [
      "posts",
      "image_designs",
      "video_prompts",
      "marketing_strategy",
      "sales_system",
      "offer_optimization",
    ],
    properties: {
      posts: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["platform", "format", "goal", "caption", "hashtags", "cta"],
          properties: {
            platform: { type: "STRING" },
            format: { type: "STRING" },
            goal: { type: "STRING" },
            caption: { type: "STRING" },
            hashtags: { type: "ARRAY", items: { type: "STRING" } },
            cta: { type: "STRING" },
          },
        },
      },
      image_designs: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: [
            "platform_format",
            "design_type",
            "goal",
            "visual_scene",
            "headline_text_overlay",
            "supporting_copy",
            "full_ai_image_prompt",
            "text_policy",
            "conversion_trigger",
          ],
          properties: {
            platform_format: { type: "STRING" },
            design_type: { type: "STRING" },
            goal: { type: "STRING" },
            visual_scene: { type: "STRING" },
            headline_text_overlay: { type: "STRING" },
            supporting_copy: { type: "STRING" },
            full_ai_image_prompt: { type: "STRING" },
            text_policy: { type: "STRING" },
            conversion_trigger: { type: "STRING" },
          },
        },
      },
      video_prompts: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: [
            "platform",
            "duration",
            "style",
            "hook_type",
            "scenes",
            "ai_tool_instructions",
            "why_this_converts",
          ],
          properties: {
            platform: { type: "STRING" },
            duration: { type: "STRING" },
            style: { type: "STRING" },
            hook_type: { type: "STRING" },
            scenes: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["time", "label", "visual", "text", "audio"],
                properties: {
                  time: { type: "STRING" },
                  label: { type: "STRING" },
                  visual: { type: "STRING" },
                  text: { type: "STRING" },
                  audio: { type: "STRING" },
                },
              },
            },
            ai_tool_instructions: { type: "STRING" },
            why_this_converts: { type: "STRING" },
          },
        },
      },
      marketing_strategy: {
        type: "OBJECT",
        required: [
          "content_mix_plan",
          "weekly_posting_plan",
          "platform_strategy",
          "key_messaging_angles",
          "brand_positioning_statement",
        ],
        properties: {
          content_mix_plan: { type: "STRING" },
          weekly_posting_plan: { type: "STRING" },
          platform_strategy: { type: "STRING" },
          key_messaging_angles: { type: "ARRAY", items: { type: "STRING" } },
          brand_positioning_statement: { type: "STRING" },
        },
      },
      sales_system: {
        type: "OBJECT",
        required: [
          "pain_points",
          "offer_structuring",
          "funnel_plan",
          "ad_angles",
          "objection_handling",
          "cta_strategy",
        ],
        properties: {
          pain_points: { type: "ARRAY", items: { type: "STRING" } },
          offer_structuring: { type: "STRING" },
          funnel_plan: { type: "STRING" },
          ad_angles: { type: "ARRAY", items: { type: "STRING" } },
          objection_handling: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["objection", "response"],
              properties: {
                objection: { type: "STRING" },
                response: { type: "STRING" },
              },
            },
          },
          cta_strategy: { type: "STRING" },
        },
      },
      offer_optimization: {
        type: "OBJECT",
        required: ["rewritten_offer", "urgency_or_scarcity", "alternative_offers"],
        properties: {
          rewritten_offer: { type: "STRING" },
          urgency_or_scarcity: { type: "STRING" },
          alternative_offers: { type: "ARRAY", items: { type: "STRING" } },
        },
      },
      kpi_tracking: {
        type: "OBJECT",
        properties: {
          top_kpis: { type: "ARRAY", items: { type: "STRING" } },
          benchmarks: { type: "STRING" },
          optimization_actions: { type: "STRING" },
          ab_tests_week1: { type: "ARRAY", items: { type: "STRING" } },
        },
      },
    },
  };
}


// ============================================================
// VALIDATION
// ============================================================
function gValidateGeminiResponse(aiContent, data) {
  const errors = [];

  if (!gIsPlainObject(aiContent)) {
    return ["Root response must be a JSON object."];
  }

  const highBudgetMode = gIsHighBudget(data.budget_level);

  gValidateArrayCount("posts", aiContent.posts, data.num_posts, highBudgetMode, errors);
  gValidateArrayCount("image_designs", aiContent.image_designs, data.num_image_designs, highBudgetMode, errors);
  gValidateArrayCount("video_prompts", aiContent.video_prompts, data.num_video_prompts, highBudgetMode, errors);

  gValidateObjectKeys(aiContent.marketing_strategy, [
    "content_mix_plan",
    "weekly_posting_plan",
    "platform_strategy",
    "key_messaging_angles",
    "brand_positioning_statement",
  ], "marketing_strategy", errors);

  gValidateObjectKeys(aiContent.sales_system, [
    "pain_points",
    "offer_structuring",
    "funnel_plan",
    "ad_angles",
    "objection_handling",
    "cta_strategy",
  ], "sales_system", errors);

  gValidateObjectKeys(aiContent.offer_optimization, [
    "rewritten_offer",
    "urgency_or_scarcity",
    "alternative_offers",
  ], "offer_optimization", errors);

  if (highBudgetMode && !gIsPlainObject(aiContent.kpi_tracking)) {
    errors.push("kpi_tracking is required for high budget mode.");
  }

  if (!highBudgetMode && aiContent.kpi_tracking && !gIsPlainObject(aiContent.kpi_tracking)) {
    errors.push("kpi_tracking must be an object if provided.");
  }

  const posts = Array.isArray(aiContent.posts) ? aiContent.posts : [];
  posts.forEach((item, idx) => {
    gValidateObjectKeys(item, ["platform", "format", "goal", "caption", "hashtags", "cta"], "posts[" + idx + "]", errors);
    if (item && !Array.isArray(item.hashtags)) {
      errors.push("posts[" + idx + "].hashtags must be an array.");
    }
  });

  const images = Array.isArray(aiContent.image_designs) ? aiContent.image_designs : [];
  images.forEach((item, idx) => {
    gValidateObjectKeys(item, [
      "platform_format",
      "design_type",
      "goal",
      "visual_scene",
      "headline_text_overlay",
      "supporting_copy",
      "full_ai_image_prompt",
      "text_policy",
      "conversion_trigger",
    ], "image_designs[" + idx + "]", errors);
  });

  const videos = Array.isArray(aiContent.video_prompts) ? aiContent.video_prompts : [];
  videos.forEach((item, idx) => {
    gValidateObjectKeys(item, [
      "platform",
      "duration",
      "style",
      "hook_type",
      "scenes",
      "ai_tool_instructions",
      "why_this_converts",
    ], "video_prompts[" + idx + "]", errors);
    if (item && !Array.isArray(item.scenes)) {
      errors.push("video_prompts[" + idx + "].scenes must be an array.");
    }
  });

  return errors;
}

function gValidateArrayCount(field, value, requestedCount, allowExtra, errors) {
  if (!Array.isArray(value)) {
    errors.push(field + " must be an array.");
    return;
  }

  const minCount = requestedCount;
  const maxCount = allowExtra ? requestedCount + 1 : requestedCount;

  if (value.length < minCount || value.length > maxCount) {
    errors.push(field + " count must be between " + minCount + " and " + maxCount + ".");
  }
}

function gValidateObjectKeys(obj, requiredKeys, path, errors) {
  if (!gIsPlainObject(obj)) {
    errors.push(path + " must be an object.");
    return;
  }

  requiredKeys.forEach((key) => {
    if (!(key in obj)) {
      errors.push(path + "." + key + " is missing.");
    }
  });
}

function gIsPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}


// ============================================================
// AI SHEET STORAGE
// ============================================================
function gWriteAiContentToSheet(data, aiContent, meta) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(G_AI_OUTPUT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(G_AI_OUTPUT_SHEET_NAME);
  }

  gEnsureAiSheetLayout(sheet);

  const row = gBuildAiSheetRow(data, aiContent, meta);

  sheet.appendRow(row);

  const lastRow = sheet.getLastRow();
  gStyleAiDataRow(sheet, lastRow);

  return lastRow;
}

function gUpdateAiSheetRow(sheet, rowNumber, data, aiContent, meta) {
  gEnsureAiSheetLayout(sheet);
  const row = gBuildAiSheetRow(data, aiContent, meta);
  sheet.getRange(rowNumber, 1, 1, G_AI_HEADERS.length).setValues([row]);
  gStyleAiDataRow(sheet, rowNumber);
}

function gBuildAiSheetRow(data, aiContent, meta) {
  const snapshot = gBuildSubmissionSnapshot(data);
  const deliveryStatus = meta && meta.deliveryStatus ? meta.deliveryStatus : "generated";
  const modelUsed = meta && meta.modelUsed ? meta.modelUsed : G_DEFAULT_MODEL;
  const lastError = meta && meta.lastError ? meta.lastError : "";
  const correlationId = meta && meta.correlationId ? meta.correlationId : Utilities.getUuid();

  return [
    snapshot.submitted_at,
    snapshot.brand_name,
    snapshot.industry,
    snapshot.main_goal,
    deliveryStatus,
    gGetStatusBadgeLabel(deliveryStatus),
    modelUsed,
    gJsonCell(aiContent && aiContent.posts),
    gJsonCell(aiContent && aiContent.image_designs),
    gJsonCell(aiContent && aiContent.video_prompts),
    gJsonCell(aiContent && aiContent.marketing_strategy),
    gJsonCell(aiContent && aiContent.sales_system),
    gJsonCell(aiContent && aiContent.offer_optimization),
    gJsonCell(aiContent && aiContent.kpi_tracking),
    snapshot.email,
    gJsonCell(snapshot),
    gTruncate(lastError, 4000),
    correlationId,
    false,
  ];
}

function gStyleAiDataRow(sheet, rowNumber) {
  sheet.setRowHeight(rowNumber, 170);
  sheet.getRange(rowNumber, 1).setNumberFormat("yyyy-mm-dd hh:mm");

  const rowRange = sheet.getRange(rowNumber, 1, 1, G_AI_HEADERS.length);
  rowRange.setVerticalAlignment("top");

  const wrapStartColumn = G_AI_HEADERS.indexOf("posts_json") + 1;
  const wrapEndColumn = G_AI_HEADERS.indexOf("last_error") + 1;

  // Wrap posts/images/videos + strategy/sales/offer/kpi + brief/error columns.
  sheet.getRange(rowNumber, wrapStartColumn, 1, wrapEndColumn - wrapStartColumn + 1).setWrap(true);

  const retryColumn = G_AI_HEADERS.indexOf("retry_button") + 1;
  const retryCell = sheet.getRange(rowNumber, retryColumn);
  retryCell.insertCheckboxes();
  retryCell.setHorizontalAlignment("center");
  retryCell.setVerticalAlignment("middle");

  const retryValue = retryCell.getValue();
  if (retryValue !== true && retryValue !== false) {
    retryCell.setValue(false);
  }

  if (rowNumber % 2 === 0) {
    rowRange.setBackground("#f7fbff");
  } else {
    rowRange.setBackground("#ffffff");
  }

  gApplyStatusVisualForRow(sheet, rowNumber);
}

function gNormalizeDeliveryStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (!normalized) return "";
  if (normalized.indexOf("failed_generation") !== -1) return "failed_generation";
  if (normalized.indexOf("retry_in_progress") !== -1) return "retry_in_progress";
  if (normalized.indexOf("generated_email_failed") !== -1) return "generated_email_failed";
  if (normalized.indexOf("generated_invalid_email") !== -1) return "generated_invalid_email";
  if (normalized.indexOf("generated_no_email") !== -1) return "generated_no_email";
  if (normalized === "sent") return "sent";
  if (normalized === "generated") return "generated";

  return normalized;
}

function gGetStatusBadgeLabel(status) {
  const normalized = gNormalizeDeliveryStatus(status);

  if (!normalized) return "-";
  if (normalized === "retry_in_progress") return "Running";
  if (normalized === "failed_generation") return "Failed";
  return "Done";
}

function gGetStatusBadgePalette(status) {
  const normalized = gNormalizeDeliveryStatus(status);

  if (normalized === "retry_in_progress") {
    return { bg: "#fff8e1", fg: "#8a5300", border: "#ffd54f" };
  }

  if (normalized === "failed_generation") {
    return { bg: "#ffebee", fg: "#b71c1c", border: "#ef9a9a" };
  }

  if (normalized) {
    return { bg: "#e8f5e9", fg: "#1b5e20", border: "#a5d6a7" };
  }

  return { bg: "#eceff1", fg: "#37474f", border: "#cfd8dc" };
}

function gApplyStatusVisualForRow(sheet, rowNumber) {
  const statusColumn = G_AI_HEADERS.indexOf("delivery_status") + 1;
  const badgeColumn = G_AI_HEADERS.indexOf("status_badge") + 1;

  const statusCell = sheet.getRange(rowNumber, statusColumn);
  const badgeCell = sheet.getRange(rowNumber, badgeColumn);

  const normalizedStatus = gNormalizeDeliveryStatus(statusCell.getValue());
  const badgeLabel = gGetStatusBadgeLabel(normalizedStatus);
  const palette = gGetStatusBadgePalette(normalizedStatus);

  badgeCell.setValue(badgeLabel);
  badgeCell.setBackground(palette.bg);
  badgeCell.setFontColor(palette.fg);
  badgeCell.setFontWeight("bold");
  badgeCell.setHorizontalAlignment("center");
  badgeCell.setVerticalAlignment("middle");
  badgeCell.setBorder(true, true, true, true, false, false, palette.border, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  statusCell.setFontWeight("bold");
  statusCell.setHorizontalAlignment("center");
}

function gBuildSubmissionSnapshot(data) {
  const source = data || {};
  const submittedAtCandidate = source.submitted_at ? new Date(source.submitted_at) : new Date();
  const submittedAt = Number.isNaN(submittedAtCandidate.getTime()) ? new Date() : submittedAtCandidate;

  return {
    submitted_at: submittedAt,
    email: gExtractFirstEmail(source.email || ""),
    brand_name: String(source.brand_name || "").trim(),
    industry: String(source.industry || "").trim(),
    target_audience: String(source.target_audience || "").trim(),
    main_goal: String(source.main_goal || "").trim(),
    platforms: String(source.platforms || "").trim(),
    brand_tone: String(source.brand_tone || "").trim(),
    brand_colors: String(source.brand_colors || "").trim(),
    offer: String(source.offer || "").trim(),
    competitors: String(source.competitors || "").trim(),
    visual_notes: String(source.visual_notes || "").trim(),
    campaign_duration: String(source.campaign_duration || "").trim(),
    budget_level: String(source.budget_level || "").trim(),
    best_content_types: String(source.best_content_types || "").trim(),
    num_posts: gSanitizeCount(source.num_posts, G_LIMITS.num_posts.min, G_LIMITS.num_posts.max, G_LIMITS.num_posts.fallback),
    num_image_designs: gSanitizeCount(
      source.num_image_designs,
      G_LIMITS.num_image_designs.min,
      G_LIMITS.num_image_designs.max,
      G_LIMITS.num_image_designs.fallback
    ),
    num_video_prompts: gSanitizeCount(
      source.num_video_prompts,
      G_LIMITS.num_video_prompts.min,
      G_LIMITS.num_video_prompts.max,
      G_LIMITS.num_video_prompts.fallback
    ),
  };
}

function gParseSubmissionSnapshot(jsonText) {
  let parsed;

  try {
    parsed = JSON.parse(String(jsonText || "").trim());
  } catch (error) {
    throw new Error("brief_json is invalid JSON.");
  }

  if (!gIsPlainObject(parsed)) {
    throw new Error("brief_json must be a JSON object.");
  }

  return gBuildSubmissionSnapshot(parsed);
}

function gEnsureAiSheetLayout(sheet) {
  if (sheet.getMaxColumns() < G_AI_HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), G_AI_HEADERS.length - sheet.getMaxColumns());
  }

  const headerRange = sheet.getRange(1, 1, 1, G_AI_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsWrite = sheet.getLastRow() === 0 || G_AI_HEADERS.some((h, i) => currentHeaders[i] !== h);

  if (needsWrite) {
    headerRange.setValues([G_AI_HEADERS]);
  }

  gStyleAiHeaders(sheet);
  G_AI_COLUMN_WIDTHS.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.setFrozenRows(1);
}

function gStyleAiHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, G_AI_HEADERS.length);
  headerRange.setBackground("#10253f");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setFontSize(10);
  sheet.setRowHeight(1, 28);
}

function gJsonCell(value) {
  if (value === undefined || value === null || value === "") return "";
  return gTruncate(gSafeStringify(value), 45000);
}

function gSafeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function gTruncate(value, maxLen) {
  const text = String(value || "");
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}


// ============================================================
// OPERATIONS: REGENERATION FROM AI SHEET
// ============================================================
function gGetUiSafe() {
  try {
    return SpreadsheetApp.getUi();
  } catch (error) {
    return null;
  }
}

function gNotifyOps(message, options) {
  const opts = options || {};
  const title = opts.title || "AI Operations";
  const durationSeconds = opts.durationSeconds || 8;
  const shouldAlert = opts.alert === true;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    try {
      ss.toast(String(message), title, durationSeconds);
    } catch (error) {
      // Ignore toast failures in non-interactive contexts.
    }
  }

  if (shouldAlert) {
    const ui = gGetUiSafe();
    if (ui) {
      ui.alert(String(message));
    }
  }

  Logger.log("[" + title + "] " + String(message));
}

function gRetrySelectedFailedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  if (!sheet || sheet.getName() !== G_AI_OUTPUT_SHEET_NAME) {
    gNotifyOps("Open '" + G_AI_OUTPUT_SHEET_NAME + "' and select a failed row first.", { alert: true });
    return;
  }

  const activeRange = sheet.getActiveRange();
  if (!activeRange || activeRange.getRow() <= 1) {
    gNotifyOps("Select a data row (not the header) and try again.", { alert: true });
    return;
  }

  const result = gRetryFailedRowByNumber(activeRange.getRow());
  gNotifyOps(result.message);

  if (!result.ok) {
    gNotifyOps(result.message, { alert: true });
  }
}

function gRetryLatestFailedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(G_AI_OUTPUT_SHEET_NAME);

  if (!sheet) {
    gNotifyOps("Sheet '" + G_AI_OUTPUT_SHEET_NAME + "' was not found.", { alert: true });
    return;
  }

  const rowNumber = gFindLatestFailedGenerationRow(sheet);
  if (!rowNumber) {
    gNotifyOps("No rows with status 'failed_generation' were found.", { alert: true });
    return;
  }

  const result = gRetryFailedRowByNumber(rowNumber);
  ss.setActiveSheet(sheet);
  sheet.setActiveSelection("A" + rowNumber);
  gNotifyOps(result.message);

  if (!result.ok) {
    gNotifyOps(result.message, { alert: true });
  }
}

function gRetryFailedRowByNumber(rowNumber) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(G_AI_OUTPUT_SHEET_NAME);

    if (!sheet) {
      return { ok: false, message: "Sheet '" + G_AI_OUTPUT_SHEET_NAME + "' was not found." };
    }

    gEnsureAiSheetLayout(sheet);

    const lastRow = sheet.getLastRow();
    if (rowNumber <= 1 || rowNumber > lastRow) {
      return { ok: false, message: "Invalid row selected for retry: " + rowNumber };
    }

    const statusIndex = G_AI_HEADERS.indexOf("delivery_status");
    const briefIndex = G_AI_HEADERS.indexOf("brief_json");
    const rowValues = sheet.getRange(rowNumber, 1, 1, G_AI_HEADERS.length).getValues()[0];

    const rawStatus = String(rowValues[statusIndex] || "").trim();
    const currentStatus = gNormalizeDeliveryStatus(rawStatus);
    if (currentStatus !== "failed_generation") {
      return {
        ok: false,
        message: "Row " + rowNumber + " status is '" + (rawStatus || "-") + "'. Only 'failed_generation' can be retried.",
      };
    }

    const briefJson = String(rowValues[briefIndex] || "").trim();
    if (!briefJson) {
      return {
        ok: false,
        message: "Row " + rowNumber + " has no brief_json. Retry is available for rows created after this update.",
      };
    }

    let data;
    try {
      data = gParseSubmissionSnapshot(briefJson);
    } catch (error) {
      return {
        ok: false,
        message: "Row " + rowNumber + " has invalid brief_json. " + String(error),
      };
    }

    const correlationId = Utilities.getUuid();
    const settings = gGetGeminiSettings();
    const modelUsed = settings && settings.model ? settings.model : G_DEFAULT_MODEL;

    if (!settings.enabled) {
      gUpdateAiSheetRow(sheet, rowNumber, data, null, {
        deliveryStatus: "failed_generation",
        modelUsed: modelUsed,
        lastError: "Gemini disabled via Script Properties.",
        correlationId: correlationId,
      });

      return { ok: false, message: "Retry stopped: Gemini is disabled in Script Properties." };
    }

    if (!settings.apiKey) {
      gUpdateAiSheetRow(sheet, rowNumber, data, null, {
        deliveryStatus: "failed_generation",
        modelUsed: modelUsed,
        lastError: "Missing GEMINI_API_KEY.",
        correlationId: correlationId,
      });

      return { ok: false, message: "Retry stopped: GEMINI_API_KEY is missing." };
    }

    gUpdateAiSheetRow(sheet, rowNumber, data, null, {
      deliveryStatus: "retry_in_progress",
      modelUsed: modelUsed,
      lastError: "",
      correlationId: correlationId,
    });

    try {
      const industryModule = gGetIndustryModule(data.industry);
      const geminiPrompt = gBuildGeminiInputPrompt(data, industryModule);
      const aiContent = gCallGeminiAPI(geminiPrompt, settings);

      const validationErrors = gValidateGeminiResponse(aiContent, data);
      if (validationErrors.length > 0) {
        throw new Error("Gemini validation failed: " + validationErrors.join(" | "));
      }

      const emailResult = gSendHtmlEmail(data, aiContent);
      const deliveryStatus = gResolveAiDeliveryStatus(emailResult);

      gUpdateAiSheetRow(sheet, rowNumber, data, aiContent, {
        deliveryStatus: deliveryStatus,
        modelUsed: modelUsed,
        lastError: emailResult.error || "",
        correlationId: correlationId,
      });

      Logger.log("[Gemini] Retry completed. Status=" + deliveryStatus + " Row=" + rowNumber + " CID=" + correlationId);
      return {
        ok: true,
        message: "Row " + rowNumber + " regenerated successfully. Status=" + deliveryStatus,
      };
    } catch (error) {
      const reason = String(error);

      gUpdateAiSheetRow(sheet, rowNumber, data, null, {
        deliveryStatus: "failed_generation",
        modelUsed: modelUsed,
        lastError: reason,
        correlationId: correlationId,
      });

      const clientDelayResult = gSendClientDelayEmail(data, correlationId, settings);
      const adminAlertResult = gSendAdminFailureAlert(
        data,
        reason,
        correlationId,
        rowNumber,
        modelUsed,
        clientDelayResult,
        settings
      );

      Logger.log(
        "[Gemini] Retry failed. ClientDelay=" + clientDelayResult.reason +
        " AdminAlert=" + adminAlertResult.reason +
        " Row=" + rowNumber +
        " CID=" + correlationId
      );

      return {
        ok: false,
        message: "Regeneration failed for row " + rowNumber + ". Check last_error for details.",
      };
    }
  } finally {
    lock.releaseLock();
  }
}

function gFindLatestFailedGenerationRow(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const statusColumn = G_AI_HEADERS.indexOf("delivery_status") + 1;
  const statuses = sheet.getRange(2, statusColumn, lastRow - 1, 1).getValues();

  for (let i = statuses.length - 1; i >= 0; i--) {
    if (gNormalizeDeliveryStatus(statuses[i][0]) === "failed_generation") {
      return i + 2;
    }
  }

  return 0;
}

function gSetupRetryButtons() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    gNotifyOps("No active spreadsheet context found. Open the bound sheet and run again.", { alert: true });
    return;
  }

  const sheet = ss.getSheetByName(G_AI_OUTPUT_SHEET_NAME);

  if (!sheet) {
    gNotifyOps("Sheet '" + G_AI_OUTPUT_SHEET_NAME + "' was not found. Create at least one row first.", { alert: true });
    return;
  }

  gEnsureAiSheetLayout(sheet);
  gBackfillStatusBadges(sheet);
  gBackfillRetryCheckboxes(sheet);
  gEnsureRetryButtonOnEditTrigger(ss.getId());

  gNotifyOps(
    "Row retry buttons are ready. In '" + G_AI_OUTPUT_SHEET_NAME + "', check the retry_button cell on any failed_generation row to regenerate it.",
    { alert: true }
  );
}

function gBackfillRetryCheckboxes(sheet) {
  const retryColumn = G_AI_HEADERS.indexOf("retry_button") + 1;
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return;
  }

  const range = sheet.getRange(2, retryColumn, lastRow - 1, 1);
  range.insertCheckboxes();
  range.setHorizontalAlignment("center");
  range.setVerticalAlignment("middle");

  const values = range.getValues().map((row) => [row[0] === true]);
  range.setValues(values);
}

function gBackfillStatusBadges(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    gApplyStatusVisualForRow(sheet, rowNumber);
  }
}

function gEnsureRetryButtonOnEditTrigger(spreadsheetId) {
  const handlerName = "gHandleRetryButtonEdit";
  const triggers = ScriptApp.getProjectTriggers();

  const exists = triggers.some((trigger) => {
    return trigger.getHandlerFunction() === handlerName
      && trigger.getEventType() === ScriptApp.EventType.ON_EDIT;
  });

  if (!exists) {
    ScriptApp.newTrigger(handlerName)
      .forSpreadsheet(spreadsheetId)
      .onEdit()
      .create();
  }
}

function gHandleRetryButtonEdit(e) {
  if (!e || !e.range) {
    return;
  }

  const range = e.range;
  const sheet = range.getSheet();
  if (!sheet || sheet.getName() !== G_AI_OUTPUT_SHEET_NAME) {
    return;
  }

  if (range.getNumRows() !== 1 || range.getNumColumns() !== 1 || range.getRow() <= 1) {
    return;
  }

  const retryColumn = G_AI_HEADERS.indexOf("retry_button") + 1;
  if (range.getColumn() !== retryColumn) {
    return;
  }

  if (range.getValue() !== true) {
    return;
  }

  const rowNumber = range.getRow();
  const result = gRetryFailedRowByNumber(rowNumber);
  range.setValue(false);
  gNotifyOps(result.message, { title: "AI Retry" });
}


// ============================================================
// HTML EMAIL DELIVERY
// ============================================================
function gSendHtmlEmail(data, aiContent) {
  if (!data.email) {
    return { sent: false, reason: "no_email", error: "" };
  }

  if (!gIsValidEmail(data.email)) {
    return { sent: false, reason: "invalid_email", error: "Invalid email format" };
  }

  const subject = `خطة المحتوى الجاهزة لبراند ${data.brand_name} 🚀`;
  const htmlBody = gBuildHtmlEmailBody(data, aiContent);
  const plainBody = gBuildHtmlFallbackPlainBody(data, aiContent);

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
    });

    return { sent: true, reason: "sent", error: "" };
  } catch (error) {
    return { sent: false, reason: "email_failed", error: String(error) };
  }
}

function gResolveAiDeliveryStatus(emailResult) {
  if (emailResult.sent) return "sent";
  if (emailResult.reason === "no_email") return "generated_no_email";
  if (emailResult.reason === "invalid_email") return "generated_invalid_email";
  if (emailResult.reason === "email_failed") return "generated_email_failed";
  return "generated";
}

function gBuildHtmlFallbackPlainBody(data, aiContent) {
  const postsCount = Array.isArray(aiContent.posts) ? aiContent.posts.length : 0;
  const imagesCount = Array.isArray(aiContent.image_designs) ? aiContent.image_designs.length : 0;
  const videosCount = Array.isArray(aiContent.video_prompts) ? aiContent.video_prompts.length : 0;

  return [
    "مرحبًا،",
    "",
    "ملف المحتوى الذكي الخاص بك جاهز.",
    "",
    "البراند: " + gToDisplayValue(data.brand_name),
    "الهدف: " + gToDisplayValue(data.main_goal),
    "عدد البوستات: " + postsCount,
    "عدد أفكار الصور: " + imagesCount,
    "عدد سكريبتات الفيديو: " + videosCount,
  ].join("\n");
}

function gSendClientDelayEmail(data, correlationId, settings) {
  if (!settings || !settings.clientDelayEmailEnabled) {
    return { sent: false, reason: "disabled", error: "" };
  }

  if (!data.email) {
    return { sent: false, reason: "no_email", error: "" };
  }

  if (!gIsValidEmail(data.email)) {
    return { sent: false, reason: "invalid_email", error: "Invalid client email format" };
  }

  const subject = `تحديث بخصوص طلب المحتوى الخاص ببراند ${data.brand_name}`;
  const body = [
    "مرحبًا،",
    "",
    "طلبك قيد التجهيز حالياً.",
    "بنراجع البيانات ونعالجها للتأكد من خروج المحتوى بأعلى جودة ممكنة.",
    "هيصلك المحتوى في أقرب وقت بعد اكتمال المراجعة.",
    "",
    "البراند: " + gToDisplayValue(data.brand_name),
    "الهدف: " + gToDisplayValue(data.main_goal),
    "رقم المتابعة: " + correlationId,
    "",
    "شكرًا لثقتك.",
  ].join("\n");

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body,
    });
    return { sent: true, reason: "sent", error: "" };
  } catch (error) {
    return { sent: false, reason: "email_failed", error: String(error) };
  }
}

function gSendAdminFailureAlert(data, reason, correlationId, rowNumber, modelUsed, clientDelayResult, settings) {
  if (!settings || !settings.adminAlertsEnabled) {
    return { sent: false, reason: "disabled", error: "" };
  }

  const adminEmail = String(settings.adminAlertEmail || "").trim();
  if (!adminEmail) {
    return { sent: false, reason: "missing_admin_email", error: "Missing ADMIN_ALERT_EMAIL" };
  }

  if (!gIsValidEmail(adminEmail)) {
    return { sent: false, reason: "invalid_admin_email", error: "Invalid ADMIN_ALERT_EMAIL format" };
  }

  const subject = "[Gemini Alert] Failed Generation | " + gToDisplayValue(data.brand_name);
  const body = [
    "Gemini generation failed after the configured retry attempts.",
    "Manual review is now required.",
    "",
    "Brand: " + gToDisplayValue(data.brand_name),
    "Client Email: " + gToDisplayValue(data.email),
    "Industry: " + gToDisplayValue(data.industry),
    "Goal: " + gToDisplayValue(data.main_goal),
    "Platforms: " + gToDisplayValue(data.platforms),
    "Model: " + gToDisplayValue(modelUsed),
    "Configured Retries: " + String(settings && typeof settings.maxRetries === "number" ? settings.maxRetries : G_DEFAULT_MAX_RETRIES),
    "Sheet: " + G_AI_OUTPUT_SHEET_NAME,
    "Row Number: " + rowNumber,
    "Correlation ID: " + correlationId,
    "Client Delay Email: " + (clientDelayResult && clientDelayResult.reason ? clientDelayResult.reason : "unknown"),
    "",
    "Failure Reason:",
    gTruncate(reason, 3000),
    "",
    "Recommended action:",
    "1. Open the failed row in the AI sheet.",
    "2. Review the brief and error details.",
    "3. Retry manually if needed.",
  ].join("\n");

  try {
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      body: body,
    });
    return { sent: true, reason: "sent", error: "" };
  } catch (error) {
    return { sent: false, reason: "email_failed", error: String(error) };
  }
}

function gBuildHtmlEmailBody(data, aiContent) {
  const postsCount = Array.isArray(aiContent.posts) ? aiContent.posts.length : 0;
  const imagesCount = Array.isArray(aiContent.image_designs) ? aiContent.image_designs.length : 0;
  const videosCount = Array.isArray(aiContent.video_prompts) ? aiContent.video_prompts.length : 0;
  const preheaderText = gBuildEmailPreheader(postsCount, imagesCount, videosCount);
  const nextStepsHtml = gBuildDynamicNextSteps(data, {
    postsCount: postsCount,
    imagesCount: imagesCount,
    videosCount: videosCount,
  });

  const postsHtml = gRenderPostsHtml(aiContent.posts || []);
  const imagesHtml = gRenderImagesHtml(aiContent.image_designs || []);
  const videosHtml = gRenderVideosHtml(aiContent.video_prompts || []);

  const strategy = aiContent.marketing_strategy || {};
  const sales = aiContent.sales_system || {};
  const offer = aiContent.offer_optimization || {};
  const kpi = aiContent.kpi_tracking || null;

  const strategyHtml = `
      <h3 style="margin-top:0;color:#0d3b66;font-size:18px;font-weight:800;line-height:1.6;border-right:4px solid #0d3b66;padding-right:10px;">SECTION D — Marketing Strategy</h3>
      <ul style="line-height:1.9;font-size:15px;font-weight:500;color:#1f2937;">
        <li><b>خطة المحتوى:</b> ${gEscapeHtml(strategy.content_mix_plan || "-")}</li>
        <li><b>الخطة الأسبوعية:</b> ${gEscapeHtml(strategy.weekly_posting_plan || "-")}</li>
        <li><b>استراتيجية المنصات:</b> ${gEscapeHtml(strategy.platform_strategy || "-")}</li>
        <li><b>زوايا الرسائل:</b> ${gRenderArrayInline(strategy.key_messaging_angles)}</li>
        <li><b>البوزيشننج:</b> ${gEscapeHtml(strategy.brand_positioning_statement || "-")}</li>
      </ul>`;

  const salesHtml = `
      <h3 style="margin-top:0;color:#0d3b66;font-size:18px;font-weight:800;line-height:1.6;border-right:4px solid #0d3b66;padding-right:10px;">SECTION E — Sales System</h3>
      <ul style="line-height:1.9;font-size:15px;font-weight:500;color:#1f2937;">
        <li><b>نقاط الألم:</b> ${gRenderArrayInline(sales.pain_points)}</li>
        <li><b>صياغة العرض:</b> ${gEscapeHtml(sales.offer_structuring || "-")}</li>
        <li><b>الفانل:</b> ${gEscapeHtml(sales.funnel_plan || "-")}</li>
        <li><b>زوايا الإعلانات:</b> ${gRenderArrayInline(sales.ad_angles)}</li>
        <li><b>الرد على الاعتراضات:</b> ${gRenderObjectionsInline(sales.objection_handling)}</li>
        <li><b>CTA Strategy:</b> ${gEscapeHtml(sales.cta_strategy || "-")}</li>
      </ul>`;

  const offerHtml = `
      <h3 style="margin-top:0;color:#0d3b66;font-size:18px;font-weight:800;line-height:1.6;border-right:4px solid #0d3b66;padding-right:10px;">SECTION F — Offer Optimization</h3>
      <ul style="line-height:1.9;font-size:15px;font-weight:500;color:#1f2937;">
        <li><b>العرض المحسّن:</b> ${gEscapeHtml(offer.rewritten_offer || "-")}</li>
        <li><b>عناصر الإلحاح والندرة:</b> ${gEscapeHtml(offer.urgency_or_scarcity || "-")}</li>
        <li><b>عروض بديلة:</b> ${gRenderArrayInline(offer.alternative_offers)}</li>
      </ul>`;

  const kpiHtml = kpi
    ? `
      <h3 style="margin-top:0;color:#0d3b66;font-size:18px;font-weight:800;line-height:1.6;border-right:4px solid #0d3b66;padding-right:10px;">SECTION G — KPI Tracking</h3>
      <ul style="line-height:1.9;font-size:15px;font-weight:500;color:#1f2937;">
        <li><b>أهم المؤشرات:</b> ${gRenderArrayInline(kpi.top_kpis)}</li>
        <li><b>المعايير المرجعية (Benchmarks):</b> ${gEscapeHtml(kpi.benchmarks || "-")}</li>
        <li><b>خطوات التحسين:</b> ${gEscapeHtml(kpi.optimization_actions || "-")}</li>
        <li><b>اختبارات A/B للأسبوع الأول:</b> ${gRenderArrayInline(kpi.ab_tests_week1)}</li>
      </ul>`
    : "";

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="margin:0;padding:0;background:#f5f8ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:15px;font-weight:500;direction:rtl;text-align:right;line-height:1.9;word-break:break-word;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;">
  <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;">
    ${gEscapeHtml(preheaderText)}
  </div>
  <div style="max-width:680px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16213e 0%,#0d3b66 100%);color:#fff;padding:20px 24px;border-radius:12px;text-align:center;">
      <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:800;">ملف المحتوى الذكي جاهز 🚀</h1>
      <p style="margin:0;font-size:16px;font-weight:700;opacity:0.98;">${gEscapeHtml(gToDisplayValue(data.brand_name))}</p>
    </div>

    <!-- Hero Summary -->
    <div style="background:#fff;border:2px solid #4a90e2;border-radius:12px;padding:16px 20px;margin:16px 0;text-align:center;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:14px;font-weight:700;">
        <div><span style="display:block;font-size:24px;font-weight:bold;color:#ff6b6b;">${postsCount}</span><span style="color:#666;">بوست</span></div>
        <div><span style="display:block;font-size:24px;font-weight:bold;color:#06a77d;">${imagesCount}</span><span style="color:#666;">تصميم</span></div>
        <div><span style="display:block;font-size:24px;font-weight:bold;color:#4a90e2;">${videosCount}</span><span style="color:#666;">فيديو</span></div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e8f0ff;font-size:14px;font-weight:600;color:#374151;">
        <b>الهدف:</b> ${gEscapeHtml(gToDisplayValue(data.main_goal))} | <b>المنصات:</b> ${gEscapeHtml(gToDisplayValue(data.platforms))} | <b>المدة:</b> ${gEscapeHtml(gToDisplayValue(data.campaign_duration))}
      </div>
    </div>

    <!-- Posts Section -->
    <div style="background:#fff;border:1px solid #dbe6ff;border-right:4px solid #ff6b6b;border-radius:12px;padding:16px 20px;margin-bottom:14px;">
      <h3 style="margin-top:0;color:#ff6b6b;font-size:19px;font-weight:800;">SECTION A — Social Media Posts</h3>
      ${postsHtml}
    </div>

    <!-- Images Section -->
    <div style="background:#fff;border:1px solid #dbe6ff;border-right:4px solid #06a77d;border-radius:12px;padding:16px 20px;margin-bottom:14px;">
      <h3 style="margin-top:0;color:#06a77d;font-size:19px;font-weight:800;">SECTION B — Image Designs</h3>
      ${imagesHtml}
    </div>

    <!-- Videos Section -->
    <div style="background:#fff;border:1px solid #dbe6ff;border-right:4px solid #4a90e2;border-radius:12px;padding:16px 20px;margin-bottom:14px;">
      <h3 style="margin-top:0;color:#4a90e2;font-size:19px;font-weight:800;">SECTION C — Video Prompts</h3>
      ${videosHtml}
    </div>

    <!-- Growth Plan (Strategy + Sales + Offer) -->
    <div style="background:#fff;border:1px solid #dbe6ff;border-radius:12px;padding:16px 20px;margin-bottom:14px;">
      <h2 style="margin-top:0;color:#0d3b66;font-size:21px;font-weight:800;text-align:center;padding-bottom:12px;border-bottom:2px solid #e8f0ff;">خطة النمو الشاملة</h2>
      ${strategyHtml}
      <div style="height:16px;"></div>
      ${salesHtml}
      <div style="height:16px;"></div>
      ${offerHtml}
    </div>

    ${kpiHtml ? "<div style=\"background:#fff;border:1px solid #dbe6ff;border-radius:12px;padding:16px 20px;margin-bottom:14px;\">" + kpiHtml + "</div>" : ""}

    <!-- Next Steps -->
    <div style="background:#e8f5e9;border:1px solid #81c784;border-radius:10px;padding:16px;color:#2e7d32;">
      <h4 style="margin:0 0 10px 0;font-size:17px;font-weight:800;">ابدأ من هنا — الخطوات التالية:</h4>
      ${nextStepsHtml}
    </div>

  </div>
</body>
</html>
  `.trim();
}

function gBuildEmailPreheader(postsCount, imagesCount, videosCount) {
  return postsCount + " بوستات، " + imagesCount + " تصميمات، " + videosCount + " فيديوهات جاهزة للتنفيذ.";
}

function gBuildDynamicNextSteps(data, stats) {
  const postsCount = stats && stats.postsCount ? stats.postsCount : 0;
  const imagesCount = stats && stats.imagesCount ? stats.imagesCount : 0;
  const videosCount = stats && stats.videosCount ? stats.videosCount : 0;

  const goalKey = gNormalizeKey(data.main_goal);
  const platformsKey = gNormalizeKey(data.platforms);

  const steps = [
    gGetGoalDrivenStep(goalKey, postsCount, imagesCount),
    gGetPlatformDrivenStep(platformsKey, videosCount),
    imagesCount > 0
      ? "استخدم أول تصميمين في اختبار إعلاني مدفوع وحدد جمهورين مختلفين للمقارنة."
      : "ابدأ باختبار نسختين نصيتين من أفضل بوست لمعرفة النسخة الأعلى تفاعلًا.",
    gIsHighBudget(data.budget_level)
      ? "راجع مؤشرات الأداء (KPI) يوميًا ونفّذ أول اختبار A/B خلال هذا الأسبوع."
      : "راجع النتائج بعد 72 ساعة، ثم كرر أفضل صيغة محتوى في الأسبوع التالي.",
  ];

  return "<ol style=\"margin:0;padding-right:20px;line-height:1.95;font-size:15px;font-weight:600;\">"
    + steps.map((step) => "<li>" + gEscapeHtml(step) + "</li>").join("")
    + "</ol>";
}

function gGetGoalDrivenStep(goalKey, postsCount, imagesCount) {
  const suggestedPosts = Math.max(1, Math.min(2, postsCount || 2));
  const suggestedImages = Math.max(1, Math.min(2, imagesCount || 2));

  if (goalKey.includes("sales") || goalKey.includes("مبيعات") || goalKey.includes("بيع")) {
    return "فعّل حملة تحويل سريعة باستخدام أفضل عرض + " + suggestedImages + " تصميم خلال 24 ساعة.";
  }

  if (goalKey.includes("awareness") || goalKey.includes("وعي")) {
    return "انشر أول " + suggestedPosts + " بوست توعوي لتعزيز حضور البراند خلال 24 ساعة.";
  }

  if (goalKey.includes("engagement") || goalKey.includes("تفاعل")) {
    return "ابدأ ببوست تفاعلي (سؤال أو تصويت) ثم تابع الردود والتعليقات خلال نفس اليوم.";
  }

  if (goalKey.includes("launch") || goalKey.includes("اطلاق")) {
    return "نفّذ تسلسل الإطلاق: تمهيد اليوم، كشف العرض غدًا، ثم رسالة ختامية واضحة في اليوم الثالث.";
  }

  return "انشر أول " + suggestedPosts + " بوست من الخطة خلال 24 ساعة وابدأ المتابعة اليومية.";
}

function gGetPlatformDrivenStep(platformsKey, videosCount) {
  const suggestedVideos = Math.max(1, Math.min(2, videosCount || 1));

  if (platformsKey.includes("instagram") || platformsKey.includes("انست") || platformsKey.includes("ريل") || platformsKey.includes("reel") || platformsKey.includes("tiktok") || platformsKey.includes("تيك توك")) {
    return "اختبر " + suggestedVideos + " فيديو قصير (Reel/TikTok) بهوك قوي في أول ثانيتين خلال 48 ساعة.";
  }

  if (platformsKey.includes("youtube") || platformsKey.includes("يوتيوب")) {
    return "ابدأ بفيديو واحد بنمط قصصي واضح، ثم أعد تدوير أفضل مقطع كنسخة Shorts.";
  }

  if (platformsKey.includes("facebook") || platformsKey.includes("فيسبوك")) {
    return "حوّل أفضل بوست إلى إعلان Facebook برسالة بيع مباشرة وتقسيم جمهور واضح.";
  }

  if (platformsKey.includes("linkedin") || platformsKey.includes("لينكد")) {
    return "حوّل أفضل فكرة إلى بوست احترافي على LinkedIn يبرز الخبرة والنتائج القابلة للقياس.";
  }

  return "وزّع أول 3 قطع محتوى على المنصات الأساسية حسب أولوية جمهورك المستهدف.";
}

function gRenderPostsHtml(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return "<p>-</p>";

  return posts.map((post, idx) => {
    const badges = gRenderBadges([
      { label: post.platform || "-", color: "#ff6b6b" },
      { label: post.format || "-", color: "#f78a4a" },
      { label: post.goal || "-", color: "#ffc107" }
    ]);

    const hashtags = Array.isArray(post.hashtags)
      ? post.hashtags.map(h => `<span style="display:inline-block;background:#fff3e0;color:#e65100;padding:3px 8px;margin:3px;border-radius:4px;font-size:12px;font-weight:700;">${gEscapeHtml(h)}</span>`).join("")
      : "-";

    return `
      <div style="border:1px solid #ffe8e8;border-radius:10px;padding:12px;margin:10px 0;background:#fffbfb;font-size:14px;line-height:1.9;font-weight:500;color:#1f2937;">
        <div style="margin-bottom:8px;"><b style="color:#d32f2f;font-size:16px;font-weight:800;">بوست ${idx + 1}</b></div>
        ${badges}
        ${gRenderContentBlock("الكابشن", post.caption || "-")}
        <div style="margin:8px 0;"><b>الهاشتاجات:</b><br/>${hashtags}</div>
        <div style="margin:8px 0;"><b>CTA:</b> ${gEscapeHtml(post.cta || "-")}</div>
      </div>`;
  }).join("");
}

function gRenderImagesHtml(images) {
  if (!Array.isArray(images) || images.length === 0) return "<p>-</p>";

  return images.map((image, idx) => {
    const badges = gRenderBadges([
      { label: image.platform_format || "-", color: "#06a77d" },
      { label: image.design_type || "-", color: "#00bfa5" },
      { label: image.goal || "-", color: "#64dd17" }
    ]);

    return `
      <div style="border:1px solid #e0f2f1;border-radius:10px;padding:12px;margin:10px 0;background:#f1f8f6;font-size:14px;line-height:1.9;font-weight:500;color:#1f2937;">
        <div style="margin-bottom:8px;"><b style="color:#00695c;font-size:16px;font-weight:800;">تصميم ${idx + 1}</b></div>
        ${badges}
        <div style="margin:8px 0;"><b>المشهد البصري:</b> ${gEscapeHtml(image.visual_scene || "-")}</div>
        <div style="margin:8px 0;"><b>العنوان الرئيسي:</b> ${gEscapeHtml(image.headline_text_overlay || "-")}</div>
        <div style="margin:8px 0;"><b>النص الداعم:</b> ${gEscapeHtml(image.supporting_copy || "-")}</div>
        ${gRenderContentBlock("وصف الصورة للذكاء الاصطناعي (AI Image Prompt)", image.full_ai_image_prompt || "-")}
        <div style="margin:8px 0;"><b>Text Policy:</b> ${gEscapeHtml(image.text_policy || "-")}</div>
        <div style="margin:8px 0;"><b>Conversion Trigger:</b> ${gEscapeHtml(image.conversion_trigger || "-")}</div>
      </div>`;
  }).join("");
}

function gRenderVideosHtml(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return "<p>-</p>";

  return videos.map((video, idx) => {
    const badges = gRenderBadges([
      { label: video.platform || "-", color: "#4a90e2" },
      { label: video.duration || "-", color: "#5c6bc0" },
      { label: video.style || "-", color: "#7e57c2" }
    ]);

    const timeline = Array.isArray(video.scenes)
      ? video.scenes.map((scene) => {
          return `
          <div style="padding:8px;margin:6px 0;background:#fff;border-right:3px solid #4a90e2;border-radius:4px;">
            <div style="font-size:14px;font-weight:800;color:#1565c0;margin-bottom:4px;">${gEscapeHtml(scene.time || "-")} — ${gEscapeHtml(scene.label || "")}</div>
            <div style="font-size:14px;font-weight:500;color:#374151;line-height:1.85;">
              <b>المشهد:</b> ${gEscapeHtml(scene.visual || "-")}<br/>
              <b>النص:</b> ${gEscapeHtml(scene.text || "-")}<br/>
              <b>الصوت:</b> ${gEscapeHtml(scene.audio || "-")}
            </div>
          </div>`;
        }).join("")
      : "<p>-</p>";

    return `
      <div style="border:1px solid #e3f2fd;border-radius:10px;padding:12px;margin:10px 0;background:#f5f9ff;font-size:14px;line-height:1.9;font-weight:500;color:#1f2937;">
        <div style="margin-bottom:8px;"><b style="color:#1565c0;font-size:16px;font-weight:800;">فيديو ${idx + 1}</b></div>
        ${badges}
        <div style="margin:8px 0;"><b>نوع الهوك:</b> ${gEscapeHtml(video.hook_type || "-")}</div>
        <div style="margin:10px 0;"><b>تسلسل السكريبت (Timeline):</b></div>
        ${timeline}
        ${gRenderContentBlock("تعليمات أداة الذكاء الاصطناعي (AI Tool Instructions)", video.ai_tool_instructions || "-")}
        <div style="margin:8px 0;"><b>ليه هيحول:</b> ${gEscapeHtml(video.why_this_converts || "-")}</div>
      </div>`;
  }).join("");
}

function gRenderArrayInline(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return gEscapeHtml(arr.join(" | "));
}

function gRenderObjectionsInline(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return arr
    .map((item) => {
      const objection = item && item.objection ? item.objection : "-";
      const response = item && item.response ? item.response : "-";
      return gEscapeHtml(objection + " => " + response);
    })
    .join("<br/>");
}

function gRenderBadges(badgeList) {
  return badgeList
    .map(b => `<span style="display:inline-block;background:${b.color};color:#fff;padding:4px 10px;margin:3px;border-radius:6px;font-size:12px;font-weight:700;">${gEscapeHtml(b.label)}</span>`)
    .join("");
}

function gRenderContentBlock(title, content) {
  return `
    <div style="margin:10px 0;padding:10px;background:#f8fafc;border-right:3px solid #999;border-radius:6px;">
      <div style="font-weight:800;color:#1f2937;margin-bottom:6px;font-size:14px;">${gEscapeHtml(title)}</div>
      <div style="color:#374151;font-size:14px;font-weight:600;line-height:1.9;">${gEscapeHtml(content)}</div>
    </div>`;
}

function gEscapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ============================================================
// LEGACY FALLBACK PROMPT + SHEET + PLAIN EMAIL
// ============================================================
function gBuildLegacyPrompt(d, industryModule) {
  const highBudgetMode = gIsHighBudget(d.budget_level);
  const officialBrandName = String(d.brand_name || "").trim();
  const preferredArabicBrandName = gBuildPreferredArabicBrandName(officialBrandName);
  const optionalVariantNote = highBudgetMode
    ? "High budget mode (6-7): You MAY add up to 1 optional A/B variant per section beyond the core requested quantities."
    : "Normal budget mode: Deliver only the requested quantities.";

  const kpiSection = highBudgetMode
    ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION G — KPI Tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a simple 30-day measurement loop:

- Top 5 KPIs to track weekly
- Benchmarks for good vs weak performance
- Optimization actions if KPI is below target
- 2 A/B tests to run in week 1

Keep it practical and execution-ready.`
    : "";

  return `
You are a world-class AI Creative Director specializing in social media advertising for Arab and regional markets.

Your mission: Read the client brief carefully, apply the Industry Module, then deliver the requested core quantities.
Execution style: keep everything practical, concise, and easy to execute this week. Avoid long theory.

Brand Name Lock:
- Official brand token: ${officialBrandName}
- Never translate, replace, or alter the brand name spelling.
- If Arabic script is needed, use this exact spelling: ${preferredArabicBrandName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brand Name              : ${d.brand_name}
Industry                : ${d.industry}
Target Audience         : ${d.target_audience}
Main Goal               : ${d.main_goal}
Active Platforms        : ${d.platforms}
Brand Tone              : ${d.brand_tone}
Brand Colors            : ${d.brand_colors}
Offer / Key Message     : ${d.offer}
Competitors             : ${d.competitors}
Visual Notes            : ${d.visual_notes}
Campaign Duration       : ${d.campaign_duration}
Budget Level (1–7)      : ${d.budget_level}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT PERFORMANCE DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Best-Performing Content : ${d.best_content_types}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT QUANTITIES REQUESTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Social Media Posts      : ${d.num_posts}
Static Image Designs    : ${d.num_image_designs}
Video Prompt Scripts    : ${d.num_video_prompts}
Count Policy            : ${optionalVariantNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTELLIGENCE RULES:

RULE 1 — CONTENT TYPE PRIORITY:
${gGetContentTypeRules(d.best_content_types)}

RULE 2 — GOAL ADAPTATION:
${gGetGoalRules(d.main_goal)}

RULE 3 — PLATFORM ADAPTATION:
Optimize each output for: ${d.platforms}

RULE 4 — BUDGET ADAPTATION:
${gGetBudgetRules(d.budget_level)}

RULE 5 — COMPETITOR DIFFERENTIATION:
Ensure NO concept resembles: ${d.competitors}
Find the gap they leave open and let ${d.brand_name} own that space.

RULE 6 — LANGUAGE & TONE:
All Social Media Posts (Section A) and Video Scripts (Section C) MUST be written in [Arabic - Egyptian Dialect] unless specified otherwise in the brand tone. Ensure the language sounds natural, catchy, and culturally relevant.

${industryModule}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION A — Social Media Posts
Generate ${d.num_posts} core posts${highBudgetMode ? " + up to 1 optional A/B variant" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each post:
## POST [N]
Platform: | Format: | Goal: |
Hook: [first line, 4-9 words, strong pattern interrupt]
Caption: [full ready-to-publish copy, preferably 35-75 words unless platform requires shorter]
Hashtags: [5–8 targeted]
CTA: [specific action]
Note: Post can be text-only; image/video is optional and not required for each post.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION B — Image Designs
Generate ${d.num_image_designs} core image prompts${highBudgetMode ? " + up to 1 optional A/B variant" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each design:
## IMAGE DESIGN [N]
Platform & Format: | Design Type: | Goal: |
Visual Scene: [description]
Headline Text Overlay: [max 8 words]
Supporting Copy: [max 15 words]
Full AI Image Prompt (Tool-Agnostic):
[Aspect Ratio: 1:1 or 9:16 / Style / Mood / Shot type / Lighting / Colors / Composition / Background]
Detail Rule: Make the image prompt highly detailed: subject details, environment, camera angle/lens, lighting setup, color palette, textures, depth, composition logic, and negative constraints.
Text Policy: If the requested text is in Arabic, explicitly instruct the AI to NOT include any text in the image. If in English, you may include a short, bold typography element (max 3 words).
Conversion Trigger: [psychological reason]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION C — Video Prompts
Generate ${d.num_video_prompts} core video prompts${highBudgetMode ? " + up to 1 optional A/B variant" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each video:
## VIDEO PROMPT [N]
Platform: | Duration: | Style: | Hook Type: |
Scene 1 [0–2s]  HOOK (very strong): Visual / Text overlay / Audio
Scene 2 [3–8s]  CONTEXT:  Visual / Text / Audio
Scene 3 [8–20s] SOLUTION: Visual / Text / Audio
Scene 4 [20s+]  CTA:      Visual / Text / Audio
AI Tool Instructions: [Any tool prompt + voiceover tone + music style]
Detail Rule: Instructions must be highly detailed and production-ready (shot-by-shot camera movement, transitions, pacing, voiceover style, music/SFX, subtitle style, and final visual grading).
Why This Converts: [one sentence]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION D — Marketing Strategy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide a clear content and marketing strategy:

- Content Mix Plan (Awareness / Engagement / Conversion %)
- Weekly Posting Plan (number of posts per platform)
- Platform Strategy (how each platform is used differently)
- Key Messaging Angles (3–5 angles to repeat across content)
- Brand Positioning Statement

Explain briefly but clearly (short actionable bullets only).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION E — Sales System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build a simple sales system for this brand:

- Target Customer Pain Points (top 3)
- Offer Structuring (how to present the offer)
- Funnel Plan:
  Awareness → Interest → Conversion

- 3 High-Converting Ad Angles
- Objection Handling (top 3 objections + الرد عليهم)
- CTA Strategy (soft vs hard CTA usage)

Make it practical and directly usable in short, execution-ready points.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION F — Offer Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Improve the current offer:

- Rewrite the offer in a more compelling way
- Add urgency or scarcity if possible
- Suggest 2 alternative offers
${kpiSection}
`.trim();
}

function gWritePromptSheet(data, readyPrompt, industryModule) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let outputSheet = ss.getSheetByName(G_PROMPT_OUTPUT_SHEET_NAME);

  if (!outputSheet) {
    outputSheet = ss.insertSheet(G_PROMPT_OUTPUT_SHEET_NAME);
  }

  gEnsurePromptSheetLayout(outputSheet);

  outputSheet.appendRow([
    data.submitted_at || new Date(),
    data.brand_name,
    data.industry,
    data.main_goal,
    gBuildOutputPlanSummary(data),
    gBuildCreativeSnapshot(data, industryModule),
    readyPrompt,
  ]);

  const lastRow = outputSheet.getLastRow();
  outputSheet.setRowHeight(lastRow, 180);

  const rowRange = outputSheet.getRange(lastRow, 1, 1, G_PROMPT_HEADERS.length);
  rowRange.setVerticalAlignment("top");
  outputSheet.getRange(lastRow, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  outputSheet.getRange(lastRow, 5, 1, 3).setWrap(true);
  outputSheet.getRange(lastRow, 7).setFontFamily("Consolas").setFontSize(10);

  if (lastRow % 2 === 0) {
    rowRange.setBackground("#f0f4ff");
  } else {
    rowRange.setBackground("#ffffff");
  }
}

function gEnsurePromptSheetLayout(outputSheet) {
  if (outputSheet.getMaxColumns() < G_PROMPT_HEADERS.length) {
    outputSheet.insertColumnsAfter(outputSheet.getMaxColumns(), G_PROMPT_HEADERS.length - outputSheet.getMaxColumns());
  }

  const headerRange = outputSheet.getRange(1, 1, 1, G_PROMPT_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaderWrite = outputSheet.getLastRow() === 0
    || G_PROMPT_HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaderWrite) {
    headerRange.setValues([G_PROMPT_HEADERS]);
  }

  gStylePromptHeaders(outputSheet);
  G_PROMPT_COLUMN_WIDTHS.forEach((width, index) => outputSheet.setColumnWidth(index + 1, width));
  outputSheet.setFrozenRows(1);
}

function gStylePromptHeaders(outputSheet) {
  const headerRange = outputSheet.getRange(1, 1, 1, G_PROMPT_HEADERS.length);
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  outputSheet.setRowHeight(1, 28);
}

function gSendPromptEmail(data, readyPrompt) {
  if (!data.email) {
    Logger.log("[Fallback] No email provided for: " + data.brand_name);
    return;
  }

  if (!gIsValidEmail(data.email)) {
    Logger.log("[Fallback] Invalid email format: " + data.email);
    return;
  }

  const subject = `خطة المحتوى الجاهزة لبراند ${data.brand_name} 🚀`;
  const body = [
    "Hello,",
    "",
    "Your custom AI prompt is ready.",
    "",
    "Brand: " + gToDisplayValue(data.brand_name),
    "Goal: " + gToDisplayValue(data.main_goal),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━",
    "COPY YOUR PROMPT BELOW",
    "━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    readyPrompt,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "Instructions:",
    "1. Copy the prompt",
    "2. Paste it into ChatGPT / Claude / Microsoft Designer",
    "3. Generate your content & designs",
    "",
    "Good luck 🚀",
  ].join("\n");

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body,
    });
    Logger.log("[Fallback] Prompt email sent to: " + data.email);
  } catch (error) {
    Logger.log("[Fallback] Failed to send prompt email to " + data.email + ": " + error);
  }
}

function gBuildOutputPlanSummary(data) {
  const parts = [
    "Posts: " + data.num_posts,
    "Images: " + data.num_image_designs,
    "Videos: " + data.num_video_prompts,
  ];

  if (gIsHighBudget(data.budget_level)) {
    parts.push("+ Optional A/B");
  }

  return parts.join(" | ");
}

function gBuildCreativeSnapshot(data, industryModule) {
  return [
    "Audience: " + gToDisplayValue(data.target_audience),
    "Offer: " + gToDisplayValue(data.offer),
    "Platforms: " + gToDisplayValue(data.platforms),
    "Top Content: " + gToDisplayValue(data.best_content_types),
    "Budget: " + gParseBudgetLevel(data.budget_level) + "/7",
    "Module: " + gExtractModuleName(industryModule),
  ].join("\n");
}

function gExtractModuleName(industryModule) {
  const firstLine = String(industryModule || "").split("\n")[0] || "";
  const moduleName = firstLine.replace(/=/g, "").trim();
  return moduleName || "GENERAL BRAND MODULE";
}

function gToDisplayValue(value) {
  const v = String(value || "").trim();
  return v || "-";
}


// ============================================================
// INDUSTRY MODULE + RULE HELPERS
// ============================================================
function gGetIndustryModule(industry) {
  const i = String(industry || "").toLowerCase();

  if (i.includes("restaurant") || i.includes("food") || i.includes("مطعم") || i.includes("أكل"))
    return `=== RESTAURANT & FOOD MODULE ===
VISUAL PSYCHOLOGY: Food triggers CRAVING. Hero is always the dish.
Appetite colors: warm reds, oranges, golden yellows, rich browns.
KEY ELEMENTS: Steam / dripping / golden crispy texture / hands / rustic surfaces.
VIDEO: First bite reaction, chef hands prep, dish assembly time-lapse.
CONTENT MIX: 3x appetite-trigger | 2x offer/deal | 2x occasion (Ramadan/Eid/Friday) | 2x social proof | 1x brand story
=== END MODULE ===`;

  if (i.includes("real estate") || i.includes("property") || i.includes("عقار"))
    return `=== REAL ESTATE MODULE ===
VISUAL PSYCHOLOGY: Sell LIFESTYLE not walls. "Can I picture myself here?"
KEY ELEMENTS: Golden hour exterior / wide interiors / lifestyle staging / drone views.
VIDEO: Drone fly-through, virtual walkthrough, ROI split-screen, client testimonial.
FUNNEL MIX: 2x dream | 2x features | 2x trust | 2x urgency | 2x investment ROI
=== END MODULE ===`;

  if (i.includes("fashion") || i.includes("clothing") || i.includes("فاشون") || i.includes("ملابس"))
    return `=== FASHION & CLOTHING MODULE ===
VISUAL PSYCHOLOGY: Sell IDENTITY — "This is who you become."
TIERS: Luxury=minimalism | Bold=urban | Friendly=modest earthy | Fun=colorful movement.
KEY ELEMENTS: Fabric texture / movement shots / flat lays / styling breakdowns.
VIDEO: Get ready with me, slow-motion fabric, "style it 3 ways".
CONTENT MIX: 3x product showcase | 2x lifestyle | 2x styling | 2x drop/launch | 1x social proof
=== END MODULE ===`;

  if (i.includes("clinic") || i.includes("health") || i.includes("عياد") || i.includes("طب"))
    return `=== CLINIC & HEALTHCARE MODULE ===
VISUAL PSYCHOLOGY: Trigger TRUST and SAFETY — never fear.
KEY ELEMENTS: Smiling doctor / clean clinic / satisfied patient / simple infographics.
VIDEO: Doctor reacts to myth, before/after journey, procedure explainer, clinic tour.
CONTENT MIX: 2x doctor trust | 2x education | 2x explainer | 2x booking CTA | 2x seasonal
AVOID: Anxiety-inducing imagery / exaggerated claims / cold grey tones
=== END MODULE ===`;

  if (i.includes("coach") || i.includes("education") || i.includes("training") || i.includes("تدريب"))
    return `=== COACHING & EDUCATION MODULE ===
VISUAL PSYCHOLOGY: Sell the TRANSFORMATION — not the course.
KEY ELEMENTS: Coach in action / student breakthrough / transformation quotes / results.
VIDEO: Hot take 15s, student transformation, free value drop, enrollment urgency.
CONTENT MIX: 2x authority | 2x transformation | 2x free value | 2x urgency | 2x community
=== END MODULE ===`;

  if (i.includes("ecommerce") || i.includes("product") || i.includes("منتج") || i.includes("متجر"))
    return `=== E-COMMERCE & PRODUCT MODULE ===
VISUAL PSYCHOLOGY: Remove purchase friction. Product is always the hero.
KEY ELEMENTS: Product hero shots / unboxing / texture close-ups / variant colorways.
VIDEO: UGC unboxing, problem→product→result 15s, flash sale countdown.
CONTENT MIX: 3x product hero | 2x social proof | 2x offer/urgency | 2x lifestyle | 1x comparison
=== END MODULE ===`;

  return `=== GENERAL BRAND MODULE ===
Focus on brand identity, key offer, and target audience pain points.
Mix: educational, promotional, social proof, and engagement content.
=== END MODULE ===`;
}

function gGetContentTypeRules(types) {
  const t = gNormalizeKey(types);
  let r = "";

  if (t.includes("short form") || t.includes("ريل") || t.includes("تيك توك")) r += "→ Short-form: Hook in first 2s. 15–30s Reel/TikTok format.\n";
  if (t.includes("static") || t.includes("single image") || t.includes("صوره") || t.includes("صور")) r += "→ Static image: Thumb-stopping single frame. Strong visual hierarchy.\n";
  if (t.includes("carousel") || t.includes("كاروسيل")) r += "→ Carousel: 30%+ of designs as slide sequences. Slide 1=hook, middle=value, last=CTA.\n";
  if (t.includes("long form") || t.includes("يوتيوب") || t.includes("longform")) r += "→ Long-form: Full narrative arc 60–90s. Story-driven.\n";
  if (t.includes("text only") || t.includes("thread") || t.includes("نصي") || t.includes("بوستات كتابيه")) r += "→ Text/threads: Strong opening line. High-value information thread format.\n";

  return r || "→ Adapt to best format for the target audience.";
}

function gGetGoalRules(goal) {
  const g = gNormalizeKey(goal);
  if (g.includes("sales") || g.includes("مبيعات") || g.includes("بيع")) return "Direct CTA in 60% of outputs. Show offer/price. Create urgency.";
  if (g.includes("awareness") || g.includes("وعي")) return "Brand story focus. No hard-sell. Build curiosity and recognition.";
  if (g.includes("engagement") || g.includes("تفاعل")) return "Poll / question / 'tag a friend' formats. Relatable and shareable.";
  if (g.includes("launch") || g.includes("اطلاق")) return "Teaser → Reveal → Launch sequence across all sections.";
  return "Balance awareness, engagement, and conversion.";
}

function gGetBudgetRules(budget) {
  const b = gParseBudgetLevel(budget);
  if (b <= 2) return "Organic: Native feel, shareable, authentic. No ad-looking designs.";
  if (b <= 5) return "Mid budget: 50% organic / 50% promotional mix.";
  return "High paid: Scroll-stopping. You MAY add one optional A/B alternate for the strongest concept in each section.";
}

function gParseBudgetLevel(budget) {
  const numericMatch = String(budget ?? "").match(/\d+/);
  const parsed = numericMatch ? parseInt(numericMatch[0], 10) : NaN;
  if (Number.isNaN(parsed)) return 3;
  return gClamp(parsed, 1, 7);
}

function gIsHighBudget(budget) {
  return gParseBudgetLevel(budget) >= 6;
}


// ============================================================
// TEST
// ============================================================
function testGeminiFlowWithSampleData() {
  const fakeEvent = {
    values: [
      new Date().toString(),
      "GlowSkin Clinic",
      "Clinic",
      "Women 22-40 in Cairo interested in skin care",
      "Increase Bookings",
      "Instagram, TikTok",
      "Friendly + Expert",
      "White & Teal",
      "Free consultation + 20% discount this month",
      "Nearby clinics",
      "Clean premium visuals with real people",
      "1 Month",
      "6",
      "Short-form videos, Static image posts",
      "5",
      "5",
      "3",
      "client@example.com",
    ],
  };

  onFormSubmitGemini(fakeEvent);
  Logger.log("✅ Gemini test done. Check sheets: " + G_AI_OUTPUT_SHEET_NAME + " and " + G_PROMPT_OUTPUT_SHEET_NAME);
}
