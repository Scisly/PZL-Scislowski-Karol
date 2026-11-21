# Mapa wymagań 12 tematów

Mapa wskazuje kod, dokumentację i pull requesty związane z zadaniami prowadzącego. Wyniki uruchomień i odnośniki CI są w [raporcie weryfikacji](VERIFICATION.md).

| Temat | Dowód i sposób sprawdzenia | PR |
| --- | --- | --- |
| 1. Git | `main`, gałęzie `feature/`, historia commitów, scalenia i jawnie oznaczone review AI. Historia lokalna: `git log --graph --all`. | [#1](https://github.com/Scisly/PZL-Scislowski-Karol/pull/1) |
| 2. Model | `Project`, `TaskItem`, `Comment` i `ProjectMember` w Domain, `ApplicationUser` w Api. Relacje i diagram opisano w [modelu domenowym](DOMAIN.md). | [#2](https://github.com/Scisly/PZL-Scislowski-Karol/pull/2) |
| 3. EF Core | `AppDbContext`, Npgsql i migracja `InitialCreate`. Test integracyjny odtwarza bazę PostgreSQL, po czym sprawdza CRUD. Przykłady LINQ poniżej. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3) |
| 4. Usługi i DI | Usługi z interfejsami, wstrzykiwanie przez konstruktor i lifetime `Scoped`. Wydzielenie listy kont, odczytu bieżącego użytkownika i wylogowania opisano poniżej. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3), [#4](https://github.com/Scisly/PZL-Scislowski-Karol/pull/4) |
| 5. API | CRUD w kontrolerach i dwa porównawcze odczyty Minimal API. [Porównanie](API.md#kontroler-i-minimal-api) wskazuje różnice i wspólną usługę. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3) |
| 6. Uwierzytelnianie i autoryzacja | Swagger, Identity z cookie i CSRF, JWT, role Student i Admin, identyfikator `sub` oraz polityka `CanCreateProjects`. Testy weryfikują 401, 403 i izolację projektów. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3) |
| 7. Błędy i logi | Globalny handler, 400/404/409/500 i korelacja nagłówka z logami. [Przykład Problem Details](API.md#przykładowy-problem-details-i-diagnostyka) oraz instrukcja diagnostyki. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3), [#4](https://github.com/Scisly/PZL-Scislowski-Karol/pull/4) |
| 8. Integracja | Typowany adapter Nager, osobne DTO, timeout, anulowanie i Stub. [Tabela scenariuszy](API.md#sprawdzone-scenariusze-doradcy-terminu) wskazuje testy oraz wynik próby Live. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3), [#4](https://github.com/Scisly/PZL-Scislowski-Karol/pull/4) |
| 9. Testy | xUnit z fake klientem i zegarem, WebApplicationFactory i Testcontainers z osobną bazą, Playwright. Pełne sprawdzenie: `node scripts/verify.mjs --e2e`. | [#3](https://github.com/Scisly/PZL-Scislowski-Karol/pull/3), [#6](https://github.com/Scisly/PZL-Scislowski-Karol/pull/6) |
| 10. Jakość | Baseline, pięć problemów, trzy naprawy, Extract Class, analiza statyczna i wyniki przed i po. [Raport jakości](QUALITY.md) zawiera kartę porównawczą. | [#4](https://github.com/Scisly/PZL-Scislowski-Karol/pull/4) |
| 11. Docker i CI | Wieloetapowy Dockerfile, Compose z migratorem, GitHub Actions. [Dowód quality gate](CI_QUALITY_GATE.md) pokazuje kontrolowane niepowodzenie i wynik po naprawie. | [#6](https://github.com/Scisly/PZL-Scislowski-Karol/pull/6), [#7](https://github.com/Scisly/PZL-Scislowski-Karol/pull/7) |
| 12. Obrona i oddanie | Prezentacja PPTX i PDF, scenariusz demo, pytania do obrony, rejestr AI, znane ograniczenia i wkład autora. [Materiały do Moodle](SUBMISSION.md) zawierają listę plików i czynności autora. | [#8](https://github.com/Scisly/PZL-Scislowski-Karol/pull/8) |

## Trzy zapytania LINQ i tracking

1. ProjectService.ListAsync: tylko dostępne projekty, sortowanie i agregaty postępu w projekcji.
2. TaskService.ListAsync: członkostwo, projectId/status/assignedUserId oraz projekcja DTO.
3. CommentService.ListAsync: dostęp do zadania, sortowanie komentarzy i projekcja autora.

Odczyty używają AsNoTracking. Zapis korzysta z tracked encji i SaveChangesAsync. Queryable jest materializowany asynchronicznie po filtrowaniu. Migracje są przechowywane razem z modelem.

## Wydzielenie operacji, SRP i DIP

| Operacja | Przed wydzieleniem | Po wydzieleniu |
| --- | --- | --- |
| Lista kont administratora | `AdminUsersController.Get` sam pobierał konta i role oraz tworzył DTO. | `IUserDirectoryService.ListAsync` pobiera konta i role. Kontroler składa odpowiedź HTTP. |
| Odczyt bieżącego użytkownika | `AuthController.Me` odczytywał konto i prosił usługę o przygotowanie DTO. | `AuthService.GetCurrentUserAsync` odczytuje identyfikator przez `ICurrentUser`, pobiera konto i zwraca DTO. |
| Wylogowanie | `AuthController.Logout` bezpośrednio wywoływał `SignInManager`. | `AuthService.LogoutAsync` zamyka sesję, a kontroler zwraca status 204. |

Przed zmianami źródła były w commitach `7b9f49d` (lista kont) i `2ecb924` (konto i sesja). Wydzielenie listy widać w commicie `f1fe90c`, a odczytu konta i wylogowania w `5c16d21`. Aktualny kod jest w [UserDirectoryService](../src/TaskFlow.Api/Services/UserDirectoryService.cs), [AuthService](../src/TaskFlow.Api/Auth/AuthServices.cs) i [AuthController](../src/TaskFlow.Api/Controllers/AuthController.cs).

Kontroler obsługuje HTTP, usługa wykonuje przypadek użycia, a `DomainRules` sprawdza reguły biznesowe. Kontrolery zadań i projektów otrzymują interfejsy usług, a `DeadlineAdvisor` otrzymuje `IHolidayClient`. Adapter oddziela DTO Nager od wewnętrznego `PublicHoliday`. Usługi mają zakres żądania HTTP, zgodny z cyklem życia `DbContext`. Operacje bazy korzystają bezpośrednio z EF Core, ponieważ dodatkowe ogólne Repository dublowałoby jego interfejs.

## Historia i autorstwo

Historia rejestruje rzeczywistą pracę bieżącej implementacji; części backendu rozwijano wspólnie dla spójnego kontraktu, więc jeden PR może obejmować kilka tematów. Nie rekonstruowano fikcyjnej wcześniejszej historii ani nie pogarszano kodu na potrzeby refaktoryzacji. Przeglądy AI są tak oznaczane; finalny obowiązek rozumienia i oddania należy do autora.
