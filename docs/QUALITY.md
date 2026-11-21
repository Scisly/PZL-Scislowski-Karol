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

Problemy stwierdzono w działającym kodzie. Nie dodawano celowo code smells. Minimum trzy pierwsze są objęte bieżącą refaktoryzacją, z Extract Class i testem regresji korelacji. Analiza nazw, nullable i warnings jest częścią kompilacji z TreatWarningsAsErrors; wyniki po zmianie zostaną dopisane po rzeczywistym sprawdzeniu.
