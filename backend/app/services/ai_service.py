"""
AI service layer for GramConnect AI.

Every function here is written to call OpenAI (chat completions) when
OPENAI_API_KEY is configured, and to fall back to a deterministic rule-based
implementation when it isn't - so the whole platform still runs end-to-end
for demos, tests, and offline pilots without an API key.
"""
import json
import logging
from typing import Optional

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("gramconnect.ai")

_client = None
if settings.OPENAI_API_KEY:
    try:
        from openai import OpenAI

        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception as exc:  # pragma: no cover
        logger.warning("OpenAI client could not be initialised: %s", exc)
        _client = None


def ai_enabled() -> bool:
    return _client is not None


VALID_CATEGORIES = {
    "water", "roads", "electricity", "sanitation", "street_lights",
    "health", "agriculture", "certificates", "others",
}
VALID_PRIORITIES = {"low", "medium", "high", "critical"}


def _safe_category(value: str) -> str:
    return value if value in VALID_CATEGORIES else "others"


def _safe_priority(value: str) -> str:
    return value if value in VALID_PRIORITIES else "medium"


CATEGORY_KEYWORDS = {
    "water": ["water", "पाणी", "नळ", "supply", "tanker"],
    "roads": ["road", "रस्ता", "pothole", "गड्ढा"],
    "electricity": ["electric", "वीज", "light bill", "power cut", "वीजपुरवठा"],
    "sanitation": ["garbage", "कचरा", "drain", "गटार", "toilet", "स्वच्छता"],
    "street_lights": ["street light", "पथदिवा", "streetlight"],
    "health": ["health", "आरोग्य", "hospital", "दवाखाना", "vaccination", "लस"],
    "agriculture": ["farm", "शेती", "crop", "पिक", "irrigation"],
    "certificates": ["certificate", "दाखला", "birth certificate", "income certificate"],
}


def _rule_based_classify(text: str) -> dict:
    lowered = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in lowered:
                priority = "high" if category in ("water", "health", "electricity") else "medium"
                return {"category": category, "priority": priority, "reasoning": "rule-based keyword match"}
    return {"category": "others", "priority": "medium", "reasoning": "no keyword matched"}


def classify_complaint(description: str) -> dict:
    """Returns {category, priority, reasoning} for a complaint description."""
    if not ai_enabled():
        return _rule_based_classify(description)

    system = (
        "You are a triage assistant for an Indian Gram Panchayat complaint system. "
        "Classify the citizen complaint (which may be in Marathi, Hindi, or English) into "
        "exactly one category from: water, roads, electricity, sanitation, street_lights, "
        "health, agriculture, certificates, others. Also assign a priority from: "
        "low, medium, high, critical (critical = risk to life/health, e.g. no drinking water, "
        "live wire, disease outbreak). "
        'Respond ONLY as compact JSON: {"category": "...", "priority": "...", "reasoning": "..."}'
    )
    try:
        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": description},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        result["category"] = _safe_category(result.get("category", "others"))
        result["priority"] = _safe_priority(result.get("priority", "medium"))
        return result
    except Exception as exc:
        logger.error("classify_complaint OpenAI call failed, falling back: %s", exc)
        return _rule_based_classify(description)


def voice_assistant_reply(
    conversation_history: list[dict],
    citizen_context: Optional[dict] = None,
    language: str = "mr",
) -> dict:
    """
    Generates the AI voice assistant's next reply for an inbound citizen call.
    conversation_history: list of {"role": "citizen"|"assistant", "text": "..."}
    Returns {"reply": "...", "intent": "general_query"|"register_complaint"|"scheme_query",
             "complaint_description": Optional[str]}
    """
    if not ai_enabled():
        return _rule_based_voice_reply(conversation_history, language)

    lang_name = {"mr": "Marathi", "hi": "Hindi", "en": "English"}.get(language, "Marathi")
    system = (
        f"You are the AI voice assistant for a Gram Panchayat (village council) in Maharashtra, India. "
        f"Reply ONLY in {lang_name}, in a warm, respectful, simple tone suitable for a phone call with "
        f"villagers of any literacy level. You can answer questions about water supply schedules, "
        f"government schemes, and Gram Sabha meetings, and you can register complaints. "
        f"Citizen context: {json.dumps(citizen_context or {}, ensure_ascii=False)}. "
        'Respond ONLY as compact JSON: {"reply": "...", "intent": "general_query|register_complaint|scheme_query|greeting", '
        '"complaint_description": "..." or null}'
    )
    messages = [{"role": "system", "content": system}]
    for turn in conversation_history:
        role = "assistant" if turn["role"] == "assistant" else "user"
        messages.append({"role": role, "content": turn["text"]})

    try:
        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        logger.error("voice_assistant_reply OpenAI call failed, falling back: %s", exc)
        return _rule_based_voice_reply(conversation_history, language)


def _rule_based_voice_reply(conversation_history: list[dict], language: str) -> dict:
    last = conversation_history[-1]["text"].lower() if conversation_history else ""
    if any(w in last for w in ["तक्रार", "complaint", "problem", "समस्या"]):
        return {
            "reply": "ठीक आहे, कृपया तुमची तक्रार सांगा. मी ती नोंदवून घेते.",
            "intent": "register_complaint",
            "complaint_description": None,
        }
    if any(w in last for w in ["योजना", "scheme", "पात्र"]):
        return {
            "reply": "आपण कोणत्या शासकीय योजनेबद्दल विचारत आहात? मी तुम्हाला पात्रता सांगू शकते.",
            "intent": "scheme_query",
            "complaint_description": None,
        }
    return {
        "reply": "नमस्कार, ग्रामपंचायत सहाय्यकात आपले स्वागत आहे. मी आपली कशी मदत करू शकते?",
        "intent": "greeting",
        "complaint_description": None,
    }


def generate_campaign_call_summary(script: str, simulated_citizen_reply: str) -> dict:
    """Summarizes a simulated/completed outbound AI campaign call."""
    if not ai_enabled():
        sentiment = "neutral"
        lowered = simulated_citizen_reply.lower()
        if any(w in lowered for w in ["thank", "good", "धन्यवाद", "छान"]):
            sentiment = "positive"
        elif any(w in lowered for w in ["angry", "bad", "no water", "राग", "वाईट"]):
            sentiment = "negative"
        return {"summary": simulated_citizen_reply[:200], "sentiment": sentiment}

    system = (
        "Summarize this outbound Gram Panchayat AI call in one crisp English sentence for an "
        "admin dashboard, and classify citizen sentiment as positive, neutral, or negative. "
        'Respond ONLY as compact JSON: {"summary": "...", "sentiment": "..."}'
    )
    try:
        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": f"Campaign script: {script}\nCitizen response: {simulated_citizen_reply}",
                },
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        logger.error("generate_campaign_call_summary OpenAI call failed, falling back: %s", exc)
        return {"summary": simulated_citizen_reply[:200], "sentiment": "neutral"}


def generate_insight_narrative(raw_stats: dict) -> str:
    """Turns raw aggregated stats into a plain-English AI insight headline."""
    if not ai_enabled():
        return raw_stats.get("fallback_text", "Insight generated from current data.")

    system = (
        "You write one short, specific, actionable insight headline (max 20 words) for a "
        "Gram Panchayat governance dashboard, based on the given statistics JSON. No preamble."
    )
    try:
        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(raw_stats)},
            ],
            temperature=0.3,
            max_tokens=60,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("generate_insight_narrative OpenAI call failed, falling back: %s", exc)
        return raw_stats.get("fallback_text", "Insight generated from current data.")
