# Notatki do prezentacji TaskFlow

## 1. TaskFlow

Autor: Karol Scisłowski. Cel prezentacji: wyjaśnić działanie, decyzje i granice aplikacji oraz przygotować demonstrację. Repozytorium publiczne: https://github.com/Scisly/PZL-Scislowski-Karol. AI pomagało w implementacji, testach i dokumentacji. Szczegóły ujawnia docs/AI_REGISTER.md.

## 2. Cel i zakres

TaskFlow odpowiada na potrzebę współpracy studenckiego zespołu nad projektem zaliczeniowym. Zakres wersji 1 obejmuje CRUD, członkostwo i kontrolę dostępu. Nie obejmuje czatu, e-maili, załączników ani realtime. Źródła: docs/PLAN.md, docs/DOMAIN.md, web/src/pages.

## 3. Architektura aplikacji

Frontend komunikuje się przez JSON API. Kontrolery i porównawcze GET Minimal API wywołują te same usługi. API korzysta z EF Core 10 i Npgsql. Domain zawiera encje i DomainRules bez zależności od EF/Identity. Constructor injection przekazuje scoped usługi i AppDbContext. Nie ma ogólnego Repository, ponieważ DbContext już zapewnia śledzenie zmian i jednostkę pracy. Źródła: TaskFlow.slnx, src/TaskFlow.Api/Program.cs, src/TaskFlow.Api/Services, src/TaskFlow.Domain.

## 4. Model domenowy i baza

Project ma wiele TaskItem, TaskItem wiele Comment. ProjectMember łączy Project i ApplicationUser przez złożony klucz ProjectId/UserId. Właściciel jest zawsze członkiem. Osobne klucze obce opisują właściciela, autora i przypisanie. EF mapuje indeks ProjectId/Status oraz TaskId/CreatedAt. Usunięcie projektu kaskadowo usuwa zadania, komentarze i członkostwa. Konto Identity pozostaje poza Domain. Źródła: docs/DOMAIN.md, src/TaskFlow.Domain/Entities.cs, src/TaskFlow.Api/Data/AppDbContext.cs.

## 5. Odczyt i zapis danych

W TaskService Accessible ogranicza dane do projektów użytkownika. ListAsync dodaje filtry projectId, status i assignedUserId. Select tworzy TaskDto, a AsNoTracking ogranicza koszt odczytu. Mutacje ładują encje śledzone przez scoped DbContext. Guid identyfikuje zasób, DateOnly opisuje termin, UTC zapisuje czas zdarzenia. Ostatni poprawny zapis wygrywa, bez tokenu wersji dla równoczesnej edycji. Źródła: src/TaskFlow.Api/Services/TaskService.cs, src/TaskFlow.Api/Data/AppDbContext.cs, docs/PLAN.md.

## 6. Kontrakt API

Pełny kontrakt zawiera auth, projekty, członkostwo, zadania, komentarze, listę kont Admin, porady terminów i healthcheck. Kontrolery zapewniają pełny CRUD. Dwa porównawcze GET Minimal API obsługują listę i szczegół zadania przez tę samą usługę. JSON używa camelCase, enumów tekstowych i dat yyyy-MM-dd. Nie serializujemy encji EF bezpośrednio. Źródła: docs/API.md, src/TaskFlow.Api/Controllers, src/TaskFlow.Api/Program.cs.

## 7. Tożsamość i uprawnienia

Cookie automatycznie trafia z przeglądarki do serwera, dlatego mutacje wymagają X-CSRF-TOKEN, także login i register. Bearer jest jawnie wybranym schematem bez fallback do cookie przy błędnym JWT. Role ustala serwer. Rejestracja tworzy Student, Admin tylko bootstrap demo. Obcy zasób daje 404, członek bez praw właściciela 403, brak sesji 401. Źródła: src/TaskFlow.Api/Program.cs, src/TaskFlow.Api/Auth/AuthServices.cs, src/TaskFlow.Api/Controllers/AuthController.cs, docs/API.md.

## 8. Reguły biznesowe

Właściciel zmienia projekt i członkostwo, członkowie współdzielą CRUD zadań. Nie można usunąć właściciela ani osoby z przypisanymi zadaniami. Autor edytuje własny komentarz, właściciel może usunąć komentarz innej osoby. Skrócenie projektu uwzględnia istniejące zadania. Źródła: src/TaskFlow.Domain/DomainRules.cs, src/TaskFlow.Api/Services/ProjectService.cs, TaskService.cs, CommentService.cs.

## 9. Błędy i logowanie

GlobalExceptionHandler mapuje DomainException na 409, błędne HTTP na 400, nieoczekiwane błędy na 500 z bezpiecznym komunikatem. ApiProblems dodaje errorCode i traceId. Logi używają strukturalnych pól i nie zapisują haseł, cookie ani JWT. Przerwanie żądania przez klienta nie jest sztucznie raportowane jako 500. Źródła: src/TaskFlow.Api/Infrastructure/ApiErrors.cs, src/TaskFlow.Api/Program.cs.

## 10. Integracja i asynchroniczność

Porady terminów są osobnym GET /api/deadline-advice. Usługa ostrzega o przeszłości, weekendzie i święcie. CRUD nie wywołuje zewnętrznego API. Typed HttpClient korzysta z https://nagerholidays.com/api/v4/ oraz Holidays/PL/{year}. Adapter mapuje odpowiedź na własny PublicHoliday i filtruje święta ogólnokrajowe typu Public. async/await uwalnia wątek podczas I/O, CancellationToken propaguje anulowanie. Źródła: src/TaskFlow.Api/Integrations/NagerHolidayClient.cs, Holidays.cs, HolidayStubHandler.cs, Program.cs.

## 11. Testy i jakość

Testy unit korzystają z xUnit, frontend z Vitest i Testing Library. Integracyjne sprawdzają rzeczywistą bazę PostgreSQL oraz warstwę HTTP. Playwright działa przeciw aplikacji Compose. Kontrole jakości obejmują build .NET, analizatory, TypeScript, ESLint, testy i build frontendu. Liczby i statusy należy podawać wyłącznie z aktualnego raportu dla konkretnego commita. Prezentacja nie zastępuje wyniku uruchomienia. Źródła: tests/TaskFlow.UnitTests, tests/TaskFlow.IntegrationTests, web/package.json, scripts/verify.mjs, .github/workflows/ci.yml, docs/VERIFICATION.md.

## 12. Docker i ciągła integracja

Compose uruchamia PostgreSQL 18, jednorazową usługę migrate i app na 127.0.0.1:8080. Aplikacja czeka na udaną migrację i zdrową bazę. setup generuje losowe lokalne sekrety w ignorowanym .env. CI ma oddzielne joby backend i frontend, a następnie Compose, smoke i Playwright. Raporty testów i logi stanowią artefakty workflow. Źródła: Dockerfile, compose.yaml, scripts/setup.mjs, scripts/verify.mjs, .github/workflows/ci.yml.

## 13. AI, odpowiedzialność i granice

Projekt jest indywidualną pracą Karola Scisłowskiego ze znaczącym wsparciem Codex. Nie należy przedstawiać go jako kodu w całości napisanego bez AI. Rejestr opisuje faktyczne użycie oraz sposób weryfikacji. Zakres dotyczy lokalnego uruchomienia. Demo bootstrap i konfigurację HTTP należy zmienić przed wdrożeniem publicznym. Źródła: docs/AI_REGISTER.md, docs/PLAN.md, docs/API.md, docs/KNOWN_ISSUES.md.

## 14. Demonstracja i repozytorium

Scenariusz 7 minut znajduje się w docs/DEMO.md, pytania do obrony w docs/DEFENSE.md, lista oddania w docs/SUBMISSION.md. Repozytorium jest publiczne. Hasła odczytujemy wyłącznie lokalnie przez node scripts/setup.mjs --show-credentials i nie pokazujemy ich na ekranie. Końcowy wynik CI należy sprawdzić na main dla aktualnego commita. Wysłanie w Moodle i przećwiczenie prezentacji pozostają czynnościami autora.
