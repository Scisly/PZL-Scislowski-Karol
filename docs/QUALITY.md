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

Problemy stwierdzono w działającym kodzie. Nie dodawano celowo code smells. Naprawiono trzy pierwsze, z Extract Class i testem regresji korelacji. Pozostałe dwie obserwacje nie blokują zakresu wersji1 i są świadomie pozostawione do dalszego porządkowania.

## Stan po refaktoryzacji

- `RequestTrace` i wydzielony `RequestLoggingMiddleware` używają jednego identyfikatora w odpowiedzi, Problem Details i zakresie logowania. `Response.OnStarting` zachowuje nagłówek również po obsłudze wyjątku.
- `UserDirectoryService` pobiera konta i role dwoma zapytaniami, zastępując ścieżkę1+N odczytów. To porównanie struktury kodu, bez deklaracji zmierzonego przyspieszenia czasowego.
- `ListMembersAsync` używa dwóch projekcji, bez ładowania zadań, zamiast czterech zapytań i materializacji całego agregatu.
- Rzeczywisty test korelacji najpierw nie przeszedł: nagłówek miał `0HNQ...`, a Problem Details `00-...`. Po poprawce przeszedł.
- Weryfikacja po zmianie: **21 unit +12 integracyjnych, wszystkie poprawne**, oraz osobny test regresji1/1. Dwa dodane scenariusze integracyjne sprawdzają role katalogu administratora bez obejścia projektów oraz prawa autora/moderatora komentarzy.
- `dotnet format src/TaskFlow.Api/TaskFlow.Api.csproj --verify-no-changes --no-restore --verbosity minimal`: exit0. Analizatory nie wykazały ostrzeżeń wymagających wyciszeń; nullable pozostaje włączone.

## Dodatkowy przegląd specyfikacji

Niezależny kontekst przeglądu AI wykrył dwa P2: tablica dostawcy zawierająca null powodowała500 zamiast503, a ponowne logowanie po wygaśnięciu cookie używało tokenu CSRF poprzedniej tożsamości. Dodano rzeczywiste regresje przed poprawkami. Walidacja odpowiedzi dostawcy obejmuje strukturę i zgodność roku, zachowując poprawny rok1. Zestaw jednostkowy po rozszerzeniu ma28 przechodzących przypadków. Przepływ ponownego logowania jest też sprawdzany w Playwright po usunięciu wyłącznie cookie sesji.
