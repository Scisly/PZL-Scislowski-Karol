# TaskFlow plan zaakceptowany

## Cel

Indywidualny projekt zaliczeniowy Karola Scisłowskiego: współpraca zespołów studenckich nad projektami, zadaniami i komentarzami. Frontend React/TypeScript/Vite, backend ASP.NET Core 10 i EF Core/Npgsql, PostgreSQL 18. Lokalny start i Docker Compose, bez hostingu publicznego.

Aktualizacja decyzji autora z 2026-11-21: repozytorium **publiczne** na koncie Karola (`Scisly`), https://github.com/Scisly/PZL-Scislowski-Karol. Zastępuje to pierwotne założenie prywatnego repozytorium. Publicznie dostępny jest kod aplikacji i opracowana dokumentacja; materiały prowadzącego i lokalne sekrety pozostają ignorowane.

## Zakres

Rejestracja i logowanie, projekty z przedmiotem i wymaganym terminem, członkostwo, zadania z opcjonalnym przypisaniem i terminem, Kanban bez przeciągania, lista i filtry, komentarze, archiwizacja/przywracanie oraz lista kont dla administratora. Interfejs polski, jasny i responsywny. Bez e-maili, załączników, czatu, SSO, realtime i transferu własności.

## Reguły

- Właściciel zawsze jest członkiem; członka dodaje się po e-mailu istniejącego konta.
- Członkowie współdzielą CRUD zadań. Tylko właściciel zmienia projekt i członkostwo.
- Każdy edytuje i usuwa własny komentarz; właściciel może usuwać inne komentarze.
- Administrator widzi konta, bez obejścia członkostwa w projektach.
- Termin zadania nie przekracza terminu projektu. Skrócenie projektu uwzględnia istniejące zadania.
- Przypisanie tylko członkowi. Nie można usunąć właściciela ani członka z przypisanymi zadaniami.
- Archiwum jest tylko do odczytu, poza przywróceniem i usunięciem przez właściciela.
- Usunięcie projektu kaskadowo usuwa zadania, komentarze i członkostwa.
- Ostrzeżenia o weekendzie, przeszłości i święcie nie blokują zapisu. Zapis nie wywołuje zewnętrznego API.

## Architektura

Domain bez zależności od EF/Identity. Api zawiera Identity, konfigurację EF, cienkie kontrolery i scoped usługi przez constructor injection. Bez ogólnego Repository. Typed klient świąt jest Adapterem. Dwa GET porównawcze Minimal API wykorzystują tę samą usługę co kontrolery.

Guid dla identyfikatorów, DateOnly dla terminów, UTC dla znaczników czasu. Ostatni poprawny zapis wygrywa; brak realtime jest jawnym ograniczeniem wersji 1.

## Zabezpieczenia

Identity cookie HttpOnly i CSRF dla Reacta, JWT 15 minut dla Swaggera/demo. Jawny wybór Bearer po nagłówku bez fallback do cookie przy błędnym tokenie. Wspólny sub użytkownika i role serwera. Rejestracja tylko Student; rola Admin wyłącznie bootstrap. Polityka CanCreateProjects, kontrola członkostwa w usługach. Niedostępny projekt 404; brak uprawnień właściciela 403. API 401/403 bez przekierowań. CSRF obejmuje login/register/logout i pozostałe mutacje cookie; token odświeżany po zmianie tożsamości.

## Integracja i błędy

Nager API v4: https://nagerholidays.com/api/v4/Holidays/PL/{year}. Typowane DTO i mapowanie nationalHoliday oraz holidayTypes=Public. Timeout 5 s, CancellationToken. Tryb Stub z deterministycznymi sukcesami i awariami. Problem Details z errorCode/traceId, 400/404/409/500 oraz 503/504 dla integracji. Structured logging Information/Warning/Error bez sekretów.

## Etapy i odbiór

1. Repozytorium, README, ignorowanie materiałów, plan i rejestr AI; minimum 5 logicznych commitów, 2 branche, PR/review/merge.
2. Solution, Domain, Api, 3+ encje, 2+ relacje, enumy, DTO, diagram.
3. PostgreSQL/EF, migracje i CRUD, 3 LINQ, AsNoTracking, async.
4. Minimum 2 operacje w usługach, reguły biznesowe, SRP/DIP i decyzja Repository.
5. Pełne API kontrolerów, dwa GET Minimal API, frontend lista i Kanban.
6. Identity, cookie/JWT, role, sub, policy, Swagger i testy 401/403.
7. Globalne błędy, Problem Details, logi i traceId.
8. Klient kalendarza, Adapter, Live/Stub i awarie.
9. Minimum 5 unit, 3 integration; izolowany PostgreSQL/Testcontainers, rzeczywisty test usługi oraz 3 przepływy Playwright.
10. Rzeczywisty baseline, 5 problemów/3 naprawy, Extract Method/Class, analiza statyczna, review i wyniki przed/po.
11. Dockerfile/Compose, migrator, bootstrap .env, CI quality gate i osobny udokumentowany failed-test branch z naprawą.
12. Finalne README, AI register, known issues, wkład autora, prezentacja i przećwiczone demo.

Testy powstają wraz z funkcjami. Źródła prowadzącego pozostają lokalnie. Nie fabrykujemy wcześniejszej historii, review ani wykonania sprawdzeń. Publiczne repozytorium można otworzyć bez zaproszenia; oddanie Moodle pozostaje czynnością autora.
