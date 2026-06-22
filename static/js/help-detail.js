/* global window */
window.HELP_DETAIL = {
  tr: [
    {
      title: "Keşif — yeni şarkı bul",
      intro: "YouTube'dan rastgele veya özel modlarla şarkı getirir. Hepsi Keşfet sekmesindeki butonlardan çalışır.",
      items: [
        { icon: "🎲", title: "Rastgele Öner", desc: "Filtrelerine uygun tek bir şarkı bulur, aşağıda YouTube oynatıcıda çalar.", where: "Keşfet → mor Rastgele Öner butonu", how: "İsteğe bağlı tür/dil/mod seç → Rastgele Öner'e tıkla", example: "Dil: Türkçe, Tür: Pop → rastgele Türk pop şarkısı" },
        { icon: "🔁", title: "Başka Öner", desc: "Aynı filtrelerle yeni bir şarkı getirir; önceki şarkıyı Geri Al ile dönebilirsin.", where: "Keşfet → şarkı geldikten sonra Başka Öner", how: "En az bir kez öneri aldıktan sonra butona bas", example: "Beğenmediysen hemen Başka Öner de" },
        { icon: "📈", title: "Trend", desc: "Günün popüler / trend aramalarına yakın sonuçlar getirir.", where: "Keşfet → Trend butonu", how: "Tek tık; filtreler yine uygulanır", example: "Trend + Rock → popüler rock videoları" },
        { icon: "💎", title: "Niche Keşif", desc: "Daha az bilinen, keşfedilmemiş tarzda şarkılar arar.", where: "Keşfet → Niche Keşif", how: "Tek tık", example: "Sık duymadığın sanatçılar çıkabilir" },
        { icon: "🎤", title: "Aynı Sanatçı", desc: "Şu an dinlediğin sanatçıdan başka bir parça önerir.", where: "Keşfet → Aynı Sanatçı (önce şarkı çalmalı)", how: "Bir şarkı dinlerken butona bas", example: "Frank Ocean dinliyorsan yine ondan bir parça" },
        { icon: "📅", title: "Günün Şarkısı", desc: "Bugün için sabit tek şarkı (her gün değişir, filtrelere göre).", where: "Keşfet → Günün Şarkısı", how: "Tek tık; arkadaşınla aynı gün aynı şarkıyı alırsınız", example: "Her sabah kontrol edebilirsin" },
        { icon: "📋", title: "Mini Playlist", desc: "5 şarkılık liste oluşturur; listeden tıklayarak dinlersin.", where: "Keşfet → Mini Playlist → altta açılan liste", how: "Butona bas, listeden şarkı seç", example: "Kısa dinleme seansı için ideal" },
        { icon: "⚔️", title: "A vs B", desc: "İki şarkıyı karşılaştırır; hangisini seçersen o kaydedilir.", where: "Keşfet → A vs B → iki kart", how: "Dinle, A Seç veya B Seç'e bas", example: "Hangisi daha iyi tartışması için" },
        { icon: "🎡", title: "Rulet", desc: "Dönen animasyon sonrası rastgele şarkı açar.", where: "Keşfet → Rulet", how: "Tek tık, kısa animasyon beklenir", example: "Eğlenceli rastgele seçim" },
        { icon: "❓", title: "Tahmin Oyunu", desc: "Şarkı adı gizli; 10 sn içinde sanatçıyı tahmin et.", where: "Keşfet → Tahmin Oyunu → açılan panel", how: "Oyunu başlat, dinle, sanatçı yaz, Tahmin Et", example: "Kör dinleme + oyun bir arada" }
      ]
    },
    {
      title: "Filtreler ve modlar",
      intro: "Keşfet sekmesinin üstündeki açılır menüler ve kutucuklar. Arama davranışını değiştirir.",
      items: [
        { icon: "🎸", title: "Tür / Dil / Mod / On yıl", desc: "YouTube arama sorgusunu daraltır.", where: "Keşfet → filtre satırı", how: "Açılır menüden seç; Rastgele Öner ile uygula", example: "Jazz + İngilizce + 1990" },
        { icon: "🎉", title: "Hazır mod (Parti / Çalışma / Gece)", desc: "Tek seçimle birden fazla filtreyi ayarlar.", where: "Keşfet → Hazır mod menüsü", how: "Parti, Çalışma veya Gece seç", example: "Gece → sakin gece müziği araması" },
        { icon: "⏩", title: "Oynatma hızı", desc: "Videoyu 0.75x, 1x veya 1.25x hızda oynatır (video izin vermeli).", where: "Keşfet → Oynatma hızı", how: "Hız seç → yeni/ mevcut video o hızda açılır", example: "Çalışma için 0.75x lo-fi" },
        { icon: "✅", title: "Sadece Official", desc: "Resmi kanal / 'official' içeriklere öncelik verir.", where: "Keşfet → kutucuk", how: "İşaretle, sonra öneri al", example: "Cover yerine orijinal klip" },
        { icon: "🕐", title: "Saate göre mod", desc: "Saate göre sakin / enerjik / odak modunu otomatik seçer.", where: "Keşfet → kutucuk", how: "Aç bırak; sabah sakin, öğlen enerjik", example: "09:00 → sakin, 15:00 → enerjik" },
        { icon: "👂", title: "Sadece dinlemediklerim", desc: "Daha önce önerilen şarkıları tekrar göstermez.", where: "Keşfet → kutucuk", how: "İşaretle; geçmiş localStorage'da tutulur", example: "Aynı şarkı tekrar gelmesin" },
        { icon: "♥", title: "Sadece favoriler", desc: "Sadece favori listendeki şarkılardan rastgele seçer (YouTube aramaz).", where: "Keşfet → kutucuk", how: "Önce favori ekle, sonra işaretle", example: "Kendi koleksiyonundan dinle" },
        { icon: "📻", title: "Radyo Modu", desc: "Şarkı bitince veya ~30 sn sonra otomatik yeni şarkı açar.", where: "Keşfet → kutucuk", how: "Aç, bir şarkı başlat, bekle", example: "Eller serbest dinleme" },
        { icon: "🙈", title: "Kör Dinleme", desc: "Sanatçı ve şarkı adını ??? yapar.", where: "Keşfet → kutucuk", how: "Aç → öneri al; isimler gizli", example: "Önyargısız dinleme" },
        { icon: "🎯", title: "Odak Modu", desc: "Sekmeler, filtreler ve listeleri gizler; sadece player kalır.", where: "Keşfet → kutucuk", how: "Aç → sade arayüz; kapatmak için kutucuğu kaldır", example: "Dikkat dağıtmadan dinle" }
      ]
    },
    {
      title: "Arama",
      intro: "Yazarak veya konuşarak filtre + arama sorgusu oluşturur.",
      items: [
        { icon: "⌨️", title: "Metin arama + Ara", desc: "Yazdığın cümleyi filtre ve YouTube sorgusuna çevirir.", where: "Keşfet → arama kutusu + Ara", how: "Örn. 'sakin türkçe pop' yaz → Ara", example: "'enerjik rock' → mod ve tür otomatik seçilir" },
        { icon: "🎙️", title: "Mikrofon", desc: "Sesini metne çevirip arama yapar.", where: "Keşfet → 🎤 Mikrofon", how: "Bas, konuş, izin ver; otomatik arar", example: "Chrome/Safari gerekir; Firefox sınırlı" },
        { icon: "🔍", title: "Gözat sekmesi", desc: "Türe göre YouTube sonuç listesi gösterir.", where: "Üst → Gözat sekmesi", how: "Sekmeye geç, isteğe bağlı ara kutusuna yaz", example: "Pop listesinden kart seç → çalar" }
      ]
    },
    {
      title: "Şarkı altı butonlar",
      intro: "Şarkı ekranda göründükten sonra player'ın altındaki aksiyonlar.",
      items: [
        { icon: "👍", title: "Beğen / Beğenme", desc: "Tercihini kaydeder; gelecek önerileri etkiler.", where: "Şarkı kartı → Beğen / Beğenme", how: "Tek tık", example: "Kısayol: L = beğen" },
        { icon: "♡", title: "Favorilere Ekle", desc: "Şarkıyı Favoriler listesine kaydeder.", where: "Şarkı kartı → Favorilere Ekle", how: "Tek tık; tekrar basınca çıkar", example: "Kısayol: F" },
        { icon: "➕", title: "Kuyruğa Ekle", desc: "Dinleme kuyruğuna ekler; alttaki Kuyruk listesinden aç.", where: "Şarkı kartı → Kuyruğa Ekle", how: "Tek tık", example: "Sonra dinlemek istediklerin" },
        { icon: "🚫", title: "Kanalı Engelle", desc: "O YouTube kanalı bir daha önerilmez.", where: "Şarkı kartı → Kanalı Engelle", how: "Tek tık", example: "İstenmeyen kanalları filtrele" },
        { icon: "⛔", title: "Bir Daha Gösterme", desc: "Bu şarkıyı tamamen gizler.", where: "Şarkı kartı → Bir Daha Gösterme", how: "Tek tık → yeni öneri gelir", example: "Asla duymak istemediklerin" },
        { icon: "⚠️", title: "Yanlış Video Bildir", desc: "Videoyu sunucuya kaydeder, şarkıyı gizler, yenisini getirir.", where: "Şarkı kartı → Yanlış Video Bildir", how: "Tek tık", example: "Yanlış eşleşme / alakasız video" },
        { icon: "🔗", title: "Paylaş / Kopyala / YouTube", desc: "Linki paylaşır, panoya kopyalar veya YouTube'da açar.", where: "Şarkı kartı → alt linkler", how: "İlgili butona tıkla", example: "Arkadaşına WhatsApp'tan at" }
      ]
    },
    {
      title: "Oda — birlikte dinle",
      intro: "Arkadaşlarınla aynı odaya girip ortak şarkı dinlersiniz.",
      items: [
        { icon: "🏠", title: "Oda Oluştur", desc: "6 haneli kod + QR + link üretir.", where: "Oda sekmesi → Oda Oluştur", how: "Bas → kodu arkadaşına gönder", example: "Kod: ABC123" },
        { icon: "🚪", title: "Odaya Katıl", desc: "Kodu yazarak mevcut odaya girersin.", where: "Oda sekmesi → kod kutusu + Katıl", how: "Kodu yaz → Katıl (büyük/küçük fark etmez)", example: "Link: site.com/?room=ABC123" },
        { icon: "🎵", title: "Oda İçin Seç", desc: "Odadaki herkesin dinleyeceği yeni şarkıyı seçersin.", where: "Oda sekmesi → Oda İçin Seç", how: "Odadayken bas; herkesin ekranı güncellenir", example: "DJ sensin" },
        { icon: "🗳️", title: "Devam / Geç oylama", desc: "Devam = şarkı kalsın; Geç = değiştirilsin. 2 Geç → yeni şarkı.", where: "Oda sekmesi → oylama butonları", how: "Herkes oy verir", example: "Grup kararıyla skip" }
      ]
    },
    {
      title: "Diğer sekmeler",
      intro: "İstatistik, ayarlar ve klavye kısayolları.",
      items: [
        { icon: "📊", title: "İstatistik", desc: "Keşif sayısı, beğeni, seri, pasaport, haftalık özet.", where: "İstatistik sekmesi", how: "Sekmeye geç; otomatik güncellenir", example: "Kaç şarkı keşfettiğini gör" },
        { icon: "😴", title: "Uyku zamanlayıcı", desc: "Süre dolunca oynatıcıyı durdurur.", where: "Daha Fazla sekmesi", how: "15/30/60 dk seç", example: "Uyumadan önce" },
        { icon: "💡", title: "Şarkı Öner", desc: "Admin paneline sanatçı+şarkı önerisi gönderir.", where: "Daha Fazla → Şarkı Öner", how: "Sanatçı ve şarkı yaz → Gönder", example: "Listeye eklenmesini istediğin parça" },
        { icon: "📲", title: "Uygulamayı Yükle (PWA)", desc: "Ana ekrana kısayol ekler.", where: "Daha Fazla → Uygulamayı Yükle", how: "Chrome'da çıkarsa bas; yoksa tarayıcı menüsünden 'Ana ekrana ekle'", example: "Uygulama gibi açılır" },
        { icon: "⌨️", title: "Klavye kısayolları", desc: "Hızlı kontrol (input dışındayken).", where: "Her yerde", how: "Space=yeni · F=favori · L=beğen · D=günün şarkısı", example: "Masaüstünde pratik" },
        { icon: "📱", title: "Mobil jestler", desc: "Dokunmatik ekstra kontroller.", where: "Telefon", how: "Sola kaydır=beğenme, sağa=beğen, salla=yeni şarkı", example: "iOS/Android" }
      ]
    }
  ],
  en: [
    {
      title: "Discovery — find songs",
      intro: "Pull songs from YouTube randomly or via special modes. All buttons live on the Discover tab.",
      items: [
        { icon: "🎲", title: "Random Pick", desc: "Finds one song matching filters and plays it in the YouTube player.", where: "Discover → purple Random Pick", how: "Optional filters → tap Random Pick", example: "Language TR + Pop → random Turkish pop" },
        { icon: "🔁", title: "Another", desc: "Same filters, different song. Use Undo to go back.", where: "Discover → Another (after first pick)", how: "Tap after a song is loaded", example: "Skip what you don't like" },
        { icon: "📈", title: "Trending", desc: "Popular / trending-style results.", where: "Discover → Trending", how: "Single tap", example: "Trending + Rock" },
        { icon: "💎", title: "Niche", desc: "Less mainstream discoveries.", where: "Discover → Niche", how: "Single tap", example: "Hidden gems" },
        { icon: "🎤", title: "Same Artist", desc: "Another track from the current artist.", where: "Discover → Same Artist", how: "Play a song first, then tap", example: "More from that artist" },
        { icon: "📅", title: "Daily Song", desc: "One fixed song per day (same for everyone that day).", where: "Discover → Daily Song", how: "Single tap", example: "Check back tomorrow" },
        { icon: "📋", title: "Mini Playlist", desc: "Builds a 5-song list; click to play.", where: "Discover → Mini Playlist", how: "Tap, then pick from list", example: "Short session" },
        { icon: "⚔️", title: "A vs B", desc: "Compare two songs; pick the winner.", where: "Discover → A vs B", how: "Listen, tap Pick A or B", example: "Which is better?" },
        { icon: "🎡", title: "Roulette", desc: "Spin animation then random pick.", where: "Discover → Roulette", how: "Single tap", example: "Fun randomizer" },
        { icon: "❓", title: "Guess Game", desc: "Artist hidden; guess in 10 seconds.", where: "Discover → Guess Game panel", how: "Start, listen, type artist, Guess", example: "Blind listen challenge" }
      ]
    },
    {
      title: "Filters & modes",
      intro: "Dropdowns and checkboxes at the top of Discover.",
      items: [
        { icon: "🎸", title: "Genre / Language / Mood / Decade", desc: "Narrows the YouTube query.", where: "Discover → filter row", how: "Select, then Random Pick", example: "Jazz + EN + 1990" },
        { icon: "🎉", title: "Preset mode", desc: "Party, Study, or Night presets.", where: "Discover → Preset mode", how: "Pick one preset", example: "Night → chill search" },
        { icon: "⏩", title: "Playback speed", desc: "0.75x, 1x, or 1.25x (if video allows).", where: "Discover → speed dropdown", how: "Select speed before or during play", example: "0.75x for study" },
        { icon: "✅", title: "Official only", desc: "Prioritizes official uploads.", where: "Discover → checkbox", how: "Check, then pick", example: "Original clips over covers" },
        { icon: "🕐", title: "Time-based mood", desc: "Auto mood by time of day.", where: "Discover → checkbox", how: "Leave on", example: "Morning calm, afternoon energetic" },
        { icon: "👂", title: "Only unheard", desc: "Skips previously recommended songs.", where: "Discover → checkbox", how: "Check on", example: "No repeats" },
        { icon: "♥", title: "Favorites only", desc: "Random from favorites list only.", where: "Discover → checkbox", how: "Add favorites first", example: "Your collection shuffle" },
        { icon: "📻", title: "Radio mode", desc: "Auto next song after ~30s or when ended.", where: "Discover → checkbox", how: "Enable, start a song", example: "Hands-free" },
        { icon: "🙈", title: "Blind listen", desc: "Hides title and artist.", where: "Discover → checkbox", how: "Enable before pick", example: "Unbiased listening" },
        { icon: "🎯", title: "Focus mode", desc: "Hides extra UI; player only.", where: "Discover → checkbox", how: "Toggle on/off", example: "Minimal view" }
      ]
    },
    {
      title: "Search",
      intro: "Type or speak to build filters and query.",
      items: [
        { icon: "⌨️", title: "Text search", desc: "Turns phrase into filters + YouTube query.", where: "Discover → search box + Search", how: "Type e.g. calm turkish pop → Search", example: "'energetic rock' sets mood + genre" },
        { icon: "🎙️", title: "Microphone", desc: "Voice to text search.", where: "Discover → Mic button", how: "Tap, speak, allow permission", example: "Chrome/Safari recommended" },
        { icon: "🔍", title: "Browse tab", desc: "Genre-based result grid.", where: "Browse tab", how: "Switch tab, optional search box", example: "Tap a card to play" }
      ]
    },
    {
      title: "Song action buttons",
      intro: "Under the player after a song loads.",
      items: [
        { icon: "👍", title: "Like / Dislike", desc: "Saves preference for future picks.", where: "Song card → Like / Dislike", how: "Single tap", example: "Shortcut: L = like" },
        { icon: "♡", title: "Add to favorites", desc: "Saves to Favorites list.", where: "Song card", how: "Tap to toggle", example: "Shortcut: F" },
        { icon: "➕", title: "Add to queue", desc: "Adds to Queue list below.", where: "Song card", how: "Single tap", example: "Listen later" },
        { icon: "🚫", title: "Block channel", desc: "Never recommend that channel.", where: "Song card", how: "Single tap", example: "Filter bad channels" },
        { icon: "⛔", title: "Never show", desc: "Permanently hide this song.", where: "Song card", how: "Tap → new pick", example: "Block one track" },
        { icon: "⚠️", title: "Report wrong video", desc: "Logs report, hides song, fetches new one.", where: "Song card", how: "Single tap", example: "Wrong match" },
        { icon: "🔗", title: "Share / Copy / YouTube", desc: "Share link or open on YouTube.", where: "Song card links", how: "Tap action", example: "Send to friends" }
      ]
    },
    {
      title: "Room — listen together",
      intro: "Shared listening session with friends.",
      items: [
        { icon: "🏠", title: "Create room", desc: "6-char code + QR + link.", where: "Room tab → Create Room", how: "Tap, share code", example: "Code ABC123" },
        { icon: "🚪", title: "Join room", desc: "Enter code to join.", where: "Room tab → code field + Join", how: "Type code → Join", example: "Link ?room=ABC123" },
        { icon: "🎵", title: "Pick for room", desc: "Sets song for everyone in room.", where: "Room tab", how: "Tap while in room", example: "You are the DJ" },
        { icon: "🗳️", title: "Keep / Skip votes", desc: "2 Skip votes trigger new pick.", where: "Room tab → vote buttons", how: "Everyone votes", example: "Group skip" }
      ]
    },
    {
      title: "Other tabs",
      intro: "Stats, settings, shortcuts.",
      items: [
        { icon: "📊", title: "Stats", desc: "Discoveries, likes, streak, passport.", where: "Stats tab", how: "Open tab", example: "Track habits" },
        { icon: "😴", title: "Sleep timer", desc: "Stops player when time is up.", where: "More tab", how: "Pick 15/30/60 min", example: "Before sleep" },
        { icon: "💡", title: "Suggest a song", desc: "Sends suggestion to admin.", where: "More tab", how: "Artist + title → Send", example: "Request a track" },
        { icon: "📲", title: "Install app (PWA)", desc: "Add to home screen.", where: "More tab", how: "Install button or browser menu", example: "App-like launch" },
        { icon: "⌨️", title: "Keyboard shortcuts", desc: "When not typing in inputs.", where: "Anywhere", how: "Space/F/L/D", example: "Desktop power users" },
        { icon: "📱", title: "Mobile gestures", desc: "Swipe and shake.", where: "Phone", how: "Swipe L/R, shake for new", example: "Touch controls" }
      ]
    }
  ]
};
