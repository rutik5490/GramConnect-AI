"""
OTP service for citizen mobile-number login.

For the pilot this "sends" OTPs by logging them to the console (so you can
test end-to-end with zero SMS cost). Swap `_send_sms` for a real provider
(MSG91, Twilio, etc.) when you're ready to go live — nothing else needs to
change, since every router calls this module rather than an SMS API directly.
"""
import logging
import secrets
import time

logger = logging.getLogger("gramconnect.otp")

OTP_TTL_SECONDS = 5 * 60  # 5 minutes
OTP_LENGTH = 6

# In-memory store for the pilot: { mobile_number: (otp, expires_at) }
# Swap for Redis before running multiple backend workers/instances.
_otp_store: dict[str, tuple[str, float]] = {}


def _send_sms(mobile_number: str, otp: str) -> None:
    """
    Stub SMS sender. Replace this function's body with a real provider call, e.g.:

        import requests
        requests.post("https://api.msg91.com/api/v5/otp", json={...})

    or Twilio's `client.messages.create(...)`.
    """
    logger.info("[GramConnect AI] OTP for %s: %s (valid %ss)", mobile_number, otp, OTP_TTL_SECONDS)
    print(f"[SMS SIMULATED] To {mobile_number}: Your GramConnect AI OTP is {otp}. Valid for 5 minutes.")


def generate_and_send_otp(mobile_number: str) -> None:
    otp = "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))
    _otp_store[mobile_number] = (otp, time.time() + OTP_TTL_SECONDS)
    _send_sms(mobile_number, otp)


def verify_otp(mobile_number: str, otp: str) -> bool:
    entry = _otp_store.get(mobile_number)
    if not entry:
        return False
    stored_otp, expires_at = entry
    if time.time() > expires_at:
        del _otp_store[mobile_number]
        return False
    if stored_otp != otp:
        return False
    del _otp_store[mobile_number]
    return True
