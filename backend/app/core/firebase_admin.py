import json
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import get_settings

logger = logging.getLogger(__name__)

PROJECT_ID = "aicampusos-73d5b"

_firebase_app = None
_firebase_init_failed = False


def is_firebase_available() -> bool:
    global _firebase_app, _firebase_init_failed
    if _firebase_init_failed:
        return False
    if _firebase_app is None:
        _initialize_firebase()
    return _firebase_app is not None


def get_firebase_auth():
    if not is_firebase_available():
        return None
    return auth


def _generate_dummy_service_account() -> dict:
    """Generate a dummy service account credential with a real RSA key.

    Firebase Admin SDK's verify_id_token() requires a credential object to
    be attached to the app — otherwise it tries Application Default Credentials
    which don't exist in Docker. The actual signature verification uses
    Google's public JWKS endpoint (unauthenticated), so the private key here
    is never used for anything; we just need a syntactically valid credential.
    """
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()

    return {
        "type": "service_account",
        "project_id": PROJECT_ID,
        "private_key_id": "auto-generated",
        "private_key": priv_key_pem,
        "client_email": f"firebase-adminsdk@{PROJECT_ID}.iam.gserviceaccount.com",
        "client_id": "000000000000000000000",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": (
            f"https://www.googleapis.com/robot/v1/metadata/x509/"
            f"firebase-adminsdk%40{PROJECT_ID}.iam.gserviceaccount.com"
        ),
        "universe_domain": "googleapis.com",
    }


def _initialize_firebase():
    global _firebase_app, _firebase_init_failed

    project_id = PROJECT_ID

    try:
        svc_info = _generate_dummy_service_account()
        cred = credentials.Certificate(svc_info)
        _firebase_app = firebase_admin.initialize_app(cred, options={"projectId": project_id})
        logger.info("Firebase Admin SDK initialized (project=%s) — token verification enabled", project_id)
    except Exception as exc:
        logger.error("Failed to initialize Firebase Admin SDK: %s", exc)
        _firebase_init_failed = True
