/* global t */

const STORAGE = {
  favorites: "mk_favorites",
  recent: "mk_recent",
  queue: "mk_queue",
  theme: "mk_theme",
  uiLang: "mk_ui_lang",
  likes: "mk_likes",
  dislikes: "mk_dislikes",
  never: "mk_never",
  heard: "mk_heard",
  stats: "mk_stats",
  streak: "mk_streak",
  badges: "mk_badges",
  accent: "mk_accent",
  autoTheme: "mk_auto_theme",
  reducedMotion: "mk_reduced_motion",
  shakeEnabled: "mk_shake_enabled",
  lastVisit: "mk_last_visit",
  blockedChannels: "mk_blocked_channels",
  passport: "mk_passport",
  mission: "mk_mission",
  weekly: "mk_weekly",
  guessScore: "mk_guess_score",
  listenHistory: "mk_listen_history",
  queueAutoplay: "mk_queue_autoplay",
};

const APP_BUILD_VERSION = "3.6.0";

const state = {
  current: null,
  previous: null,
  loading: false,
  triedIds: [],
  radioTimer: null,
  sleepTimer: null,
  roomCode: null,
  roomPollTimer: null,
  guessAnswer: null,
  guessInterval: null,
  deferredInstall: null,
  timeMood: null,
  ytPending: null,
};

var ytPlayer = null;
var ytReady = false;

window.onYouTubeIframeAPIReady = function () {
  ytReady = true;
  if (state.ytPending) playInPlayer(state.ytPending);
};

window.appLang = "tr";

function readJson(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    var parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function byId(id) { return document.getElementById(id); }
function showLoader(on) { byId("loader").classList.toggle("hidden", !on); }
function toast(msg, err) {
  var el = byId("status");
  el.textContent = msg;
  el.classList.toggle("error", !!err);
  el.classList.remove("hidden");
  if (!err) setTimeout(function () { el.classList.add("hidden"); }, 2200);
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.documentElement.lang = window.appLang;
}

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  byId("theme-toggle").textContent = theme === "light" ? "🌙" : "☀️";
  writeJson(STORAGE.theme, theme);
}

function initTheme() {
  if (readJson(STORAGE.autoTheme, false) && window.matchMedia("(prefers-color-scheme: light)").matches) {
    applyTheme("light");
  } else {
    applyTheme(readJson(STORAGE.theme, "dark"));
  }
}

function setBgThumbnail(song) {
  const el = byId("bg-thumb");
  if (song && song.thumbnail) {
    el.style.backgroundImage = "url('" + song.thumbnail.replace(/'/g, "%27") + "')";
  } else {
    el.style.backgroundImage = "";
  }
}

function updateMediaSession(song) {
  if (!("mediaSession" in navigator) || !song) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    artwork: song.thumbnail ? [{ src: song.thumbnail, sizes: "512x512", type: "image/jpeg" }] : [],
  });
}

function trackStats(song) {
  const stats = readJson(STORAGE.stats, { discovered: 0, genres: {}, languages: {} });
  stats.discovered += 1;
  stats.genres[song.genre || "youtube"] = (stats.genres[song.genre || "youtube"] || 0) + 1;
  stats.languages[song.language || "global"] = (stats.languages[song.language || "global"] || 0) + 1;
  writeJson(STORAGE.stats, stats);
  var day = new Date().toISOString().slice(0, 10);
  var hist = readJson(STORAGE.listenHistory, {});
  hist[day] = (hist[day] || 0) + 1;
  writeJson(STORAGE.listenHistory, hist);

  const passport = readJson(STORAGE.passport, {});
  const lang = song.language || "global";
  passport[lang] = (passport[lang] || 0) + 1;
  writeJson(STORAGE.passport, passport);

  const weekKey = getWeekKey();
  const weekly = readJson(STORAGE.weekly, {});
  weekly[weekKey] = (weekly[weekKey] || 0) + 1;
  writeJson(STORAGE.weekly, weekly);

  updateStreak();
  checkMission(song);
  checkBadges();
  renderStats();
}

function getWeekKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function checkMission(song) {
  const today = new Date().toDateString();
  const mission = readJson(STORAGE.mission, { date: "", target: "", done: false });
  if (mission.date !== today) {
    const langs = ["tr", "en", "ja", "ko", "global"];
    mission.date = today;
    mission.target = langs[Math.floor(Math.random() * langs.length)];
    mission.done = false;
  }
  if (!mission.done && song.language === mission.target) {
    mission.done = true;
    toast(t("missionDone"));
    fireConfetti();
  }
  writeJson(STORAGE.mission, mission);
  renderMission();
}

function renderMission() {
  const mission = readJson(STORAGE.mission, {});
  const el = byId("daily-mission");
  if (!mission.target) { el.textContent = ""; return; }
  const label = mission.target === "global" ? "Global" : (mission.target.toUpperCase());
  el.textContent = (window.appLang === "tr" ? "Günün görevi: " : "Daily mission: ") + label + (mission.done ? " ✓" : "");
}

function updateStreak() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(STORAGE.lastVisit);
  let streak = readJson(STORAGE.streak, { count: 0, last: "" });
  if (last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  streak.count = last === yesterday ? streak.count + 1 : 1;
  streak.last = today;
  writeJson(STORAGE.streak, streak);
  localStorage.setItem(STORAGE.lastVisit, today);
}

function checkBadges() {
  const stats = readJson(STORAGE.stats, { discovered: 0, languages: {} });
  const favs = readJson(STORAGE.favorites, []);
  const badges = [];
  if (stats.discovered >= 1) badges.push("badgeFirst");
  if (stats.discovered >= 10) badges.push("badge10");
  if (stats.discovered >= 50) badges.push("badge50");
  if (favs.length >= 5) badges.push("badgeFav5");
  if (Object.keys(stats.languages || {}).length >= 3) badges.push("badgeLang3");
  writeJson(STORAGE.badges, badges);
  renderBadges();
  if (stats.discovered === 10 || stats.discovered === 50) fireConfetti();
}

function fireConfetti() {
  if (readJson(STORAGE.reducedMotion, false)) return;
  const el = byId("confetti");
  el.classList.remove("hidden");
  el.innerHTML = Array.from({ length: 24 }, function (_, i) {
    return '<span style="left:' + (Math.random() * 100) + '%;animation-delay:' + Math.random() + 's">🎉</span>';
  }).join("");
  setTimeout(function () { el.classList.add("hidden"); el.innerHTML = ""; }, 2500);
}

function buildParams(extra) {
  extra = extra || {};
  const params = new URLSearchParams(Object.assign({ lang: window.appLang }, extra));
  if (byId("genre").value) params.set("genre", byId("genre").value);
  if (byId("language").value) params.set("language", byId("language").value);
  if (byId("mood").value) params.set("mood", byId("mood").value);
  else if (byId("auto-time-mood").checked && state.timeMood) params.set("mood", state.timeMood);
  if (byId("decade").value) params.set("decade", byId("decade").value);
  if (byId("mode-preset").value) params.set("mode", byId("mode-preset").value);
  if (byId("official-only").checked) params.set("official_only", "1");
  if (byId("only-unheard").checked) params.set("only_unheard", "1");
  const blocked = readJson(STORAGE.blockedChannels, []);
  if (blocked.length) params.set("blocked_channels", blocked.join(","));
  const heard = readJson(STORAGE.recent, []).map(function (s) { return s.id; });
  if (heard.length) params.set("heard", heard.join(","));
  const never = readJson(STORAGE.never, []);
  if (never.length) params.set("never", never.join(","));
  const likes = readJson(STORAGE.likes, []);
  const dislikes = readJson(STORAGE.dislikes, []);
  if (likes.length) params.set("likes", likes.join(","));
  if (dislikes.length) params.set("dislikes", dislikes.join(","));
  if (state.triedIds.length) params.set("exclude", state.triedIds.join(","));
  if (state.current && byId("same-artist-btn").dataset.active === "1") {
    params.set("artist", state.current.artist);
  }
  return params;
}

function shareUrlForSong(song) {
  if (!song) return location.href;
  return location.origin + location.pathname + "?v=" + (song.youtube_id || song.id);
}

function streamingSearchUrl(service, song) {
  var q = encodeURIComponent((song.artist || "") + " " + (song.title || ""));
  if (service === "spotify") return "https://open.spotify.com/search/" + q;
  return "https://music.apple.com/search?term=" + q;
}

function onPlayerEnded() {
  if (byId("queue-autoplay") && byId("queue-autoplay").checked) {
    var q = readJson(STORAGE.queue, []);
    if (q.length) {
      var next = q.shift();
      writeJson(STORAGE.queue, q);
      renderQueue();
      showSong(next);
      return;
    }
  }
  if (byId("radio-mode").checked) fetchRecommendation(false);
}

function playInPlayer(song) {
  if (!song || !song.youtube_id) return;
  if (!ytReady || typeof YT === "undefined") {
    state.ytPending = song;
    return;
  }
  var speed = parseFloat(byId("speed").value) || 1;
  if (!ytPlayer) {
    ytPlayer = new YT.Player("yt-player", {
      height: "100%",
      width: "100%",
      videoId: song.youtube_id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: function (e) {
          try { e.target.setPlaybackRate(speed); } catch (err) { /* ignore */ }
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) onPlayerEnded();
        },
      },
    });
  } else {
    ytPlayer.loadVideoById(song.youtube_id);
    setTimeout(function () {
      try { ytPlayer.setPlaybackRate(speed); } catch (err) { /* ignore */ }
    }, 700);
  }
  state.ytPending = null;
}

function applyPlaybackSpeed() {
  if (!ytPlayer || !ytPlayer.setPlaybackRate) return;
  try { ytPlayer.setPlaybackRate(parseFloat(byId("speed").value) || 1); } catch (err) { /* ignore */ }
}

function stopPlayer() {
  if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
  else if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
}

function showSong(song, opts) {
  opts = opts || {};
  state.previous = state.current;
  state.current = song;
  const blindOn = opts.blind || byId("blind-mode").checked;

  byId("song-title").textContent = blindOn ? "?" + "?" + "?" : song.title;
  byId("song-artist").textContent = blindOn ? "?" + "?" + "?" : song.artist;
  byId("song-bio").textContent = blindOn ? "" : (song.bio || "");
  byId("badge-genre").textContent = song.genre_label || song.genre || "";
  byId("badge-language").textContent = (song.country_flag || "") + " " + (song.language_label || song.language || "");
  byId("badge-mood").textContent = song.mood_label || song.mood || "";
  byId("badge-decade").textContent = song.decade || song.duration || "";
  playInPlayer(song);
  byId("open-youtube").href = song.youtube_url;
  byId("lyrics-link").href = song.lyrics_url || "#";
  var sp = byId("open-spotify");
  var ap = byId("open-apple");
  if (sp) sp.href = streamingSearchUrl("spotify", song);
  if (ap) ap.href = streamingSearchUrl("apple", song);
  if (history.replaceState) {
    try { history.replaceState(null, "", shareUrlForSong(song)); } catch (e) { /* ignore */ }
  }
  byId("result").classList.remove("hidden");
  byId("another-btn").disabled = false;

  setBgThumbnail(song);
  updateMediaSession(song);

  if (blindOn) {
    setTimeout(function () {
      byId("song-title").textContent = song.title;
      byId("song-artist").textContent = song.artist;
      byId("song-bio").textContent = song.bio || "";
      toast(t("revealed"));
    }, 8000);
  }

  document.body.classList.toggle("focus-mode", byId("focus-mode").checked);
  updateFavoriteBtn();
  addRecent(song);
  addHeard(song.id);
  trackStats(song);
  scheduleRadio();
  byId("status").classList.add("hidden");
}

function addHeard(id) {
  const heard = readJson(STORAGE.heard, []);
  if (heard.indexOf(id) === -1) { heard.push(id); writeJson(STORAGE.heard, heard); }
}

function addRecent(song) {
  var recent = readJson(STORAGE.recent, []).filter(function (s) { return s.id !== song.id; });
  recent.unshift(song);
  writeJson(STORAGE.recent, recent.slice(0, 10));
  renderRecent();
}

function escapeHtml(s) {
  var d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function renderSongList(cfg) {
  var items = readJson(STORAGE[cfg.storage], []);
  var el = byId(cfg.listId);
  var clearBtn = cfg.clearBtnId ? byId(cfg.clearBtnId) : null;
  if (clearBtn) clearBtn.classList.toggle("hidden", !items.length);
  el.innerHTML = "";
  if (!items.length) {
    var empty = document.createElement("li");
    empty.textContent = t(cfg.emptyKey);
    el.appendChild(empty);
    return;
  }
  items.forEach(function (item) {
    var li = document.createElement("li");
    li.className = "list-row";
    var play = document.createElement("button");
    play.type = "button";
    play.className = "list-main";
    play.innerHTML = "<strong>" + escapeHtml(item.title) + "</strong>" + escapeHtml(item.artist);
    play.onclick = function () { showSong(item); };
    var del = document.createElement("button");
    del.type = "button";
    del.className = "list-del";
    del.setAttribute("aria-label", t("deleteRecent"));
    del.title = t("deleteRecent");
    del.textContent = "×";
    del.onclick = function (e) { e.stopPropagation(); cfg.onRemove(item.id); };
    li.appendChild(play);
    li.appendChild(del);
    el.appendChild(li);
  });
}

function removeRecent(id) {
  writeJson(STORAGE.recent, readJson(STORAGE.recent, []).filter(function (s) { return s.id !== id; }));
  renderRecent();
}

function clearRecent() {
  writeJson(STORAGE.recent, []);
  renderRecent();
  toast(t("recentCleared"));
}

function renderRecent() {
  renderSongList({
    storage: "recent",
    listId: "recent-list",
    clearBtnId: "clear-recent-btn",
    emptyKey: "noRecent",
    onRemove: removeRecent
  });
}

function removeFavorite(id) {
  writeJson(STORAGE.favorites, readJson(STORAGE.favorites, []).filter(function (s) { return s.id !== id; }));
  renderFavorites();
  updateFavoriteBtn();
  checkBadges();
  renderStats();
}

function clearFavorites() {
  writeJson(STORAGE.favorites, []);
  renderFavorites();
  updateFavoriteBtn();
  checkBadges();
  renderStats();
  toast(t("favoritesCleared"));
}

function renderFavorites() {
  renderSongList({
    storage: "favorites",
    listId: "favorites-list",
    clearBtnId: "clear-favorites-btn",
    emptyKey: "noFavorites",
    onRemove: removeFavorite
  });
}

function removeQueueItem(id) {
  writeJson(STORAGE.queue, readJson(STORAGE.queue, []).filter(function (s) { return s.id !== id; }));
  renderQueue();
}

function clearQueue() {
  writeJson(STORAGE.queue, []);
  renderQueue();
  toast(t("queueCleared"));
}

function renderQueue() {
  renderSongList({
    storage: "queue",
    listId: "queue-list",
    clearBtnId: "clear-queue-btn",
    emptyKey: "noQueue",
    onRemove: removeQueueItem
  });
}

function isFavorite(id) { return readJson(STORAGE.favorites, []).some(function (s) { return s.id === id; }); }
function updateFavoriteBtn() {
  if (!state.current) return;
  byId("favorite-btn").textContent = isFavorite(state.current.id) ? t("inFavorites") : t("addFavorite");
}

function toggleFavorite() {
  if (!state.current) return;
  var favs = readJson(STORAGE.favorites, []);
  if (isFavorite(state.current.id)) favs = favs.filter(function (s) { return s.id !== state.current.id; });
  else favs.unshift(state.current);
  writeJson(STORAGE.favorites, favs.slice(0, 50));
  renderFavorites();
  updateFavoriteBtn();
  checkBadges();
  renderStats();
}

function blockChannel() {
  if (!state.current || !state.current.channel) return;
  var blocked = readJson(STORAGE.blockedChannels, []);
  var ch = state.current.channel.toLowerCase();
  if (blocked.indexOf(ch) === -1) blocked.push(ch);
  writeJson(STORAGE.blockedChannels, blocked);
  toast(t("channelBlocked"));
  fetchRecommendation(false);
}

function addToQueue() {
  if (!state.current) return;
  var q = readJson(STORAGE.queue, []);
  if (!q.some(function (s) { return s.id === state.current.id; })) {
    q.push(state.current);
    writeJson(STORAGE.queue, q);
    renderQueue();
    toast("✓");
  }
}

function likeSong(liked) {
  if (!state.current) return;
  var key = liked ? STORAGE.likes : STORAGE.dislikes;
  var other = liked ? STORAGE.dislikes : STORAGE.likes;
  var ids = readJson(key, []);
  var otherIds = readJson(other, []).filter(function (id) { return id !== state.current.id; });
  if (ids.indexOf(state.current.id) === -1) ids.push(state.current.id);
  writeJson(key, ids);
  writeJson(other, otherIds);
  toast(liked ? "👍" : "👎");
}

function neverShow() {
  if (!state.current) return;
  var never = readJson(STORAGE.never, []);
  if (never.indexOf(state.current.id) === -1) never.push(state.current.id);
  writeJson(STORAGE.never, never);
  fetchRecommendation(false);
}

function undoLast() {
  if (state.previous) showSong(state.previous);
}

async function fetchSimilar() {
  if (!state.current) { toast(t("error"), true); return; }
  state.triedIds.push(state.current.id);
  await fetchRecommendation(false, {
    endpoint: "/api/similar?" + buildParams({ artist: state.current.artist, genre: state.current.genre }).toString(),
  });
}

async function loadSongFromUrl(videoId) {
  if (!videoId) return;
  showLoader(true);
  try {
    var res = await fetch("/api/song/" + encodeURIComponent(videoId) + "?lang=" + window.appLang);
    var data = await res.json();
    if (res.ok) showSong(data);
  } finally { showLoader(false); }
}

async function fetchRecommendation(resetTried, opts) {
  resetTried = !!resetTried;
  opts = opts || {};
  if (state.loading) return;

  if (byId("favorites-only").checked) {
    var favs = readJson(STORAGE.favorites, []);
    if (!favs.length) { toast(t("noFavorites"), true); return; }
    var pool = resetTried ? favs : favs.filter(function (s) { return state.triedIds.indexOf(s.id) === -1; });
    var pick = pool[Math.floor(Math.random() * pool.length)] || favs[0];
    state.triedIds.push(pick.id);
    showSong(pick, opts);
    return;
  }

  if (resetTried) state.triedIds = [];
  state.loading = true;
  showLoader(true);
  if (opts.roulette) byId("roulette-overlay").classList.remove("hidden");
  byId("recommend-btn").disabled = true;
  byId("another-btn").disabled = true;
  toast(t("loading"));

  try {
    var url = opts.endpoint || ("/api/recommend?" + buildParams(opts.extra).toString());
    var res = await fetch(url);
    var data = await res.json();
    if (!res.ok) {
      if (data.tried_ids) state.triedIds = state.triedIds.concat(data.tried_ids);
      toast(data.message || t("error"), true);
      return;
    }
    state.triedIds.push(data.id);
    showSong(data, opts);
  } catch (e) {
    toast(t("network"), true);
  } finally {
    state.loading = false;
    showLoader(false);
    byId("roulette-overlay").classList.add("hidden");
    byId("recommend-btn").disabled = false;
    byId("another-btn").disabled = !state.current;
    byId("same-artist-btn").dataset.active = "0";
  }
}

function parseVoiceQuery(text) {
  var q = text.toLowerCase();
  var langMap = { türkçe: "tr", turkish: "tr", english: "en", ingilizce: "en", japonca: "ja", korece: "ko" };
  var moodMap = { sakin: "calm", calm: "calm", enerjik: "energetic", energetic: "energetic", odak: "focus", focus: "focus", "lo-fi": "focus" };
  Object.keys(langMap).forEach(function (k) { if (q.indexOf(k) >= 0) byId("language").value = langMap[k]; });
  Object.keys(moodMap).forEach(function (k) { if (q.indexOf(k) >= 0) byId("mood").value = moodMap[k]; });
  if (q.indexOf("pop") >= 0) byId("genre").value = "pop";
  if (q.indexOf("rock") >= 0) byId("genre").value = "rock";
  if (q.indexOf("jazz") >= 0) byId("genre").value = "jazz";
}

async function fetchDaily() {
  showLoader(true);
  try {
    var res = await fetch("/api/daily?lang=" + window.appLang);
    var data = await res.json();
    if (res.ok) showSong(data);
    else toast(t("error"), true);
  } finally { showLoader(false); }
}

async function fetchPlaylist() {
  showLoader(true);
  try {
    var res = await fetch("/api/playlist?" + buildParams({ count: 5 }).toString());
    var data = await res.json();
    var list = byId("playlist-list");
    list.innerHTML = "";
    data.playlist.forEach(function (s) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = "<strong>" + escapeHtml(s.title) + "</strong>" + escapeHtml(s.artist);
      btn.onclick = function () { showSong(s); };
      li.appendChild(btn);
      list.appendChild(li);
    });
    byId("playlist-panel").classList.remove("hidden");
    toast(t("playlistReady"));
  } finally { showLoader(false); }
}

async function fetchCompare() {
  showLoader(true);
  try {
    var res = await fetch("/api/compare?" + buildParams().toString());
    var data = await res.json();
    if (!res.ok) { toast(t("error"), true); return; }
    renderCompareCard("compare-a", data.a, "A");
    renderCompareCard("compare-b", data.b, "B");
    byId("compare-panel").classList.remove("hidden");
  } finally { showLoader(false); }
}

function renderCompareCard(elId, song, label) {
  byId(elId).innerHTML = '<p class="compare-label">' + label + '</p><strong>' + escapeHtml(song.title) + '</strong><p>' + escapeHtml(song.artist) + '</p><button type="button" class="btn primary">' + t(label === "A" ? "pickA" : "pickB") + "</button>";
  byId(elId).querySelector("button").onclick = function () {
    showSong(song);
    byId("compare-panel").classList.add("hidden");
    likeSong(true);
  };
}

function scheduleRadio() {
  clearTimeout(state.radioTimer);
  if (!byId("radio-mode").checked) return;
  state.radioTimer = setTimeout(function () { fetchRecommendation(false); }, 30000);
}

function setupSleepTimer() {
  clearTimeout(state.sleepTimer);
  var mins = parseInt(byId("sleep-timer").value, 10);
  if (!mins) return;
  state.sleepTimer = setTimeout(function () {
    stopPlayer();
    toast(window.appLang === "tr" ? "Uyku zamanlayıcı durdu" : "Sleep timer stopped");
  }, mins * 60000);
}

async function loadFilters() {
  var res = await fetch("/api/filters?lang=" + window.appLang);
  var data = await res.json();
  state.timeMood = data.time_mood ? data.time_mood.value : null;
  [["genre", data.genres], ["language", data.languages], ["mood", data.moods]].forEach(function (pair) {
    pair[1].forEach(function (item) {
      var opt = document.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      byId(pair[0]).appendChild(opt);
    });
  });
  data.decades.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    byId("decade").appendChild(opt);
  });
  var chips = byId("quick-chips");
  data.genres.slice(0, 6).forEach(function (g) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = g.label;
    btn.onclick = function () { byId("genre").value = g.value; fetchRecommendation(true); };
    chips.appendChild(btn);
  });
  if (byId("auto-time-mood").checked && state.timeMood) byId("mood").value = state.timeMood;
}

async function loadBrowse() {
  var q = byId("browse-search").value.trim();
  var res = await fetch("/api/browse?lang=" + window.appLang + "&q=" + encodeURIComponent(q));
  var data = await res.json();
  var grid = byId("browse-grid");
  grid.innerHTML = "";
  data.songs.forEach(function (s) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "browse-card";
    card.innerHTML = "<strong>" + escapeHtml(s.title) + "</strong><span>" + escapeHtml(s.artist) + "</span>";
    card.onclick = function () { showSong(s); };
    grid.appendChild(card);
  });
}

function renderBarChart(elId, entries, labelFn) {
  var el = byId(elId);
  if (!el) return;
  if (!entries.length) { el.innerHTML = "<p class=\"visit-meta\">—</p>"; return; }
  var max = Math.max.apply(null, entries.map(function (e) { return e[1]; })) || 1;
  el.innerHTML = entries.map(function (e) {
    return '<div class="profile-bar"><span>' + escapeHtml(labelFn ? labelFn(e[0]) : e[0]) + '</span><div style="width:' + Math.max(8, (e[1] / max) * 120) + 'px"></div><small>' + e[1] + "</small></div>";
  }).join("");
}

function renderStats() {
  var stats = readJson(STORAGE.stats, { discovered: 0, genres: {}, languages: {} });
  var streak = readJson(STORAGE.streak, { count: 0 });
  byId("stat-discovered").textContent = stats.discovered;
  byId("stat-likes").textContent = readJson(STORAGE.likes, []).length;
  byId("stat-streak").textContent = streak.count;
  byId("stat-favorites").textContent = readJson(STORAGE.favorites, []).length;
  renderBarChart("genre-profile", Object.entries(stats.genres || {}).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5));
  renderBarChart("lang-chart", Object.entries(stats.languages || {}).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6));
  var hist = readJson(STORAGE.listenHistory, {});
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var key = d.toISOString().slice(0, 10);
    days.push([key.slice(5), hist[key] || 0]);
  }
  renderBarChart("listen-chart", days);
  var weekly = readJson(STORAGE.weekly, {});
  var wk = getWeekKey();
  byId("weekly-summary").innerHTML = "<strong>" + t("weeklySummary") + ":</strong> " + (weekly[wk] || 0) + " " + (window.appLang === "tr" ? "keşif" : "discoveries");
  var passport = readJson(STORAGE.passport, {});
  byId("passport").innerHTML = Object.entries(passport).map(function (e) {
    return "<span>" + e[0].toUpperCase() + " ×" + e[1] + "</span>";
  }).join("") || "—";
}

function renderBadges() {
  var badges = readJson(STORAGE.badges, []);
  byId("badges-list").innerHTML = badges.map(function (b) { return "<li>🏅 " + t(b) + "</li>"; }).join("") || "<li>—</li>";
}

async function copyLink() {
  if (!state.current) return;
  var text = state.current.artist + " - " + state.current.title + "\n" + shareUrlForSong(state.current);
  try { await navigator.clipboard.writeText(text); toast(t("copied")); }
  catch (e) { toast(t("copyFail"), true); }
}

async function shareSong() {
  if (!state.current) return;
  var url = shareUrlForSong(state.current);
  if (navigator.share) {
    try {
      await navigator.share({ title: t("title"), text: state.current.artist + " - " + state.current.title, url: url });
      return;
    } catch (e) { /* cancelled */ }
  }
  copyLink();
}

function exportFavorites() {
  var favs = readJson(STORAGE.favorites, []);
  var csv = "artist,title,url\n" + favs.map(function (s) {
    return '"' + s.artist.replace(/"/g, '""') + '","' + s.title.replace(/"/g, '""') + '","' + s.youtube_url + '"';
  }).join("\n");
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "favorites.csv";
  a.click();
}

async function createRoom() {
  var res = await fetch("/api/room/create", { method: "POST" });
  var data = await res.json();
  state.roomCode = data.code;
  byId("room-code-display").textContent = data.code;
  showRoomQR(data.code);
  startRoomPoll();
}

function showRoomQR(code) {
  var url = location.origin + "/?room=" + code;
  var qr = byId("room-qr");
  qr.classList.remove("hidden");
  qr.innerHTML = '<img src="/api/room/' + encodeURIComponent(code) + '/qr" alt="QR" width="150" height="150">' +
    '<p class="room-link"><code>' + escapeHtml(url) + '</code></p>' +
    '<button type="button" class="btn ghost" id="room-copy-btn">' + t("copyLink") + "</button>" +
    '<button type="button" class="btn ghost" id="room-copy-code-btn">' + t("copyRoomCode") + "</button>";
  byId("room-copy-btn").onclick = function () {
    navigator.clipboard.writeText(url).then(function () { toast(t("copied")); }).catch(function () { toast(t("copyFail"), true); });
  };
  byId("room-copy-code-btn").onclick = function () {
    navigator.clipboard.writeText(code).then(function () { toast(t("copied")); }).catch(function () { toast(t("copyFail"), true); });
  };
}

function renderRoomHistory(items) {
  var el = byId("room-history");
  if (!el) return;
  if (!items || !items.length) { el.innerHTML = "<li>—</li>"; return; }
  el.innerHTML = items.slice().reverse().map(function (s) {
    return "<li><strong>" + escapeHtml(s.title) + "</strong> — " + escapeHtml(s.artist) + "</li>";
  }).join("");
}

function startRoomPoll() {
  clearTimeout(state.roomPollTimer);
  if (!state.roomCode) return;
  fetch("/api/room/" + state.roomCode).then(function (r) {
    if (!r.ok) return null;
    return r.json();
  }).then(function (data) {
    if (!data || data.error) return;
    if (data.song) {
      byId("room-song").innerHTML = "<strong>" + escapeHtml(data.song.title) + "</strong> — " + escapeHtml(data.song.artist);
      var np = byId("room-now-playing");
      if (np) np.textContent = t("roomNowPlaying") + ": " + data.song.title;
      if (!state.current || state.current.id !== data.song.id) showSong(data.song);
    }
    if (data.votes) byId("vote-counts").textContent = "👍 " + data.votes.keep + " / 👎 " + data.votes.skip;
    renderRoomHistory(data.history || []);
  });
  state.roomPollTimer = setTimeout(startRoomPoll, 3000);
}

async function joinRoom() {
  state.roomCode = byId("room-join-input").value.trim().toUpperCase();
  var params = new URLSearchParams(location.search);
  if (!state.roomCode && params.get("room")) state.roomCode = params.get("room").toUpperCase();
  if (!state.roomCode) { toast(t("roomNeedJoin"), true); return; }
  var res = await fetch("/api/room/" + state.roomCode);
  var data = await res.json();
  if (!res.ok) {
    toast(t("roomNotFound"), true);
    state.roomCode = null;
    return;
  }
  byId("room-code-display").textContent = state.roomCode;
  byId("room-join-input").value = state.roomCode;
  showRoomQR(state.roomCode);
  startRoomPoll();
  toast("✓ " + state.roomCode);
}

async function roomPick() {
  if (!state.roomCode) { toast(t("roomNeedJoin"), true); return; }
  var res = await fetch("/api/room/" + state.roomCode + "/pick?" + buildParams().toString(), { method: "POST" });
  var data = await res.json();
  if (!res.ok || !data.youtube_id) { toast(data.message || t("error"), true); return; }
  showSong(data);
}

async function roomVote(vote) {
  if (!state.roomCode) { toast(t("roomNeedJoin"), true); return; }
  var res = await fetch("/api/room/" + state.roomCode + "/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vote: vote }),
  });
  var data = await res.json();
  if (!res.ok) { toast(t("roomNotFound"), true); return; }
  byId("vote-counts").textContent = "👍 " + data.keep + " / 👎 " + data.skip;
  if (vote === "skip" && data.skip >= 2) roomPick();
}

function startGuessGame() {
  byId("guess-panel").classList.remove("hidden");
  fetchRecommendation(true, { blind: true }).then(function () {
    state.guessAnswer = state.current ? state.current.artist.toLowerCase() : "";
    var sec = 10;
    byId("guess-timer").textContent = sec;
    clearInterval(state.guessInterval);
    state.guessInterval = setInterval(function () {
      sec -= 1;
      byId("guess-timer").textContent = sec;
      if (sec <= 0) { clearInterval(state.guessInterval); byId("guess-result").textContent = state.guessAnswer; }
    }, 1000);
  });
}

function submitGuess() {
  var guess = byId("guess-input").value.trim().toLowerCase();
  if (!guess || !state.guessAnswer) return;
  clearInterval(state.guessInterval);
  var ok = state.guessAnswer.indexOf(guess) >= 0 || guess.indexOf(state.guessAnswer) >= 0;
  byId("guess-result").textContent = ok ? t("guessCorrect") : t("guessWrong") + " " + state.current.artist;
  if (ok) fireConfetti();
  byId("guess-input").value = "";
}

async function reportWrongVideo() {
  if (!state.current) return;
  if (!navigator.onLine) { toast(t("network"), true); return; }
  try {
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youtube_id: state.current.youtube_id || state.current.id,
        title: state.current.title,
        artist: state.current.artist,
        channel: state.current.channel || "",
        reason: "wrong",
      }),
    });
    var never = readJson(STORAGE.never, []);
    var id = state.current.id;
    if (never.indexOf(id) === -1) never.push(id);
    writeJson(STORAGE.never, never);
    toast(t("reportSent"));
    fetchRecommendation(false);
  } catch (e) {
    toast(t("network"), true);
  }
}

async function suggestSong() {
  var artist = byId("suggest-artist").value.trim();
  var title = byId("suggest-title").value.trim();
  if (!artist || !title) return;
  await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artist: artist, title: title }) });
  toast("✓");
  byId("suggest-artist").value = "";
  byId("suggest-title").value = "";
}

function renderHelp() {
  var root = byId("help-content");
  if (!root || typeof getHelpGuide !== "function") return;
  var quick = typeof getHelpQuick === "function" ? getHelpQuick() : [];
  var html = '<div class="help-quick"><h4>' + escapeHtml(t("helpQuickTitle")) + "</h4><ol>" +
    quick.map(function (step) { return "<li>" + escapeHtml(step) + "</li>"; }).join("") + "</ol></div>";
  html += '<div class="help-section"><h4>' + escapeHtml(t("shortcutsTitle")) + "</h4><table class=\"visit-table\"><thead><tr><th>" +
    escapeHtml(t("helpWhat")) + "</th><th>" + escapeHtml(t("shortcutKey")) + "</th></tr></thead><tbody>" +
    [
      [t("recommend"), "Space"],
      [t("addFavorite"), "F"],
      [t("like"), "L"],
      [t("daily"), "D"],
    ].map(function (row) {
      return "<tr><td>" + escapeHtml(row[0]) + "</td><td><code>" + escapeHtml(row[1]) + "</code></td></tr>";
    }).join("") + "</tbody></table></div>";
  getHelpGuide().forEach(function (section) {
    html += '<div class="help-section"><h4>' + escapeHtml(section.title) + "</h4>";
    if (section.intro) html += '<p class="help-section-intro">' + escapeHtml(section.intro) + "</p>";
    html += '<div class="help-cards">' + section.items.map(renderHelpCard).join("") + "</div></div>";
  });
  root.innerHTML = html;
}

function renderHelpCard(item) {
  var rows = [
    [t("helpWhat"), item.desc],
    [t("helpWhere"), item.where],
    [t("helpHow"), item.how],
    [t("helpExample"), item.example],
  ];
  var body = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<p><span class="help-label">' + escapeHtml(r[0]) + "</span> " + escapeHtml(r[1]) + "</p>";
  }).join("");
  return '<article class="help-card">' +
    (item.icon ? '<span class="help-icon" aria-hidden="true">' + item.icon + "</span>" : "") +
    "<h5>" + escapeHtml(item.title) + "</h5>" + body + "</article>";
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.onclick = function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.add("hidden"); });
      tab.classList.add("active");
      byId("tab-" + tab.dataset.tab).classList.remove("hidden");
      if (tab.dataset.tab === "browse") loadBrowse();
      if (tab.dataset.tab === "stats") renderStats();
      if (tab.dataset.tab === "help") renderHelp();
    };
  });
}

function setupSwipe() {
  var card = byId("result");
  var startX = 0;
  card.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  card.addEventListener("touchend", function (e) {
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) < 60) return;
    if (diff > 0) likeSong(true); else likeSong(false);
    fetchRecommendation(false);
  }, { passive: true });
}

function setupShake() {
  if (!window.DeviceMotionEvent) return;
  var last = 0;
  window.addEventListener("devicemotion", function (e) {
    if (!readJson(STORAGE.shakeEnabled, true)) return;
    var acc = e.accelerationIncludingGravity;
    if (!acc) return;
    var force = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
    var now = Date.now();
    if (force > 28 && now - last > 1800) { last = now; fetchRecommendation(false); }
  });
}

function setupVoice() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var mic = byId("mic-btn");
  if (!mic) return;
  if (!SR) {
    mic.disabled = true;
    mic.title = t("micUnsupported");
    return;
  }
  var rec = new SR();
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = function () { mic.classList.add("active"); toast(t("listening")); };
  rec.onend = function () { mic.classList.remove("active"); };
  rec.onerror = function () { mic.classList.remove("active"); };
  rec.onresult = function (e) {
    var text = e.results[0][0].transcript;
    byId("voice-input").value = text;
    parseVoiceQuery(text);
    fetchRecommendation(true, { extra: { q: text } });
  };
  mic.onclick = function () {
    rec.lang = window.appLang === "tr" ? "tr-TR" : "en-US";
    try { rec.start(); } catch (err) { /* already listening */ }
  };
}

function setupOffline() {
  var banner = byId("offline-banner");
  if (!banner) return;
  function sync() {
    var off = !navigator.onLine;
    banner.classList.toggle("hidden", !off);
    banner.textContent = t("offlineMsg");
    document.body.classList.toggle("is-offline", off);
  }
  window.addEventListener("offline", sync);
  window.addEventListener("online", function () { sync(); toast(t("onlineAgain")); });
  sync();
}

function setupInstall() {
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    state.deferredInstall = e;
    byId("install-btn").classList.remove("hidden");
  });
  byId("install-btn").onclick = function () {
    if (state.deferredInstall) { state.deferredInstall.prompt(); state.deferredInstall = null; }
  };
}

function bindEvents() {
  byId("recommend-btn").onclick = function () { fetchRecommendation(true); };
  byId("another-btn").onclick = function () { fetchRecommendation(false); };
  byId("daily-btn").onclick = fetchDaily;
  byId("playlist-btn").onclick = fetchPlaylist;
  byId("compare-btn").onclick = fetchCompare;
  byId("roulette-btn").onclick = function () { fetchRecommendation(true, { roulette: true }); };
  byId("trending-btn").onclick = function () { fetchRecommendation(true, { endpoint: "/api/trending?" + buildParams().toString() }); };
  byId("niche-btn").onclick = function () { fetchRecommendation(true, { extra: { niche: "1" } }); };
  byId("same-artist-btn").onclick = function () {
    if (!state.current) return;
    byId("same-artist-btn").dataset.active = "1";
    fetchRecommendation(false, { extra: { artist: state.current.artist } });
  };
  byId("similar-btn").onclick = fetchSimilar;
  byId("guess-btn").onclick = startGuessGame;
  byId("guess-submit").onclick = submitGuess;
  byId("favorite-btn").onclick = toggleFavorite;
  byId("like-btn").onclick = function () { likeSong(true); };
  byId("dislike-btn").onclick = function () { likeSong(false); };
  byId("queue-btn").onclick = addToQueue;
  byId("block-channel-btn").onclick = blockChannel;
  byId("never-btn").onclick = neverShow;
  byId("undo-btn").onclick = undoLast;
  byId("copy-btn").onclick = copyLink;
  byId("share-btn").onclick = shareSong;
  byId("report-btn").onclick = reportWrongVideo;
  byId("export-btn").onclick = exportFavorites;
  var clearRecentBtn = byId("clear-recent-btn");
  if (clearRecentBtn) clearRecentBtn.onclick = clearRecent;
  var clearFavoritesBtn = byId("clear-favorites-btn");
  if (clearFavoritesBtn) clearFavoritesBtn.onclick = clearFavorites;
  var clearQueueBtn = byId("clear-queue-btn");
  if (clearQueueBtn) clearQueueBtn.onclick = clearQueue;
  byId("room-create-btn").onclick = createRoom;
  byId("room-join-btn").onclick = joinRoom;
  byId("room-pick-btn").onclick = roomPick;
  byId("vote-keep").onclick = function () { roomVote("keep"); };
  byId("vote-skip").onclick = function () { roomVote("skip"); };
  byId("suggest-btn").onclick = suggestSong;
  byId("browse-search").oninput = function () { loadBrowse(); };
  byId("voice-btn").onclick = function () {
    parseVoiceQuery(byId("voice-input").value);
    fetchRecommendation(true, { extra: { q: byId("voice-input").value } });
  };
  byId("ui-lang").onchange = function (e) {
    writeJson(STORAGE.uiLang, e.target.value);
    location.reload();
  };
  byId("theme-toggle").onclick = function () {
    applyTheme(document.body.classList.contains("light") ? "dark" : "light");
  };
  byId("accent-picker").oninput = function (e) {
    document.documentElement.style.setProperty("--primary", e.target.value);
    writeJson(STORAGE.accent, e.target.value);
  };
  byId("auto-theme").onchange = function (e) { writeJson(STORAGE.autoTheme, e.target.checked); };
  byId("reduced-motion").onchange = function (e) {
    writeJson(STORAGE.reducedMotion, e.target.checked);
    document.body.classList.toggle("reduced-motion", e.target.checked);
  };
  byId("shake-enabled").onchange = function (e) {
    writeJson(STORAGE.shakeEnabled, e.target.checked);
  };
  var qa = byId("queue-autoplay");
  if (qa) {
    qa.checked = readJson(STORAGE.queueAutoplay, true);
    qa.onchange = function (e) { writeJson(STORAGE.queueAutoplay, e.target.checked); };
  }
  byId("auto-time-mood").onchange = function () {
    if (byId("auto-time-mood").checked && state.timeMood) byId("mood").value = state.timeMood;
  };
  byId("radio-mode").onchange = scheduleRadio;
  byId("focus-mode").onchange = function () { document.body.classList.toggle("focus-mode", byId("focus-mode").checked); };
  byId("speed").onchange = applyPlaybackSpeed;
  byId("sleep-timer").onchange = setupSleepTimer;

  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); fetchRecommendation(!!state.current); }
    if (e.code === "KeyF") toggleFavorite();
    if (e.code === "KeyL") likeSong(true);
    if (e.code === "KeyD") fetchDaily();
  });
}

function adminEsc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function adminFmtBytes(n) {
  if (n == null || isNaN(n)) return "";
  return Math.round(n) + " MB";
}

function adminDetailLines(v) {
  var geo = v.geo || {};
  var c = v.client || {};
  var srv = v.server || {};
  var conn = c.connection;
  var lines = [];
  if (v.visit_id) lines.push(["Oturum ID", v.visit_id]);
  if (c.screen) {
    lines.push(["Ekran", c.screen + (c.viewport ? " (görünüm " + c.viewport + ")" : "")]);
  }
  if (c.screenAvail) lines.push(["Kullanılabilir ekran", c.screenAvail]);
  if (c.outerSize) lines.push(["Pencere (dış)", c.outerSize]);
  if (c.colorDepth) lines.push(["Renk derinliği", c.colorDepth + " bit"]);
  if (c.dpr) lines.push(["DPR", String(c.dpr)]);
  if (c.orientation) {
    lines.push(["Yönelim", c.orientation + (c.orientationAngle != null ? " · " + c.orientationAngle + "°" : "")]);
  }
  if (c.lang) lines.push(["Dil", c.lang + (c.langs ? " · " + c.langs : "")]);
  if (srv.accept_language) lines.push(["Accept-Language", srv.accept_language]);
  if (c.timezone) lines.push(["Saat dilimi", c.timezone]);
  if (c.platform) lines.push(["Platform", c.platform]);
  if (c.vendor) lines.push(["Tarayıcı motoru", c.vendor]);
  if (c.colorScheme) lines.push(["Tema", c.colorScheme]);
  if (c.reducedMotion) lines.push(["Az animasyon", "evet"]);
  if (c.highContrast) lines.push(["Yüksek kontrast", "evet"]);
  if (c.touch != null) lines.push(["Dokunma", c.touch + " nokta"]);
  if (c.cores) lines.push(["CPU", c.cores + " çekirdek"]);
  if (c.memory) lines.push(["RAM", "~" + c.memory + " GB"]);
  if (conn) {
    var cp = [conn.effectiveType, conn.type, conn.downlink ? conn.downlink + " Mbps" : "", conn.rtt ? conn.rtt + " ms" : ""].filter(Boolean);
    if (conn.saveData) cp.push("veri tasarrufu");
    if (cp.length) lines.push(["Bağlantı", cp.join(" · ")]);
  }
  if (c.storage) {
    lines.push(["Depolama", adminFmtBytes(c.storage.usageMb) + " / " + adminFmtBytes(c.storage.quotaMb)]);
  }
  var ch = c.clientHints || srv.client_hints;
  if (ch) {
    if (ch.model) lines.push(["Model (CH)", ch.model]);
    if (ch.platform_version || ch.platformVersion) lines.push(["Platform sürüm", ch.platform_version || ch.platformVersion]);
    if (ch.architecture) lines.push(["Mimari", ch.architecture]);
    if (ch.bitness) lines.push(["Bit", ch.bitness]);
    if (ch.uaFullVersion) lines.push(["Tarayıcı sürüm", ch.uaFullVersion]);
    if (ch.brands && typeof ch.brands === "string") lines.push(["CH markalar", ch.brands]);
  }
  if (c.webdriver) lines.push(["Bot şüphesi", "webdriver"]);
  if (c.doNotTrack === "1") lines.push(["Do Not Track", "açık"]);
  if (c.pdfViewer === false) lines.push(["PDF görüntüleyici", "kapalı"]);
  if (c.historyLength) lines.push(["Geçmiş derinliği", String(c.historyLength)]);
  if (c.visibility) lines.push(["Sekme durumu", c.visibility]);
  if (c.online === false) lines.push(["Durum", "offline"]);
  if (geo.isp) lines.push(["ISP", geo.isp]);
  if (geo.zip) lines.push(["Posta kodu (IP)", String(geo.zip)]);
  if (geo.timezone) lines.push(["IP saat dilimi", geo.timezone]);
  if (geo.lat != null && geo.lon != null) lines.push(["Koordinat (IP)", geo.lat + ", " + geo.lon]);
  if (c.geoPrecise) {
    lines.push(["GPS", c.geoPrecise.lat + ", " + c.geoPrecise.lon + (c.geoPrecise.acc ? " ±" + Math.round(c.geoPrecise.acc) + "m" : "")]);
  }
  if (c.fingerprint) {
    if (c.fingerprint.webglRenderer) lines.push(["GPU", c.fingerprint.webglRenderer]);
    if (c.fingerprint.webglVendor) lines.push(["GPU üretici", c.fingerprint.webglVendor]);
    if (c.fingerprint.canvasHash) lines.push(["Canvas iz", c.fingerprint.canvasHash]);
  }
  if (c.intlCalendar) lines.push(["Takvim", c.intlCalendar]);
  if (c.intlNumbering) lines.push(["Sayı sistemi", c.intlNumbering]);
  if (c.notificationPermission) lines.push(["Bildirim izni", c.notificationPermission]);
  if (c.speechVoices != null) lines.push(["Ses motoru", c.speechVoices + " adet"]);
  if (c.pageUrl) lines.push(["Sayfa URL", c.pageUrl]);
  if (srv.cf_country) lines.push(["CF ülke kodu", srv.cf_country]);
  if (geo.hosting) lines.push(["IP tipi", "Hosting / veri merkezi"]);
  if (geo.mobile) lines.push(["IP tipi", "Mobil operatör"]);
  var ref = v.referrer || c.referrer;
  if (ref) lines.push(["Referrer", ref]);
  if (v.path) lines.push(["İstek", v.path]);
  if (v.ua_raw) lines.push(["User-Agent", v.ua_raw]);
  return lines;
}

function renderAdminVisits(visits, totalCount) {
  var el = byId("admin-visits");
  var countEl = byId("visit-count");
  if (!el) return;
  var shown = visits.length;
  var total = totalCount != null ? totalCount : shown;
  if (countEl) countEl.textContent = total ? ("(" + shown + (shown !== total ? "/" + total : "") + ")") : "";
  if (!visits.length) {
    el.innerHTML = "<p class=\"visit-meta\">" + adminEsc(t("adminNoVisits")) + "</p>";
    return;
  }
  var rows = visits.map(function (v) {
    var ua = v.ua || {};
    var geo = v.geo || {};
    var c = v.client || {};
    var loc = [geo.city, geo.regionName, geo.country].filter(Boolean).join(", ") || "—";
    var mapLink = "";
    if (geo.lat != null && geo.lon != null) {
      mapLink = "<a class=\"visit-map-link\" href=\"https://www.google.com/maps?q=" + encodeURIComponent(geo.lat + "," + geo.lon) + "\" target=\"_blank\" rel=\"noopener\">📍 Harita</a>";
    }
    var badges = ["<span class=\"visit-badge\">" + adminEsc(v.event) + "</span>"];
    if (ua.device) badges.push("<span class=\"visit-badge\">" + adminEsc(ua.device) + "</span>");
    if (c.standalone) badges.push("<span class=\"visit-badge\">PWA</span>");
    if (geo.proxy) badges.push("<span class=\"visit-badge warn\">Proxy/VPN</span>");
    if (geo.hosting) badges.push("<span class=\"visit-badge warn\">DC</span>");
    if (geo.mobile) badges.push("<span class=\"visit-badge\">Mobil IP</span>");
    if (c.online === false) badges.push("<span class=\"visit-badge warn\">Offline</span>");
    if (c.webdriver) badges.push("<span class=\"visit-badge warn\">Bot</span>");
    if (v.visit_id) badges.push("<span class=\"visit-badge\">" + adminEsc(v.visit_id) + "</span>");
    var details = adminDetailLines(v).map(function (pair) {
      return "<div class=\"visit-detail-line\"><b>" + adminEsc(pair[0]) + ":</b> " + adminEsc(pair[1]) + "</div>";
    }).join("");
    return "<tr><td>" + adminEsc(new Date(v.at * 1000).toLocaleString(window.appLang === "en" ? "en-US" : "tr-TR")) +
      "<div class=\"visit-meta\">" + badges.join("") + "</div></td>" +
      "<td>" + adminEsc(v.ip) + "<div class=\"visit-meta\">" + adminEsc(loc) + "</div>" + mapLink + "</td>" +
      "<td>" + adminEsc(ua.browser || "?") + " / " + adminEsc(ua.os || "?") +
      "<div class=\"visit-meta\">" + adminEsc(ua.device || "") + "</div></td>" +
      "<td>" + (details || "<span class=\"visit-meta\">—</span>") + "</td></tr>";
  }).join("");
  el.innerHTML = "<div class=\"visit-table-wrap\"><table class=\"visit-table\"><thead><tr><th>Zaman</th><th>IP / Konum</th><th>Cihaz</th><th>Detay</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
}

var adminVisitsCache = [];
var adminLiveTimer = null;

function renderAdminStats(stats) {
  var el = byId("admin-stats");
  if (!el || !stats) return;
  el.innerHTML = [
    ["Bugün", stats.today],
    ["Bu hafta", stats.week],
    ["Toplam", stats.total],
    ["Benzersiz IP", stats.unique_ips],
    ["Oturum", stats.unique_sessions]
  ].map(function (pair) {
    return "<div class=\"admin-stat\"><span>" + pair[0] + "</span><b>" + pair[1] + "</b></div>";
  }).join("");
}

function filterAdminVisits() {
  var q = (byId("visit-filter") && byId("visit-filter").value || "").toLowerCase().trim();
  var ev = byId("visit-event-filter") && byId("visit-event-filter").value || "";
  var list = adminVisitsCache.filter(function (v) {
    if (ev && v.event !== ev) return false;
    if (!q) return true;
    var blob = [v.ip, v.visit_id, v.event, (v.ua && v.ua.browser), (v.geo && v.geo.city)].join(" ").toLowerCase();
    return blob.indexOf(q) !== -1;
  });
  renderAdminVisits(list, adminVisitsCache.length);
}

function exportAdminVisitsCsv() {
  var rows = adminVisitsCache;
  if (!rows.length) return;
  var cols = ["at", "event", "visit_id", "ip", "city", "country", "browser", "os", "device", "isp"];
  var lines = [cols.join(",")];
  rows.forEach(function (v) {
    var ua = v.ua || {};
    var geo = v.geo || {};
    var vals = [
      new Date(v.at * 1000).toISOString(),
      v.event,
      v.visit_id,
      v.ip,
      geo.city,
      geo.country,
      ua.browser,
      ua.os,
      ua.device,
      geo.isp
    ].map(function (x) { return "\"" + String(x || "").replace(/"/g, "\"\"") + "\""; });
    lines.push(vals.join(","));
  });
  var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ziyaretler-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function showVisitToast(msg) {
  var el = byId("admin-visit-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(function () { el.classList.add("hidden"); }, 8000);
}

function loadAdminVisitsData(notifyNew) {
  return Promise.all([
    fetch("/api/admin/visits", { credentials: "same-origin" }).then(function (r) { return r.json(); }),
    fetch("/api/admin/stats", { credentials: "same-origin" }).then(function (r) { return r.json(); }),
    fetch("/api/admin/suggestions", { credentials: "same-origin" }).then(function (r) { return r.json(); }),
    fetch("/api/admin/reports", { credentials: "same-origin" }).then(function (r) { return r.json(); }),
  ]).then(function (data) {
    var prevAt = adminVisitsCache.length ? adminVisitsCache[0].at : 0;
    adminVisitsCache = data[0];
    renderAdminStats(data[1]);
    renderAdminModeration(data[2], data[3]);
    filterAdminVisits();
    if (notifyNew && adminVisitsCache.length && adminVisitsCache[0].at > prevAt) {
      showVisitToast("Yeni ziyaret: " + adminVisitsCache[0].event + " · " + (adminVisitsCache[0].ip || ""));
    }
  });
}

function renderAdminModeration(suggestions, reports) {
  var sugEl = byId("admin-suggestions");
  var repEl = byId("admin-reports");
  if (sugEl) {
    sugEl.innerHTML = suggestions.length
      ? suggestions.map(function (s, i) {
        return '<li class="list-row"><button type="button" class="list-main" style="text-align:left">' +
          adminEsc(s.artist) + " — " + adminEsc(s.title) + '</button><button type="button" class="list-del" data-del-sug="' + i + '">×</button></li>';
      }).join("")
      : "<li>" + t("adminNoSuggestions") + "</li>";
    sugEl.querySelectorAll("[data-del-sug]").forEach(function (btn) {
      btn.onclick = function () {
        fetch("/api/admin/suggestions/" + btn.getAttribute("data-del-sug"), { method: "DELETE", credentials: "same-origin" })
          .then(function () { loadAdminVisitsData(false); });
      };
    });
  }
  if (repEl) {
    repEl.innerHTML = reports.length
      ? reports.map(function (r, i) {
        return '<li class="list-row"><button type="button" class="list-main" style="text-align:left">' +
          adminEsc(r.artist) + " — " + adminEsc(r.title) + " (" + adminEsc(r.youtube_id) + ')</button><button type="button" class="list-del" data-del-rep="' + i + '">×</button></li>';
      }).join("")
      : "<li>" + t("adminNoReports") + "</li>";
    repEl.querySelectorAll("[data-del-rep]").forEach(function (btn) {
      btn.onclick = function () {
        fetch("/api/admin/reports/" + btn.getAttribute("data-del-rep"), { method: "DELETE", credentials: "same-origin" })
          .then(function () { loadAdminVisitsData(false); });
      };
    });
  }
}

function checkAppVersion() {
  fetch("/api/version", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.version && d.version !== APP_BUILD_VERSION) {
      var b = byId("update-banner");
      if (!b) return;
      b.classList.remove("hidden");
      b.textContent = t("updateAvailable");
      b.style.cursor = "pointer";
      b.onclick = function () { location.reload(); };
    }
  }).catch(function () {});
}

function setupAdminVisits() {
  var wrap = byId("admin-visits-wrap");
  if (!wrap) return;
  fetch("/api/admin/status", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.ok) return;
    wrap.classList.remove("hidden");
    loadAdminVisitsData(false).catch(function () {});
  }).catch(function () {});

  var filterEl = byId("visit-filter");
  var eventEl = byId("visit-event-filter");
  if (filterEl) filterEl.addEventListener("input", filterAdminVisits);
  if (eventEl) eventEl.addEventListener("change", filterAdminVisits);

  var exportBtn = byId("visit-export-btn");
  if (exportBtn) exportBtn.addEventListener("click", exportAdminVisitsCsv);

  var liveEl = byId("visit-live");
  if (liveEl) {
    liveEl.addEventListener("change", function () {
      if (adminLiveTimer) clearInterval(adminLiveTimer);
      adminLiveTimer = null;
      if (liveEl.checked) {
        adminLiveTimer = setInterval(function () { loadAdminVisitsData(true).catch(function () {}); }, 30000);
      }
    });
  }

  var logoutBtn = byId("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (adminLiveTimer) clearInterval(adminLiveTimer);
      fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }).then(function () {
        wrap.classList.add("hidden");
      });
    });
  }
}

function collectFingerprint() {
  try {
    var fp = {};
    var canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 60;
    var ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("mk-fp", 2, 15);
      fp.canvasHash = canvas.toDataURL().slice(-48);
    }
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      var dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        fp.webglVendor = String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || "");
        fp.webglRenderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
      }
    }
    return fp;
  } catch (e) {
    return {};
  }
}

function collectClientMeta() {
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var orient = screen.orientation || {};
  var intl = Intl.DateTimeFormat().resolvedOptions();
  return {
    screen: screen.width + "x" + screen.height,
    screenAvail: screen.availWidth + "x" + screen.availHeight,
    colorDepth: screen.colorDepth || null,
    viewport: window.innerWidth + "x" + window.innerHeight,
    outerSize: window.outerWidth + "x" + window.outerHeight,
    dpr: window.devicePixelRatio || 1,
    orientation: orient.type || "",
    orientationAngle: typeof orient.angle === "number" ? orient.angle : null,
    lang: navigator.language,
    langs: (navigator.languages || []).join(", "),
    timezone: intl.timeZone,
    intlCalendar: intl.calendar || "",
    intlNumbering: intl.numberingSystem || "",
    platform: navigator.platform || "",
    touch: navigator.maxTouchPoints || 0,
    cores: navigator.hardwareConcurrency || null,
    memory: navigator.deviceMemory || null,
    connection: conn ? {
      type: conn.type,
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    } : null,
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    online: navigator.onLine,
    referrer: document.referrer || "",
    pageUrl: location.href,
    cookieEnabled: navigator.cookieEnabled,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: window.matchMedia("(prefers-contrast: more)").matches,
    vendor: navigator.vendor || "",
    webdriver: !!navigator.webdriver,
    doNotTrack: navigator.doNotTrack || "",
    pdfViewer: navigator.pdfViewerEnabled !== undefined ? !!navigator.pdfViewerEnabled : null,
    historyLength: window.history.length || null,
    visibility: document.visibilityState || "",
    notificationPermission: typeof Notification !== "undefined" ? Notification.permission : "",
    speechVoices: window.speechSynthesis ? speechSynthesis.getVoices().length : null,
    fingerprint: collectFingerprint()
  };
}

function setupTracking() {
  if (sessionStorage.getItem("mk_tracked")) return;
  sessionStorage.setItem("mk_tracked", "1");
  var payload = collectClientMeta();
  var jobs = [];
  if (navigator.storage && navigator.storage.estimate) {
    jobs.push(navigator.storage.estimate().then(function (est) {
      payload.storage = {
        quotaMb: est.quota ? Math.round(est.quota / 1048576) : null,
        usageMb: est.usage ? Math.round(est.usage / 1048576) : null
      };
    }).catch(function () {}));
  }
  if (navigator.userAgentData) {
    if (navigator.userAgentData.getHighEntropyValues) {
      jobs.push(navigator.userAgentData.getHighEntropyValues(
        ["platformVersion", "architecture", "model", "uaFullVersion", "bitness"]
      ).then(function (d) { payload.clientHints = d; }).catch(function () {}));
    } else {
      payload.clientHints = {
        mobile: navigator.userAgentData.mobile,
        platform: navigator.userAgentData.platform,
        brands: (navigator.userAgentData.brands || []).map(function (b) {
          return b.brand + "/" + b.version;
        }).join(", ")
      };
    }
  }
  if (navigator.permissions && navigator.geolocation) {
    jobs.push(navigator.permissions.query({ name: "geolocation" }).then(function (p) {
      if (p.state !== "granted") return;
      return new Promise(function (resolve) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          payload.geoPrecise = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: pos.coords.accuracy
          };
          resolve();
        }, function () { resolve(); }, { maximumAge: 600000, timeout: 4000 });
      });
    }).catch(function () {}));
  }
  Promise.all(jobs).finally(function () {
    fetch("/api/track", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function () {});
  });
}

function init() {
  window.appLang = readJson(STORAGE.uiLang, "tr");
  byId("ui-lang").value = window.appLang;
  var accent = readJson(STORAGE.accent, null);
  if (accent) { document.documentElement.style.setProperty("--primary", accent); byId("accent-picker").value = accent; }
  byId("auto-theme").checked = readJson(STORAGE.autoTheme, false);
  byId("reduced-motion").checked = readJson(STORAGE.reducedMotion, false);
  document.body.classList.toggle("reduced-motion", byId("reduced-motion").checked);
  byId("shake-enabled").checked = readJson(STORAGE.shakeEnabled, true);
  var qaInit = byId("queue-autoplay");
  if (qaInit) qaInit.checked = readJson(STORAGE.queueAutoplay, true);
  applyI18n();
  initTheme();
  bindEvents();
  setupTabs();
  setupSwipe();
  setupShake();
  setupInstall();
  setupVoice();
  setupOffline();
  setupTracking();
  setupAdminVisits();
  checkAppVersion();
  renderHelp();
  loadFilters().then(function () {
    renderMission();
    renderRecent();
    renderFavorites();
    renderQueue();
    renderStats();
    renderBadges();
    var params = new URLSearchParams(location.search);
    if (params.get("room")) { document.querySelector('[data-tab="room"]').click(); joinRoom(); }
    else if (params.get("v")) { loadSongFromUrl(params.get("v")); }
    if (window.openDaily) fetchDaily();
  });
}

function boot() {
  try {
    init();
    window.__mkReady = true;
  } catch (err) {
    console.error("MuzikKeşfet init error:", err);
    showLoader(false);
    byId("roulette-overlay").classList.add("hidden");
    toast("Arayüz yüklenemedi. Sayfayı yenile (Ctrl+Shift+R).", true);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
