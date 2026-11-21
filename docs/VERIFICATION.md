# Raport rzeczywistej weryfikacji

Data: 21 listopada 2026 r. Wyniki dotyczą wykonanych poleceń i wskazanych wersji. Lokalne raporty robocze są w ignorowanym `artifacts` oraz `web/test-results`.

Pełne lokalne polecenie `node scripts/verify.mjs --e2e` zakończyło się kodem 0: restore, build, analizatory, 28 testów jednostkowych, 12 integracyjnych, frontend (wówczas 19 testów), budowa i start Compose, smoke oraz 4 przepływy Playwright. Log: lokalny `artifacts/final-verify.log`. Następna poprawka wylogowania rozszerzyła zestaw frontendu do 21 testów; jej osobne sprawdzenie opisano poniżej.

## Backend

- SDK .NET 10.0.404, nullable i analizatory włączone, warnings-as-errors.
- `dotnet test TaskFlow.slnx --configuration Release --no-restore --nologo --logger trx --results-directory artifacts/final-backend`: **28 testów jednostkowych i 12 integracyjnych, wszystkie przechodzą**, bez pominięć i ostrzeżeń kompilacji.
- Każdy zestaw integracyjny uruchamia PostgreSQL 18 w Testcontainers, stosuje migrację i przygotowuje kontrolowane dane. Nie wykorzystuje bazy demonstracyjnej ani zewnętrznego API.
- Potwierdzono cookie/CSRF, prawdziwy JWT, odrzucenie błędnego Bearera mimo poprawnego cookie, role, 401/403/404, CRUD i filtry, przypisania, archiwum, komentarze, reguły terminów, Problem Details 500 i korelację traceId.
- `dotnet format src/TaskFlow.Api/TaskFlow.Api.csproj --verify-no-changes --no-restore`: kod 0. Kontrola podatnych pakietów wraz z transytywnymi: 0 wykrytych podatności w sprawdzonych źródłach.

## Frontend i przeglądarka

Wykonano npm ci, lint, typecheck, format:check i build. **21 testów Vitest przechodzi**. Kontrola zależności npm ci nie wykazała podatności. Strict UI audit: 0 usterek. DESIGN lint: 0 błędów; nieblokujące ostrzeżenia dotyczą tokenów opisanych wyłącznie w dokumentacji.

Potwierdzono **4 rzeczywiste przepływy Playwright** zarówno na Vite 5173/API 5080, jak i na końcowym Dockerze 8080: konto i sesja, współpraca CRUD, uprawnienia/archiwum/admin oraz odnowienie wygasłej sesji z zachowaniem formularza. Test wygaśnięcia usuwa tylko cookie TaskFlow.Session, pozostawiając CSRF. Sprawdzono 390 px, szerokość dokumentu, klawiaturę i pozycję Select oraz błędy konsoli. Testy sprzątają wyłącznie własne projekty.

Przegląd wykrył nieobsłużone 401 przy zakończeniu wygasłej sesji i pomijanie ochrony szkiców komentarzy. Po obserwacji niepowodzeń dodano poprawki oraz regresje. Końcowe 21 testów i 4 przepływy obejmują również zakończenie wygasłej sesji, ochronę szkiców i czyszczenie sesji bez ponownego pobierania danych chronionych lub przywrócenia starego konta.

## Docker i integracja Live

- Wieloetapowy obraz zbudowany lokalnie; Compose uruchomił PostgreSQL, migrator zakończony kodem 0 i zdrową aplikację.
- Smoke: `/api/health` → 200, `/api/health/ready` → 200, `/` → 200 z HTML Reacta, anonimowe `/api/projects` → 401, nieznane `/api/*` → 404.
- Uruchomiono także lokalny backend na porcie 5080 z osobnym projektem Compose `taskflow-dev` i PostgreSQL na porcie 55432.
- W kontenerze tymczasowo ustawiono `HolidayApi__Mode=Live`. Rzeczywiste żądanie doradcy dla 2027-01-01 zwróciło 200 oraz ostrzeżenie `public_holiday`. Po sprawdzeniu przywrócono domyślny Stub. Sekrety nie zostały wypisane.

## GitHub Actions

Pierwszy kompletny zielony przebieg, commit `20b8e8d5ee7aee1abe9229faafce24d2bf08d902`: [run 44892073424](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44892073424).

**Wersja po pierwszej poprawce synchronizacji:** commit `ed9a064bfbceb3542f6e35fc5061ddabe1848fe5`, [zielony run 44893286709](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893286709). Wszystkie trzy joby przeszły: backend, frontend i compose, z budową obrazu, migracjami, smoke i Playwright. Kod scalono do main przez [PR #6](https://github.com/Scisly/PZL-Scislowski-Karol/pull/6).

**Kontrolowany failed test:** [czerwony run 44892834616](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44892834616) i [zielony run po usunięciu fixture 44893292275](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893292275). Izolowany PR #7 zamknięto bez scalenia. Szczegóły i osobny rzeczywisty błąd synchronizacji E2E: [CI_QUALITY_GATE.md](CI_QUALITY_GATE.md).

Późniejszy [run main 44893653696](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893653696) wykrył niezależną nawigację testu przed zakończeniem wylogowania. Jego wynik jest nieudany, mimo wcześniejszego sukcesu PR i lokalnego pełnego skryptu. Przyczynę oraz poprawkę synchronizacji opisuje CI_QUALITY_GATE.md.

**Końcowa poprawka sesji:** commit `c6723f97af2639030cbc43bedeed4ba0c378bf90`. Dwie regresje najpierw wykazały problem, a potem przeszły. Po zmianie wykonano typecheck, ESLint bez ostrzeżeń, 21 testów Vitest, build, przebudowę obrazu Compose, 5 smoke checks i wszystkie 4 przepływy Playwright (16,3 s). Osobny przegląd AI nie pozostawił uwag P1/P2. Aktualny wynik końcowej gałęzi należy sprawdzić w [GitHub Actions](https://github.com/Scisly/PZL-Scislowski-Karol/actions), dla wskazanego commita; ten raport nie przewiduje wyniku kolejnego uruchomienia.

## Materiały do obrony

PPTX ma 14 slajdów, edytowalne teksty i diagramy; przeszedł finalizer struktury/layoutu oraz ponowny import. Wszystkie 14 slajdów i 14 stron PDF obejrzano po renderowaniu. PDF jest wierną kopią slajdów jako obrazy; edytowalnym źródłem pozostaje PPTX. Nie sprawdzano w zainstalowanym PowerPoint.

## Zakres czynności autora

Repozytorium jest publiczne na Scisly, z branchami `feature/` zgodnie z późniejszymi decyzjami autora. Wysłanie pracy do Moodle i samodzielne przećwiczenie obrony należą do autora.
