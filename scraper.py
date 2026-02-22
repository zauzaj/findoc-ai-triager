"""
UAE Clinic Insurance Scraper
=============================
Production-grade pipeline to extract accepted insurance providers
from UAE clinic websites and normalize them to a canonical list.

Usage:
    python scraper.py clinics.csv

Output:
    clinic_insurance_results.csv
"""

import csv
import hashlib
import logging
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Logging Setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scraper_failures.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OUTPUT_FILE = "clinic_insurance_results.csv"
PARTIAL_SAVE_INTERVAL = 10  # Save partial results every N clinics

REQUEST_TIMEOUT = 10          # seconds per request
MAX_RETRIES = 2               # retries on non-200 responses
RETRY_BACKOFF_BASE = 2        # seconds, doubles each retry

MIN_TEXT_LENGTH = 200         # below this → likely JS-heavy site
MAX_WORKERS = 5

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Fallback paths to try if insurance info isn't on homepage
INSURANCE_PATHS = [
    "/insurance",
    "/insurance-partners",
    "/accepted-insurance",
    "/about",
    "/services",
    "/faq",
    "/patient-information",
]

# Keywords that signal an insurance-related page/section
INSURANCE_KEYWORDS = [
    "insurance",
    "insurance partners",
    "accepted insurance",
    "insurance network",
    "billing",
    "network providers",
    "health coverage",
]

# ---------------------------------------------------------------------------
# Canonical Insurance Mapping (lowercase keys → canonical display name)
# ---------------------------------------------------------------------------

CANONICAL_INSURANCE: dict[str, str] = {
    "daman": "Daman",
    "axa": "AXA",
    "oman insurance": "Oman Insurance",
    "cigna": "Cigna",
    "metlife": "MetLife",
    "allianz": "Allianz",
    "bupa": "Bupa",
    "dubai insurance": "Dubai Insurance",
    "adnic": "ADNIC",
    "nas": "NAS",
    "nextcare": "NextCare",
    "mednet": "MedNet",
    "neuron": "Neuron",
}

# Build regex patterns from canonical keys (longest first to avoid partial
# matches swallowing longer names, e.g. "nas" inside "nextcare").
_SORTED_KEYS = sorted(CANONICAL_INSURANCE.keys(), key=len, reverse=True)
_INSURANCE_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in _SORTED_KEYS) + r")\b",
    re.IGNORECASE,
)

# Blog/news path segments – matches here incur a confidence penalty
_BLOG_PATH_RE = re.compile(r"/(blog|news|article|press|media)/", re.IGNORECASE)

# Output CSV columns
OUTPUT_COLUMNS = [
    "clinic_name",
    "website_url",
    "emirate",
    "primary_specialty",
    "insurance_found",
    "insurance_count",
    "confidence_score",
    "scrape_status",
    "raw_insurance_snippet",
]

# ---------------------------------------------------------------------------
# HTTP / Fetching
# ---------------------------------------------------------------------------


def _sleep_random(min_s: float = 1.0, max_s: float = 3.0) -> None:
    """Polite random delay between requests."""
    time.sleep(random.uniform(min_s, max_s))


def fetch_page(url: str, session: requests.Session) -> tuple[str | None, str]:
    """
    Fetch a single URL with retry logic.

    Returns:
        (html_content, effective_url) on success
        (None, url) on failure
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            if response.status_code == 200:
                response.encoding = response.apparent_encoding or "utf-8"
                return response.text, response.url
            logger.warning(
                "Non-200 status %s for %s (attempt %d/%d)",
                response.status_code,
                url,
                attempt + 1,
                MAX_RETRIES + 1,
            )
        except requests.exceptions.Timeout:
            logger.warning("Timeout fetching %s (attempt %d/%d)", url, attempt + 1, MAX_RETRIES + 1)
        except requests.exceptions.TooManyRedirects:
            logger.error("Too many redirects for %s", url)
            return None, url
        except requests.exceptions.RequestException as exc:
            logger.warning("Request error for %s: %s (attempt %d/%d)", url, exc, attempt + 1, MAX_RETRIES + 1)

        if attempt < MAX_RETRIES:
            backoff = RETRY_BACKOFF_BASE ** (attempt + 1)
            logger.info("Retrying %s in %ss…", url, backoff)
            time.sleep(backoff)

    return None, url


# ---------------------------------------------------------------------------
# Text Extraction
# ---------------------------------------------------------------------------


def extract_visible_text(html: str) -> str:
    """
    Parse HTML and return human-readable visible text.
    Strips scripts, styles, and navigation clutter.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove noise tags
    for tag in soup(["script", "style", "noscript", "head", "meta", "link"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text


def _is_js_heavy(text: str) -> bool:
    """Heuristic: very short extracted text → likely client-side rendered."""
    return len(text.strip()) < MIN_TEXT_LENGTH


# ---------------------------------------------------------------------------
# Insurance Detection
# ---------------------------------------------------------------------------


def find_insurance_matches(text: str) -> list[str]:
    """
    Return raw (unnormalized) matched insurance strings from text.
    Deduplicates case-insensitively.
    """
    raw_matches = _INSURANCE_PATTERN.findall(text)
    seen: set[str] = set()
    unique: list[str] = []
    for m in raw_matches:
        key = m.lower()
        if key not in seen:
            seen.add(key)
            unique.append(m)
    return unique


def normalize_providers(raw_matches: list[str]) -> list[str]:
    """
    Map raw matched strings to canonical insurance names.
    Applies partial-match logic (e.g. "Daman Thiqa" → "Daman").
    Deduplicates canonical names.
    """
    canonical_found: dict[str, str] = {}  # canonical_name → first raw match
    for raw in raw_matches:
        raw_lower = raw.lower().strip()
        for key, canonical in CANONICAL_INSURANCE.items():
            if key in raw_lower:
                if canonical not in canonical_found:
                    canonical_found[canonical] = raw
                break
    return list(canonical_found.keys())


def _extract_snippet(text: str, max_chars: int = 300) -> str:
    """
    Pull a short snippet around the first insurance keyword mention.
    Used for the raw_insurance_snippet column.
    """
    match = re.search(r"insur", text, re.IGNORECASE)
    if not match:
        return ""
    start = max(0, match.start() - 50)
    end = min(len(text), match.start() + max_chars)
    return text[start:end].strip()


# ---------------------------------------------------------------------------
# Structured Content Detection
# ---------------------------------------------------------------------------


def _has_structured_insurance_list(html: str) -> bool:
    """
    Return True if insurance providers appear inside a <ul>, <li>, or <table>.
    """
    soup = BeautifulSoup(html, "html.parser")
    for container in soup.find_all(["ul", "table"]):
        container_text = container.get_text(" ", strip=True)
        if _INSURANCE_PATTERN.search(container_text):
            return True
    return False


def _has_insurance_heading(html: str) -> bool:
    """
    Return True if an <h1>–<h4> heading contains 'insurance'.
    """
    soup = BeautifulSoup(html, "html.parser")
    for heading in soup.find_all(["h1", "h2", "h3", "h4"]):
        if re.search(r"insur", heading.get_text(), re.IGNORECASE):
            return True
    return False


def _is_blog_url(url: str) -> bool:
    return bool(_BLOG_PATH_RE.search(url))


# ---------------------------------------------------------------------------
# Confidence Scoring
# ---------------------------------------------------------------------------


def compute_confidence(
    providers: list[str],
    is_structured: bool,
    has_heading: bool,
    is_blog: bool,
    page_url: str,
) -> int:
    """
    Compute a 0–100 confidence score for the insurance extraction result.

    Scoring rules:
        Base:   40
        +30     providers found inside <ul>/<li>/<table>
        +20     page heading includes "Insurance"
        +10     per additional provider beyond the first
        -20     only a single weak mention (1 provider, no structure)
        -30     match found only in blog content
    """
    score = 40

    if not providers:
        return 0

    if is_structured:
        score += 30

    if has_heading:
        score += 20

    # +10 for each provider beyond the first
    extra = len(providers) - 1
    score += extra * 10

    # Weak single-mention penalty
    if len(providers) == 1 and not is_structured and not has_heading:
        score -= 20

    if is_blog:
        score -= 30

    return max(0, min(100, score))


# ---------------------------------------------------------------------------
# Per-Clinic Processing
# ---------------------------------------------------------------------------


def _try_insurance_subpages(
    base_url: str,
    session: requests.Session,
) -> tuple[str | None, str | None, str]:
    """
    Try common insurance-related sub-paths.
    Returns (html, effective_url, source_path) of the first successful hit,
    or (None, None, '') if none worked.
    """
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"

    for path in INSURANCE_PATHS:
        candidate = urljoin(base, path)
        _sleep_random(0.5, 1.5)
        html, effective_url = fetch_page(candidate, session)
        if html:
            text = extract_visible_text(html)
            # Only count this page as useful if insurance keywords appear
            if any(kw in text.lower() for kw in INSURANCE_KEYWORDS):
                logger.info("  Insurance content found at sub-path: %s", candidate)
                return html, effective_url, path
    return None, None, ""


def process_clinic(row: dict, session: requests.Session) -> dict:
    """
    Full pipeline for a single clinic row.

    Returns a result dict ready to write to the output CSV.
    """
    clinic_name = row["clinic_name"]
    website_url = row["website_url"].strip()
    emirate = row["emirate"]
    specialty = row["primary_specialty"]

    logger.info("Processing: %s (%s)", clinic_name, website_url)

    result_base = {
        "clinic_name": clinic_name,
        "website_url": website_url,
        "emirate": emirate,
        "primary_specialty": specialty,
        "insurance_found": "",
        "insurance_count": 0,
        "confidence_score": 0,
        "scrape_status": "failed_request",
        "raw_insurance_snippet": "",
    }

    # ── Step 1: Fetch homepage ────────────────────────────────────────────
    _sleep_random()
    html, effective_url = fetch_page(website_url, session)

    if html is None:
        logger.error("Failed to fetch homepage for %s", clinic_name)
        result_base["scrape_status"] = "failed_request"
        return result_base

    text = extract_visible_text(html)

    # ── Step 2: JS-heavy detection ────────────────────────────────────────
    if _is_js_heavy(text):
        logger.warning("JS-heavy site detected: %s", clinic_name)
        result_base["scrape_status"] = "js_heavy_site"
        return result_base

    # ── Step 3: Look for insurance content on homepage ────────────────────
    has_insurance_keyword = any(kw in text.lower() for kw in INSURANCE_KEYWORDS)
    active_html = html
    active_url = effective_url

    if not has_insurance_keyword:
        logger.info("  No insurance keywords on homepage; trying sub-pages…")
        sub_html, sub_url, _sub_path = _try_insurance_subpages(website_url, session)
        if sub_html:
            active_html = sub_html
            active_url = sub_url or effective_url
            text = extract_visible_text(active_html)
        else:
            logger.info("  No insurance info found on any page for %s", clinic_name)
            result_base["scrape_status"] = "no_insurance_found"
            return result_base

    # ── Step 4: Extract and normalize providers ───────────────────────────
    raw_matches = find_insurance_matches(text)
    providers = normalize_providers(raw_matches)

    if not providers:
        result_base["scrape_status"] = "no_insurance_found"
        return result_base

    # ── Step 5: Structured content & heading flags ────────────────────────
    is_structured = _has_structured_insurance_list(active_html)
    has_heading = _has_insurance_heading(active_html)
    is_blog = _is_blog_url(active_url)

    # ── Step 6: Confidence score ──────────────────────────────────────────
    confidence = compute_confidence(
        providers=providers,
        is_structured=is_structured,
        has_heading=has_heading,
        is_blog=is_blog,
        page_url=active_url,
    )

    # ── Step 7: Snippet ───────────────────────────────────────────────────
    snippet = _extract_snippet(text)
    # Truncate and sanitize for CSV safety
    snippet = snippet[:400].replace("\n", " ").replace("\r", " ")

    logger.info(
        "  Found %d provider(s) with confidence %d: %s",
        len(providers),
        confidence,
        ", ".join(providers),
    )

    return {
        "clinic_name": clinic_name,
        "website_url": website_url,
        "emirate": emirate,
        "primary_specialty": specialty,
        "insurance_found": "|".join(providers),
        "insurance_count": len(providers),
        "confidence_score": confidence,
        "scrape_status": "success",
        "raw_insurance_snippet": snippet,
    }


# ---------------------------------------------------------------------------
# CSV I/O
# ---------------------------------------------------------------------------


def write_csv(results: list[dict], filepath: str) -> None:
    """Write results list to CSV, creating or overwriting the file."""
    with open(filepath, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(results)
    logger.info("Saved %d rows → %s", len(results), filepath)


def read_clinics_csv(filepath: str) -> list[dict]:
    """Read the input clinic CSV, skip blank rows."""
    rows: list[dict] = []
    with open(filepath, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            # Skip separator or blank lines that have no clinic_name
            if row.get("clinic_name", "").strip():
                rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def _build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    # Mount retry adapter is intentionally omitted so we control backoff ourselves
    return session


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <clinics.csv>")
        sys.exit(1)

    input_file = sys.argv[1]
    logger.info("Reading clinics from: %s", input_file)

    clinics = read_clinics_csv(input_file)
    logger.info("Loaded %d clinics", len(clinics))

    results: list[dict] = []
    completed = 0

    # Use a shared session per worker thread (thread-local sessions avoid contention)
    import threading
    _thread_local = threading.local()

    def get_session() -> requests.Session:
        if not hasattr(_thread_local, "session"):
            _thread_local.session = _build_session()
        return _thread_local.session

    def _task(row: dict) -> dict:
        return process_clinic(row, get_session())

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_clinic = {executor.submit(_task, row): row for row in clinics}

        for future in as_completed(future_to_clinic):
            row = future_to_clinic[future]
            try:
                result = future.result()
            except Exception as exc:
                logger.error(
                    "Unhandled exception for %s: %s",
                    row.get("clinic_name", "unknown"),
                    exc,
                    exc_info=True,
                )
                result = {
                    "clinic_name": row.get("clinic_name", ""),
                    "website_url": row.get("website_url", ""),
                    "emirate": row.get("emirate", ""),
                    "primary_specialty": row.get("primary_specialty", ""),
                    "insurance_found": "",
                    "insurance_count": 0,
                    "confidence_score": 0,
                    "scrape_status": "failed_request",
                    "raw_insurance_snippet": "",
                }

            results.append(result)
            completed += 1

            # ── Partial save every N clinics ──────────────────────────────
            if completed % PARTIAL_SAVE_INTERVAL == 0:
                logger.info("Partial save at %d/%d clinics…", completed, len(clinics))
                write_csv(results, OUTPUT_FILE)

    # Final save
    write_csv(results, OUTPUT_FILE)
    logger.info("Done. Results written to %s", OUTPUT_FILE)

    # ── Summary ───────────────────────────────────────────────────────────
    success = sum(1 for r in results if r["scrape_status"] == "success")
    no_ins = sum(1 for r in results if r["scrape_status"] == "no_insurance_found")
    failed = sum(1 for r in results if r["scrape_status"] == "failed_request")
    js_heavy = sum(1 for r in results if r["scrape_status"] == "js_heavy_site")

    print("\n=== Scrape Summary ===")
    print(f"  Total clinics  : {len(clinics)}")
    print(f"  Success        : {success}")
    print(f"  No insurance   : {no_ins}")
    print(f"  Failed request : {failed}")
    print(f"  JS-heavy site  : {js_heavy}")
    print(f"  Output file    : {OUTPUT_FILE}")
    print(f"  Failure log    : scraper_failures.log")


if __name__ == "__main__":
    main()
