# Reliqua - aplikacja webowa „Kapsuła czasu"

Reliqua to aplikacja internetowa do tworzenia i współdzielenia cyfrowych kapsuł
czasu — zaszyfrowanych kontenerów na wiadomości i pliki, udostępnianych dopiero
po spełnieniu warunków otwarcia (data oraz opcjonalne hasło). Aplikacja powstała
jako praca inżynierska (PJATK).

**Wdrożona aplikacja:** `https://reliqua-xi.vercel.app/`

## Stos technologiczny

- **Next.js 16** (App Router, React Server Components, Server Actions), **React 19**, **TypeScript**
- **Supabase** — PostgreSQL (z politykami RLS i funkcjami składowanymi), Auth, Storage
- **Tailwind CSS 4**, **Leaflet** (mapa wspomnień), **lucide-react**
- Szyfrowanie treści i plików **AES-256-GCM**, hasła kapsuł haszowane **bcrypt**
- Hosting: **Vercel** (z zadaniem cron); testy: **Vitest**

## Uruchomienie lokalne

Wymagania: Node.js oraz projekt Supabase.

```bash
npm install
# plik .env.local
npm run dev
```

Aplikacja działa pod `https://reliqua-xi.vercel.app/`.

### Zmienne środowiskowe (`.env.local`)


## Wdrożenie (Vercel)

1. Połącz repozytorium GitHub z projektem na Vercel.
2. Ustaw w projekcie zmienne środowiskowe.
3. Każde wypchnięcie do gałęzi produkcyjnej buduje i publikuje nową wersję.
4. Zadanie cykliczne jest zdefiniowane w `vercel.json` (codzienne wywołanie
   trasy `/api/cron`, autoryzowane nagłówkiem zgodnym z `CRON_SECRET`).
   W planie Hobby cron działa najwyżej raz na dobę.

## Testy

```bash
npm test          # testy jednostkowe modułów logiki (katalog lib/)
npm run test:int  # testy integracyjne polityk RLS (wymagają .env.test)
```

Testy integracyjne uruchamiane są na osobnym, testowym projekcie Supabase.
Plik `.env.test` zawiera `SUPABASE_URL`, `SUPABASE_ANON_KEY` oraz
`SERVICE_ROLE_KEY` projektu testowego (NIE produkcyjnego).