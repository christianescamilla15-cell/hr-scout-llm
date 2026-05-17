"""Text normalization — lowercase + strip accents + collapse special chars.

Port of `src/utils/textNormalization.js`. Must produce IDENTICAL output to
the JS function for the scorer to match the frontend reference engine.
"""

import re
import unicodedata

_NON_WORD = re.compile(r"[^\w\s./\-+#]", re.UNICODE)


def normalize(text: str) -> str:
    if not text:
        return ""
    lower = text.lower()
    # NFD then drop combining marks (matches JS `̀-ͯ` regex)
    decomposed = unicodedata.normalize("NFD", lower)
    no_accents = "".join(c for c in decomposed if unicodedata.category(c) != "Mn")
    return _NON_WORD.sub(" ", no_accents)
