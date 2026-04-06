import os
import threading
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from azure.storage.blob import BlobServiceClient, generate_container_sas, ContainerSasPermissions
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
CONTAINER_NAME = os.getenv("AZURE_STORAGE_CONTAINER", "fengshuishop")

_blob_service_client: BlobServiceClient | None = None
_account_name: str = ""
_account_key: str = ""

_sas_token: str = ""
_sas_expiry: datetime = datetime.min.replace(tzinfo=timezone.utc)
_sas_lock = threading.Lock()

SAS_LIFETIME = timedelta(hours=1)
SAS_REFRESH_MARGIN = timedelta(minutes=5)


def _init_client() -> None:
    global _blob_service_client, _account_name, _account_key
    if _blob_service_client is not None:
        return
    if not CONNECTION_STRING:
        return

    _blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)

    for part in CONNECTION_STRING.split(";"):
        kv = part.split("=", 1)
        if len(kv) == 2:
            if kv[0].strip() == "AccountName":
                _account_name = kv[1].strip()
            elif kv[0].strip() == "AccountKey":
                _account_key = kv[1].strip()


def _get_container_sas() -> str:
    global _sas_token, _sas_expiry

    now = datetime.now(timezone.utc)
    if _sas_token and now < (_sas_expiry - SAS_REFRESH_MARGIN):
        return _sas_token

    with _sas_lock:
        now = datetime.now(timezone.utc)
        if _sas_token and now < (_sas_expiry - SAS_REFRESH_MARGIN):
            return _sas_token

        expiry = now + SAS_LIFETIME
        _sas_token = generate_container_sas(
            account_name=_account_name,
            container_name=CONTAINER_NAME,
            account_key=_account_key,
            permission=ContainerSasPermissions(read=True),
            start=now - timedelta(minutes=5),
            expiry=expiry,
        )
        _sas_expiry = expiry
        return _sas_token


def blob_url_for_image(image_name: str | None) -> str | None:
    if not image_name:
        return None

    _init_client()
    if _blob_service_client is None:
        return None

    sas = _get_container_sas()
    encoded_name = quote(image_name, safe="")
    base_url = _blob_service_client.url.rstrip("/")
    return f"{base_url}/{CONTAINER_NAME}/{encoded_name}?{sas}"
