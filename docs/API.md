# Kontrakt API TaskFlow

Kontrakt wspólny dla implementacji backendu i frontendu. JSON camelCase, enumy jako tekst dokładnie `Todo`, `InProgress`, `Done` oraz `Low`, `Normal`, `High`. Identyfikatory Guid jako string. Daty terminów `yyyy-MM-dd`, znaczniki czasu ISO8601 UTC. Listy jako tablice JSON (wersja1 bez paginacji). Opisy i przypisania mogą być null.

## Typy odpowiedzi

```typescript
type User = { id: string; displayName: string; email: string; roles: string[] };
type Project = {
  id: string; name: string; courseName: string; description: string | null;
  deadline: string; isArchived: boolean; ownerId: string; createdAt: string;
  memberCount: number; taskCount: number; completedTaskCount: number;
};
type Member = { userId: string; displayName: string; email: string; isOwner: boolean };
type TaskItem = {
  id: string; projectId: string; projectName: string; title: string;
  description: string | null; status: 'Todo' | 'InProgress' | 'Done';
  priority: 'Low' | 'Normal' | 'High'; dueDate: string | null;
  assignedUserId: string | null; assignedUserName: string | null;
  createdAt: string; updatedAt: string;
};
type Comment = {
  id: string; taskId: string; authorId: string; authorName: string;
  content: string; createdAt: string; updatedAt: string;
};
type DeadlineAdvice = { date: string; warnings: { code: string; message: string }[] };
```

## Konta i sesja

- GET `/api/auth/csrf` → 200 `{token:string}`, sets antiforgery cookie. Mutacje cookie/anonimowe login i register przesyłają `X-CSRF-TOKEN` oraz credentials.
- POST `/api/auth/register` `{displayName,email,password}` → 201 User i zalogowana sesja cookie.
- POST `/api/auth/login` `{email,password}` → 200 User i cookie. Złe dane →401.
- GET `/api/auth/me` →200 User albo401.
- POST `/api/auth/logout` →204. CSRF wymagany.
- POST `/api/auth/token` `{email,password}` →200 `{accessToken,expiresAt}`. Wyłącznie Demo:Enabled, bez tworzenia cookie i bez CSRF (klient nieprzeglądarkowy), JWT ważny15min.

Po register/login/logout frontend odrzuca poprzedni token CSRF i pobiera nowy. API nigdy nie przekierowuje na HTML. Nagłówek Bearer wybiera JWT i wyłącza fallback do cookie; inaczej działa Identity cookie. CSRF jest wymagany dla mutacji uwierzytelnianych cookie oraz login/register, nie dla poprawnego Bearera. Role tylko serwerowe. `sub` jest identyfikatorem użytkownika w obu schematach.

## Projekty

- GET `/api/projects` →Project[] dostępne według członkostwa.
- POST `/api/projects` `{name,courseName,description,deadline}` →201 Project (policy CanCreateProjects).
- GET `/api/projects/{id}` →Project.
- PUT `/api/projects/{id}` `{name,courseName,description,deadline}` →Project; tylko właściciel, projekt aktywny; skrócenie daty uwzględnia zadania.
- DELETE `/api/projects/{id}` →204, właściciel, także archiwum.
- POST `/api/projects/{id}/archive` oraz `/restore` bez body →200 Project, właściciel.
- GET `/api/projects/{id}/members` →Member[].
- POST `/api/projects/{id}/members` `{email}` →201 Member, właściciel; istniejące konto, brak duplikatu.
- DELETE `/api/projects/{id}/members/{userId}` →204, właściciel; nie właściciel i bez przypisań.

## Zadania

- GET `/api/tasks?projectId=&status=&assignedUserId=` →TaskItem[]. Każdy filtr opcjonalny, zawsze ograniczenie członkostwa. Nieznany enum →400. Podany niedostępny projectId →404.
- GET `/api/tasks/{id}` →TaskItem.
- POST `/api/tasks` `{projectId,title,description,status,priority,dueDate,assignedUserId}` →201 TaskItem. Domyślne statusTodo i priorityNormal.
- PUT `/api/tasks/{id}` `{title,description,status,priority,dueDate,assignedUserId}` →200 TaskItem, projectId jest niezmienny.
- DELETE `/api/tasks/{id}` →204.
- GET `/api/compare/tasks` (te same filtry) i GET `/api/compare/tasks/{id}` → te same DTO przez Minimal API i tę samą usługę.

### Kontroler i Minimal API

| Obszar | Kontroler `/api/tasks` | Minimal API `/api/compare/tasks` |
| --- | --- | --- |
| Definicja tras | Klasa `TasksController`, atrybuty `[Route]` i `[HttpGet]` | `MapGet` w `Program.cs`, z parametrami trasy i zapytania w sygnaturze funkcji |
| Walidacja parametrów | Wiązanie modelu MVC i obsługa błędów przez `[ApiController]` | Wiązanie parametrów funkcji i jawna walidacja filtra `status` |
| Autoryzacja | Atrybut `[Authorize]` | Wywołanie `.RequireAuthorization()` |
| Zakres | Odczyt i zapis zadań | Dwa odczyty porównawcze, listy i szczegółu |

Obie wersje przekazują odczyt do `ITaskService`. Zwracają te same DTO i stosują tę samą kontrolę członkostwa w serwisie. Kontroler grupuje operacje CRUD zasobu w jednej klasie. Minimal API pozwala zapisać proste odczyty bez osobnej klasy kontrolera.

Kod i sprawdzenia są w [TasksController](../src/TaskFlow.Api/Controllers/TasksController.cs), [Program.cs](../src/TaskFlow.Api/Program.cs) i [ApiBehaviorTests](../tests/TaskFlow.IntegrationTests/ApiBehaviorTests.cs).

## Komentarze

- GET `/api/tasks/{id}/comments` →Comment[] rosnąco według daty.
- POST `/api/tasks/{id}/comments` `{content}` →201 Comment.
- PUT `/api/comments/{id}` `{content}` →200 Comment, tylko autor.
- DELETE `/api/comments/{id}` →204, autor lub właściciel projektu.

## Pozostałe

- GET `/api/deadline-advice?date=yyyy-MM-dd` →200 DeadlineAdvice. Kody ostrzeżeń `past_date`, `weekend`, `public_holiday`. Oddzielne żądanie, zapis zadań nie zależy od kalendarza.
- GET `/api/admin/users` →User[], tylko rolaAdmin.
- GET `/api/health` →200 `{status:"ok"}` anonimowo, GET `/api/health/ready` sprawdza połączenie bazy.
- OpenAPI/Swagger w środowisku Demo. Nieznane `/api/*` zwraca404, bez SPAfallback.

## Błędy i walidacja

Problem Details: `{type,title,status,detail?,instance?,errorCode,traceId,errors?}`; errors mapuje pola na string[]. Wspólny błąd400dla walidacji, 401niezalogowany, 403brak uprawnienia, 404brak/niedostępny zasób, 409konflikt domeny, 500bezpieczny komunikat bez stacktrace. Integracja503(w tym404,429,500/503dostawcy,błędnyJSON) lub504timeout. Anulowanie żądania klienta nie jest udawane jako awaria500.

Limity: displayName100, projectName200, courseName150, opis4000, taskTitle200, comment2000. Wymagane niepuste po trim; deadlineprojektu wymagany. Rejestracja hasło minimum10znaków z małą/wielką literą, cyfrą i znakiem specjalnym, Identity hash/lockout. Nie wymagamy potwierdzenia e-mail ani resetu hasła w tej lokalnej wersji.

Każda mutacja zasobów archiwum poza restore/deleteprojektu daje409. Obcy zasób404; członek bez praw właściciela403. Zduplikowane członkostwo409, konto do dodania nieznalezione404. Usunięcie właściciela lub przypisanego członka409. Admin nie omija kontroli projektu.

### Przykładowy Problem Details i diagnostyka

`GET /api/unknown` zwraca `404 Not Found` z typem treści `application/problem+json`. Nagłówek `X-Trace-Id` odpowiada wartości `traceId` w treści odpowiedzi.

```json
{
  "type": "https://httpstatuses.com/404",
  "title": "Nie znaleziono",
  "status": 404,
  "instance": "/api/unknown",
  "errorCode": "not_found",
  "traceId": "00-0d8e1ce3732e3daaa9f9b27fb26adf08-45f6e36aeb8941df-00"
}
```

Skopiuj identyfikator z własnej odpowiedzi i wyszukaj go w logach usługi `app`. Wpis zawiera metodę HTTP, ścieżkę i status. Przy wyjątkach globalny handler dodaje kod błędu lub nazwę typu wyjątku.

```powershell
docker compose logs app | Select-String -SimpleMatch '<traceId z odpowiedzi>'
```

### Sprawdzone scenariusze doradcy terminu

Doradca pobiera polskie dni ustawowo wolne od pracy przez `IHolidayClient`. Implementacja `NagerHolidayClient` jest klientem typowanym z limitem 5 sekund. Klient przekazuje token anulowania od endpointu do żądania HTTP. Tryb Stub używa testowego handlera HTTP i działa bez sieci.

| Przypadek | Wynik | Dowód |
| --- | --- | --- |
| Poprawny kalendarz z różnymi typami i zasięgami wpisów | Zachowane są tylko dni typu `Public` z flagą `nationalHoliday` | `MapsOnlyNationalPublicHolidaysFromV4Contract` |
| Odpowiedź Nager Live dla 1 stycznia 2027 | HTTP 200 z ostrzeżeniem `public_holiday` | Próba na działającym kontenerze opisana w raporcie weryfikacji |
| Dostawca zwraca 404, 429 lub 503 | HTTP 503, `holiday_service_unavailable` | `ProviderHttpFailureHasSafe503` z trzema odpowiedziami HTTP |
| Dostawca zwraca niepoprawny JSON albo niekompletny model | HTTP 503, `holiday_invalid_response` | `InvalidJsonHas503`, `InvalidProviderModelHasSafe503` |
| Kalendarz przekracza timeout | HTTP 504, `holiday_service_timeout` | `HttpTimeoutHas504` z handlerem, który nie odpowiada |
| Fake klienta zgłasza niedostępność w warstwie usług | Doradca zachowuje status 503 i kod `holiday_service_unavailable` | `PreservesTheControlledErrorWhenTheCalendarIsUnavailable` |
| Klient przerywa żądanie | Token dociera do klienta kalendarza | `ForwardsCancellationToHolidayClient` |

Testy adaptera są w [NagerHolidayClientTests](../tests/TaskFlow.UnitTests/NagerHolidayClientTests.cs), testy doradcy w [DeadlineAdvisorTests](../tests/TaskFlow.UnitTests/DeadlineAdvisorTests.cs), a wynik próby Live w [raporcie weryfikacji](VERIFICATION.md).

## Konfiguracja demonstracji

`Demo:Enabled`, `Demo:Password`, `Jwt:Key`, `ConnectionStrings:DefaultConnection`, `HolidayApi:Mode=Stub|Live`, `HolidayApi:StubScenario=Success|NotFound|RateLimited|Unavailable|Timeout|InvalidJson`. Domyślne profile demonstracji używają Stub. Cztery konta: owner@taskflow.local, member@taskflow.local, outsider@taskflow.local, admin@taskflow.local. Hasło pochodzi z konfiguracji i nie jest śledzone w Git.

API .NET projekt src/TaskFlow.Api/TaskFlow.Api.csproj, Domain src/TaskFlow.Domain, frontend web/, testy tests/TaskFlow.UnitTests i tests/TaskFlow.IntegrationTests, solution TaskFlow.slnx. Lokalnybackend http://localhost:5080, Vite5173proxy /api; kontener8080mapowanyloopback8080. Cookie SecureSameAsRequest dla lokalnego developmentHTTP; środowiska inne niż Development/Test wymagają SecureAlways. JWT i cookies mają wspólne sub/role. Backend obsługuje argument `--migrate`: migracje i seed jawnie włączony Demo, potem exit.
