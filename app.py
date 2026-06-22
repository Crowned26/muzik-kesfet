import hashlib
import io
import json
import os
import random
import re
import string
import time
from datetime import date
from pathlib import Path

import segno
from flask import Flask, Response, jsonify, render_template, request
from youtubesearchpython import Video, VideosSearch

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
SUGGESTIONS_PATH = BASE_DIR / "data" / "suggestions.json"
REPORTS_PATH = BASE_DIR / "data" / "reports.json"
ROOMS_PATH = BASE_DIR / "data" / "rooms.json"
ROOM_TTL = 86400 * 2
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

GENRES = ["rock", "pop", "jazz", "lo-fi", "hip-hop", "electronic", "indie", "turkish-pop", "turkish-rock"]
LANGUAGES = ["tr", "en", "ja", "ko"]
MOODS = ["energetic", "calm", "focus"]
DECADES = ["2020", "2010", "2000", "1990", "1980", "1970"]

GENRE_LABELS = {
    "rock": {"tr": "Rock", "en": "Rock"},
    "pop": {"tr": "Pop", "en": "Pop"},
    "jazz": {"tr": "Jazz", "en": "Jazz"},
    "lo-fi": {"tr": "Lo-Fi", "en": "Lo-Fi"},
    "hip-hop": {"tr": "Hip-Hop", "en": "Hip-Hop"},
    "electronic": {"tr": "Electronic", "en": "Electronic"},
    "indie": {"tr": "Indie", "en": "Indie"},
    "turkish-pop": {"tr": "Türk Pop", "en": "Turkish Pop"},
    "turkish-rock": {"tr": "Türk Rock", "en": "Turkish Rock"},
}

LANGUAGE_LABELS = {
    "tr": {"tr": "Türkçe", "en": "Turkish"},
    "en": {"tr": "İngilizce", "en": "English"},
    "ja": {"tr": "Japonca", "en": "Japanese"},
    "ko": {"tr": "Korece", "en": "Korean"},
}

MOOD_LABELS = {
    "energetic": {"tr": "Enerjik", "en": "Energetic"},
    "calm": {"tr": "Sakin", "en": "Calm"},
    "focus": {"tr": "Odak", "en": "Focus"},
}

COUNTRY_FLAGS = {"US": "🇺🇸", "TR": "🇹🇷", "JP": "🇯🇵", "KR": "🇰🇷", "UK": "🇬🇧", "AU": "🇦🇺"}
LANG_COUNTRY = {"tr": "TR", "en": "US", "ja": "JP", "ko": "KR"}

SKIP_TITLE_WORDS = ("cover", "tutorial", "reaction", "karaoke", "lyrics only", "teaser", "trailer", "shorts")

RANDOM_QUERIES = [
    "official music video",
    "new music official video",
    "best songs official music video",
    "trending music official",
    "classic hits official video",
    "underrated songs official",
]

LANG_SEARCH = {
    "tr": [
        "türk pop official music video",
        "türk rock official",
        "türkçe şarkılar official video",
        "türk sanatçılar official music",
    ],
    "en": [
        "english pop official music video",
        "rock official music video",
        "indie music official video",
        "english hits official",
    ],
    "ja": ["jpop official music video", "japanese music official", "anime song official"],
    "ko": ["kpop official music video", "korean pop official", "korean music official video"],
}

GENRE_SEARCH = {
    "rock": "rock official music video",
    "pop": "pop official music video",
    "jazz": "jazz music official",
    "lo-fi": "lofi hip hop music",
    "hip-hop": "hip hop official music video",
    "electronic": "electronic music official video",
    "indie": "indie music official video",
    "turkish-pop": "türk pop official music video",
    "turkish-rock": "türk rock official music video",
}

MOOD_SEARCH = {
    "energetic": "energetic upbeat music official video",
    "calm": "calm relaxing music official",
    "focus": "lofi study beats official",
}

MODE_SEARCH = {
    "party": "party dance hits official music video",
    "study": "study lofi beats official",
    "night": "late night chill music official",
}

rooms = {}


def load_json_list(path):
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_json_list(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_rooms():
    global rooms
    if ROOMS_PATH.exists():
        with open(ROOMS_PATH, encoding="utf-8") as f:
            rooms = json.load(f)
    else:
        rooms = {}
    prune_rooms()


def save_rooms():
    ROOMS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(ROOMS_PATH, "w", encoding="utf-8") as f:
        json.dump(rooms, f, ensure_ascii=False, indent=2)


def prune_rooms():
    global rooms
    now = time.time()
    stale = [code for code, room in rooms.items() if now - room.get("updated_at", 0) > ROOM_TTL]
    for code in stale:
        rooms.pop(code, None)
    if stale:
        save_rooms()


def get_room(code):
    code = (code or "").upper()
    prune_rooms()
    return code, rooms.get(code)


load_rooms()


def parse_csv_param(value):
    return {x.strip() for x in value.split(",") if x.strip()}


def clean_title(raw):
    title = raw
    for pattern in [
        r"\(official.*?\)",
        r"\[official.*?\]",
        r"\(official audio\)",
        r"\(music video\)",
        r"\(video\)",
        r"\(audio\)",
        r"\(lyric video\)",
        r"#shorts",
    ]:
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)
    return title.strip(" -")


def parse_artist_title(raw_title, channel):
    title = clean_title(raw_title)
    artist = channel or "Unknown Artist"
    if " - " in raw_title:
        left, right = raw_title.split(" - ", 1)
        artist = left.strip()
        title = clean_title(right)
    return artist, title


def is_bad_result(result):
    title = (result.get("title") or "").lower()
    duration = result.get("duration") or ""
    if any(word in title for word in SKIP_TITLE_WORDS):
        return True
    if "#short" in title or "shorts" in title:
        return True
    if duration and duration.count(":") == 1:
        parts = duration.split(":")
        try:
            if int(parts[0]) == 0 and int(parts[1]) < 45:
                return True
        except ValueError:
            pass
    return False


def build_queries(params, lang="tr", seed=None):
    rng = random.Random(seed)
    queries = []

    genre = params.get("genre", "")
    language = params.get("language", "")
    mood = params.get("mood", "")
    decade = params.get("decade", "")
    mode = params.get("mode", "")
    custom_q = params.get("q", "").strip()

    if custom_q:
        queries.append(f"{custom_q} official music video")

    if language and language in LANG_SEARCH:
        queries.extend(LANG_SEARCH[language])

    if genre and genre in GENRE_SEARCH:
        queries.append(GENRE_SEARCH[genre])

    if mood and mood in MOOD_SEARCH:
        queries.append(MOOD_SEARCH[mood])

    if decade:
        queries.append(f"{decade}s music hits official video")

    if mode and mode in MODE_SEARCH:
        queries.append(MODE_SEARCH[mode])

    if not queries:
        queries = RANDOM_QUERIES[:]

    extras = [
        "official music video",
        "official audio",
        "music video",
        "",
    ]
    built = []
    for q in queries:
        built.append(f"{q} {rng.choice(extras)}".strip())

    rng.shuffle(built)
    return built


def youtube_search(query, limit=20):
    try:
        return VideosSearch(query, limit=limit).result().get("result", [])
    except Exception:
        return []


def result_to_payload(result, lang="tr", genre="", language="", mood="", decade=""):
    video_id = result.get("id")
    if not video_id:
        return None

    raw_title = result.get("title") or "Unknown Song"
    channel = result.get("channel", {}).get("name") or "Unknown Artist"
    artist, title = parse_artist_title(raw_title, channel)

    genre_label = GENRE_LABELS.get(genre, {}).get(lang, genre or "YouTube")
    language_label = LANGUAGE_LABELS.get(language, {}).get(lang, language or "Global")
    mood_label = MOOD_LABELS.get(mood, {}).get(lang, mood or "")
    country = LANG_COUNTRY.get(language, "US")

    view_count = ""
    if isinstance(result.get("viewCount"), dict):
        view_count = result.get("viewCount", {}).get("short") or result.get("viewCount", {}).get("text") or ""

    return {
        "id": video_id,
        "artist": artist,
        "title": title,
        "genre": genre or "youtube",
        "genre_label": genre_label if genre else ("YouTube" if lang == "en" else "YouTube"),
        "language": language or "global",
        "language_label": language_label if language else ("Global" if lang == "en" else "Global"),
        "mood": mood or "",
        "mood_label": mood_label,
        "decade": decade or "",
        "country": country,
        "country_flag": COUNTRY_FLAGS.get(country, "🌍"),
        "tags": [t for t in [genre, mood, language] if t],
        "bio": f"YouTube · {channel}" + (f" · {view_count}" if view_count else ""),
        "channel": channel,
        "duration": result.get("duration") or "",
        "view_count": view_count,
        "thumbnail": get_thumbnail(result, video_id),
        "youtube_id": video_id,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        "lyrics_url": f"https://genius.com/search?q={artist}%20{title}",
        "source": "youtube",
    }


def is_official_enough(result):
    title = (result.get("title") or "").lower()
    channel = (result.get("channel", {}).get("name") or "").lower()
    return "official" in title or "vevo" in channel or " - topic" in channel or channel.endswith("topic")


def get_thumbnail(result, video_id):
    thumbnails = result.get("thumbnails") or []
    if thumbnails:
        return thumbnails[-1].get("url")
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"


def discover_one(params, lang="tr", seed=None):
    exclude = parse_csv_param(params.get("exclude", ""))
    never = parse_csv_param(params.get("never", ""))
    heard = parse_csv_param(params.get("heard", ""))
    dislikes = parse_csv_param(params.get("dislikes", ""))
    blocked_channels = {c.lower() for c in parse_csv_param(params.get("blocked_channels", ""))}
    skip = exclude | never | dislikes
    official_only = params.get("official_only") == "1"

    if params.get("only_unheard") == "1":
        skip |= heard

    genre = params.get("genre", "")
    language = params.get("language", "")
    mood = params.get("mood", "")
    decade = params.get("decade", "")
    artist = params.get("artist", "").strip()

    if artist:
        queries = [f"{artist} official music video", f"{artist} official audio"]
    elif params.get("trending") == "1":
        queries = ["trending music official video", "new music official video 2024", "popular songs official"]
    elif params.get("niche") == "1":
        queries = ["underrated songs official", "hidden gem music official", "underground music official video"]
    else:
        queries = build_queries(params, lang, seed=seed)

    tried = []

    for query in queries[:10]:
        results = youtube_search(query, limit=25)
        random.shuffle(results)
        for result in results:
            vid = result.get("id")
            channel = (result.get("channel", {}).get("name") or "").lower()
            if not vid or vid in skip or is_bad_result(result):
                continue
            if official_only and not is_official_enough(result):
                continue
            if blocked_channels and any(b in channel for b in blocked_channels):
                continue
            tried.append(vid)
            payload = result_to_payload(result, lang, genre, language, mood, decade)
            if payload:
                return payload, None, tried

    return None, "no_youtube", tried


def daily_song(lang="tr"):
    seed = int(hashlib.md5(date.today().isoformat().encode()).hexdigest(), 16)
    params = {"mode": "night"}
    payload, error, _ = discover_one(params, lang, seed=seed)
    if payload:
        payload["daily"] = True
    return payload


def video_by_id(video_id, lang="tr"):
    try:
        info = Video.get(f"https://www.youtube.com/watch?v={video_id}", mode="dict")
        fake = {
            "id": video_id,
            "title": info.get("title", "Unknown"),
            "duration": info.get("duration", ""),
            "channel": {"name": info.get("channel", {}).get("name", "Unknown")},
        }
        return result_to_payload(fake, lang)
    except Exception:
        return {
            "id": video_id,
            "artist": "YouTube",
            "title": video_id,
            "genre": "youtube",
            "genre_label": "YouTube",
            "language": "global",
            "language_label": "Global",
            "mood": "",
            "mood_label": "",
            "decade": "",
            "country": "US",
            "country_flag": "🌍",
            "tags": [],
            "bio": "YouTube",
            "youtube_id": video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "lyrics_url": "#",
            "source": "youtube",
        }


def room_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/daily")
def daily_page():
    return render_template("index.html", open_daily=True)


@app.route("/admin")
def admin_page():
    return render_template("admin.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "source": "youtube", "unlimited": True, "rooms": len(rooms)})


@app.route("/api/trending")
def trending_api():
    lang = request.args.get("lang", "tr")
    params = dict(request.args)
    params["trending"] = "1"
    payload, error, _ = discover_one(params, lang)
    if payload:
        return jsonify(payload)
    return jsonify({"error": error}), 404


@app.route("/api/filters")
def filters_api():
    lang = request.args.get("lang", "tr")
    hour = time.localtime().tm_hour
    if hour < 10:
        time_mood = {"value": "calm", "label": MOOD_LABELS["calm"][lang]}
    elif hour < 18:
        time_mood = {"value": "energetic", "label": MOOD_LABELS["energetic"][lang]}
    else:
        time_mood = {"value": "calm", "label": MOOD_LABELS["calm"][lang]}
    return jsonify(
        {
            "source": "youtube",
            "unlimited": True,
            "pool_label": "YouTube — sınırsız" if lang == "tr" else "YouTube — unlimited",
            "time_mood": time_mood,
            "genres": [{"value": g, "label": GENRE_LABELS.get(g, {}).get(lang, g)} for g in GENRES],
            "languages": [{"value": l, "label": LANGUAGE_LABELS.get(l, {}).get(lang, l)} for l in LANGUAGES],
            "moods": [{"value": m, "label": MOOD_LABELS.get(m, {}).get(lang, m)} for m in MOODS],
            "decades": DECADES,
        }
    )


@app.route("/api/browse")
def browse():
    lang = request.args.get("lang", "tr")
    q = request.args.get("q", "").strip()
    params = dict(request.args)
    if q:
        params["q"] = q
    queries = build_queries(params, lang)
    if q:
        queries = [f"{q} official music video", f"{q} music video"] + queries
    songs = []
    seen = set()
    for query in queries[:6]:
        for result in youtube_search(query, limit=20):
            vid = result.get("id")
            if not vid or vid in seen or is_bad_result(result):
                continue
            seen.add(vid)
            payload = result_to_payload(
                result, lang,
                params.get("genre", ""),
                params.get("language", ""),
                params.get("mood", ""),
                params.get("decade", ""),
            )
            if payload:
                songs.append(payload)
            if len(songs) >= 30:
                break
        if len(songs) >= 10:
            break
    return jsonify({"songs": songs[:30]})


@app.route("/api/song/<song_id>")
def song_by_id(song_id):
    lang = request.args.get("lang", "tr")
    return jsonify(video_by_id(song_id, lang))


@app.route("/api/recommend")
def recommend():
    lang = request.args.get("lang", "tr")
    payload, error, tried = discover_one(request.args, lang)
    if payload:
        return jsonify(payload)
    messages = {
        "no_youtube": "YouTube'da uygun video bulunamadı, tekrar dene.",
    }
    return jsonify({"error": error, "message": messages.get(error, "Hata"), "tried_ids": tried}), 404


@app.route("/api/playlist")
def playlist():
    lang = request.args.get("lang", "tr")
    count = min(int(request.args.get("count", 5)), 10)
    items = []
    exclude = set()
    for _ in range(count * 4):
        if len(items) >= count:
            break
        params = dict(request.args)
        params["exclude"] = ",".join(exclude)
        payload, error, _ = discover_one(params, lang)
        if payload and payload["id"] not in exclude:
            items.append(payload)
            exclude.add(payload["id"])
    return jsonify({"playlist": items})


@app.route("/api/daily")
def daily_api():
    lang = request.args.get("lang", "tr")
    payload = daily_song(lang)
    if payload:
        return jsonify(payload)
    return jsonify({"error": "no_daily"}), 404


@app.route("/api/compare")
def compare():
    lang = request.args.get("lang", "tr")
    a, _, _ = discover_one(request.args, lang)
    exclude = request.args.get("exclude", "")
    if a:
        exclude = f"{exclude},{a['id']}" if exclude else a["id"]
    params = dict(request.args)
    params["exclude"] = exclude
    b, _, _ = discover_one(params, lang)
    if a and b:
        return jsonify({"a": a, "b": b})
    return jsonify({"error": "compare_failed"}), 404


@app.route("/api/room/create", methods=["POST"])
def room_create():
    code = room_code()
    while code in rooms:
        code = room_code()
    rooms[code] = {"song": None, "votes": {"skip": 0, "keep": 0}, "updated_at": time.time()}
    save_rooms()
    return jsonify({"code": code})


@app.route("/api/room/<code>/vote", methods=["POST"])
def room_vote(code):
    code, room = get_room(code)
    if not room:
        return jsonify({"error": "not_found"}), 404
    data = request.get_json(silent=True) or {}
    vote = data.get("vote", "keep")
    if vote not in room["votes"]:
        return jsonify({"error": "invalid"}), 400
    room["votes"][vote] += 1
    room["updated_at"] = time.time()
    save_rooms()
    return jsonify(room["votes"])


@app.route("/api/room/<code>/pick", methods=["POST"])
def room_pick(code):
    code, room = get_room(code)
    if not room:
        return jsonify({"error": "not_found"}), 404
    lang = request.args.get("lang", "tr")
    payload, error, _ = discover_one(request.args, lang)
    if not payload:
        return jsonify({"error": error}), 404
    room["song"] = payload
    room["votes"] = {"skip": 0, "keep": 0}
    room["updated_at"] = time.time()
    save_rooms()
    return jsonify(payload)


@app.route("/api/room/<code>")
def room_get(code):
    code, room = get_room(code)
    if not room:
        return jsonify({"error": "not_found"}), 404
    return jsonify(room)


@app.route("/api/room/<code>/qr")
def room_qr(code):
    code, room = get_room(code)
    if not room:
        return jsonify({"error": "not_found"}), 404
    join_url = request.host_url.rstrip("/") + "/?room=" + code
    qr = segno.make(join_url, error="l")
    out = io.BytesIO()
    qr.save(out, kind="svg", scale=4, border=1)
    out.seek(0)
    return Response(out.read(), mimetype="image/svg+xml")


@app.route("/api/report", methods=["POST"])
def report_video():
    data = request.get_json(silent=True) or {}
    youtube_id = (data.get("youtube_id") or "").strip()
    if not youtube_id:
        return jsonify({"error": "invalid"}), 400
    reports = load_json_list(REPORTS_PATH)
    reports.append({
        "youtube_id": youtube_id,
        "title": (data.get("title") or "").strip(),
        "artist": (data.get("artist") or "").strip(),
        "channel": (data.get("channel") or "").strip(),
        "reason": (data.get("reason") or "wrong").strip(),
        "at": time.time(),
    })
    save_json_list(REPORTS_PATH, reports)
    return jsonify({"ok": True})


@app.route("/api/suggest", methods=["POST"])
def suggest_song():
    data = request.get_json(silent=True) or {}
    artist = (data.get("artist") or "").strip()
    title = (data.get("title") or "").strip()
    if not artist or not title:
        return jsonify({"error": "invalid"}), 400
    suggestions = []
    if SUGGESTIONS_PATH.exists():
        with open(SUGGESTIONS_PATH, encoding="utf-8") as f:
            suggestions = json.load(f)
    suggestions.append({"artist": artist, "title": title, "at": time.time()})
    SUGGESTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SUGGESTIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(suggestions, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True})


def check_admin():
    return request.headers.get("X-Admin-Password") == ADMIN_PASSWORD


@app.route("/api/admin/suggestions")
def admin_suggestions():
    if not check_admin():
        return jsonify({"error": "unauthorized"}), 401
    return jsonify(load_json_list(SUGGESTIONS_PATH))


@app.route("/api/admin/reports")
def admin_reports():
    if not check_admin():
        return jsonify({"error": "unauthorized"}), 401
    return jsonify(load_json_list(REPORTS_PATH))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5050)
