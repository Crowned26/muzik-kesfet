# Müzik Keşfet

YouTube üzerinde müzik keşfi, günlük öneriler ve paylaşılabilir dinleme odaları
sunan Flask uygulaması.

## Yerelde çalıştırma

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="yerel-uzun-rastgele-deger"
export ADMIN_PASSWORD="guclu-admin-parolasi"
export APP_PASSWORD="site-erisim-parolasi"
python app.py
```

`APP_PASSWORD` boş bırakılırsa site herkese açıktır. `ADMIN_PASSWORD` boş ise
admin girişi devre dışıdır; varsayılan admin parolası yoktur.

## Render

`render.yaml`, gerekli gizli değerleri Render üzerinde üretir. Yayına almadan
önce Render panelinden `APP_PASSWORD` ve `ADMIN_PASSWORD` değerlerini güvenli
bir parola yöneticisine kaydedin. Bu değerleri repoya veya istemci koduna
eklemeyin.

Uygulama öneri ve raporları yerel JSON dosyalarında tutar. Kalıcı kullanıcı
verisi gerektiren bir sürüm için yönetilen veritabanına geçilmelidir.
