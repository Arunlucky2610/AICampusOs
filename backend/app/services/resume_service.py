import io
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_file(filepath: str) -> str:
    path = Path(filepath)
    suffix = path.suffix.lower()

    with open(path, "rb") as f:
        raw = f.read()

    if suffix == ".pdf":
        return _extract_pdf(raw)
    elif suffix == ".docx":
        return _extract_docx(raw)
    elif suffix == ".txt":
        return raw.decode("utf-8", errors="replace")
    else:
        raise ValueError(f"Unsupported file format: {suffix}")


def _extract_pdf(raw: bytes) -> str:
    from pdfminer.high_level import extract_text as pdf_extract
    text = pdf_extract(io.BytesIO(raw))
    return _clean_text(text)


def _extract_docx(raw: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(raw))
    text = "\n".join(p.text for p in doc.paragraphs)
    return _clean_text(text)


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text
