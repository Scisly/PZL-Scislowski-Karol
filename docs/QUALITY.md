# Audyt jakości i refaktoryzacja

## Baseline przed zmianą

Kod backendu: commit `7b9f49dce8325d4fbd76a6278598083ca9d07806`.

Polecenie: `dotnet test TaskFlow.slnx --configuration Release --nologo --logger "trx;LogFileName=baseline.trx" --results-directory artifacts/baseline` przy SDK10.0.404 i działającym Dockerze.

Wynik rzeczywisty: **21 jednostkowych oraz 10 integracyjnych, 0 niepowodzeń i 0 pominięć**. Kompilacja bez ostrzeżeń. Pierwsza konfiguracja loggera nadpisała plik TRX testów jednostkowych wynikiem integracyjnych; oba wyniki zostały odczytane z przebiegu. Kolejne sprawdzenia zapisują osobne raporty.

## Pięć rozpoznanych problemów

| Problem | Stan przed | Planowana poprawa |
| --- | --- | --- |
| Niespójna korelacja | Problem Details używa Activity.Id, a nagłówek i logi TraceIdentifier | Wspólny helper identyfikatora oraz middleware zakresu logowania |
| N+1 w katalogu użytkowników | Oddzielne pobieranie ról dla każdego konta | Jedna projekcja kont i zbiorcze pobranie ról w osobnej usłudze |
| Nadmiarowy odczyt członków | Lista członków ładuje cały agregat projektu, w tym zadania | Odczyt członków przez projekcję/join bez ładowania zadań |
| Powielanie projekcji projektu | List/Get powtarzają konstrukcję ProjectDto | Możliwość przyszłego wydzielenia wspólnej projekcji; nie trzeba naprawiać wszystkiego w jednym PR |
| Mieszane odpowiedzialności kontrolera kont | Me pobiera i mapuje konto; Logout bezpośrednio steruje sesją | Przyszłe wydzielenie do kontraktu usługi kont |

Problemy stwierdzono w działającym kodzie. W PR #4 naprawiono trzy pierwsze, używając Extract Class i testu regresji korelacji. Później wydzielono także odczyt bieżącego konta i wylogowanie z kontrolera. Wykaz operacji i ich miejsca w kodzie zawiera [mapa tematów](COURSE_MAP.md#wydzielenie-operacji-srp-i-dip).

## Stan po refaktoryzacji

- `RequestTrace` i wydzielony `RequestLoggingMiddleware` używają jednego identyfikatora w odpowiedzi, Problem Details i zakresie logowania. `Response.OnStarting` zachowuje nagłówek również po obsłudze wyjątku.
- `UserDirectoryService` pobiera konta i role dwoma zapytaniami, zastępując ścieżkę1+N odczytów. To porównanie struktury kodu, bez deklaracji zmierzonego przyspieszenia czasowego.
- `ListMembersAsync` używa dwóch projekcji, bez ładowania zadań, zamiast czterech zapytań i materializacji całego agregatu.
- Rzeczywisty test korelacji najpierw nie przeszedł: nagłówek miał `0HNQ...`, a Problem Details `00-...`. Po poprawce przeszedł.
- Weryfikacja po zmianie: **21 unit +12 integracyjnych, wszystkie poprawne**, oraz osobny test regresji1/1. Dwa dodane scenariusze integracyjne sprawdzają role katalogu administratora bez obejścia projektów oraz prawa autora/moderatora komentarzy.
- `dotnet format src/TaskFlow.Api/TaskFlow.Api.csproj --verify-no-changes --no-restore --verbosity minimal`: exit0. Analizatory nie wykazały ostrzeżeń wymagających wyciszeń; nullable pozostaje włączone.

## Karta przed i po. Lista kont administratora

| Obszar | Przed zmianą (`7b9f49d`) | Po zmianie (`f1fe90c`) |
| --- | --- | --- |
| Odpowiedzialność | `AdminUsersController.Get` obsługiwał HTTP, dopytywał o role każdego konta i składał odpowiedź. | Kontroler odpowiada za HTTP. `UserDirectoryService.ListAsync` pobiera i mapuje konta. |
| Złożoność | Jedno zapytanie o konta i po jednym zapytaniu o role każdego konta (1 + N). | Dwa zapytania i powiązanie ról z kontami za pomocą `ILookup`. |
| Duplikacja | Odczyt ról był powtarzany dla każdego konta. Inna obserwacja to powielona projekcja `ProjectDto` w dwóch odczytach projektu. | Każdy zestaw danych pobierany jest raz. Powielona projekcja `ProjectDto` pozostała do ewentualnego uproszczenia. |
| Nazewnictwo | Akcja `Get` zawierała ogólną zmienną `result`. Z nazw trudno było odczytać etapy pobierania ról. | `accounts`, `roleAssignments` i `rolesByUser` opisują kolejne dane. Akcja `Get` wywołuje `IUserDirectoryService.ListAsync`. |
| Ostrzeżenia i analizatory | Build Release z włączonym nullable dał 0 ostrzeżeń. | Format i analiza przeszły z kodem 0. W kodzie refaktoryzacji zachowano nullable. Wygenerowane pliki migracji EF mają własne dyrektywy pozostawione przez generator. |
| Testy | 21 jednostkowych i 10 integracyjnych. | 21 jednostkowych i 12 integracyjnych po refaktoryzacji, w tym sprawdzenie listy kont i ról oraz izolacji projektów dla administratora. |

Wydzielenie klasy pozwoliło odciążyć kontroler i przenieść całą budowę listy kont do jednej usługi. Liczbę zapytań porównano w kodzie. Kontrola integracyjna sprawdza odpowiedź i dostęp do zasobu. Lista kont nadal nie ma paginacji, więc wielkość odpowiedzi rośnie wraz z liczbą użytkowników. Zmianę i review opisuje [PR #4](https://github.com/Scisly/PZL-Scislowski-Karol/pull/4).

## Dodatkowy przegląd specyfikacji

Niezależny kontekst przeglądu AI wykrył dwa P2: tablica dostawcy zawierająca null powodowała500 zamiast503, a ponowne logowanie po wygaśnięciu cookie używało tokenu CSRF poprzedniej tożsamości. Dodano rzeczywiste regresje przed poprawkami. Walidacja odpowiedzi dostawcy obejmuje strukturę i zgodność roku, zachowując poprawny rok1. Zestaw jednostkowy po rozszerzeniu ma28 przechodzących przypadków. Przepływ ponownego logowania jest też sprawdzany w Playwright po usunięciu wyłącznie cookie sesji.
