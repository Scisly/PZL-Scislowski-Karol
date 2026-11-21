# Dowód działania quality gate

## Kontrolowane niepowodzenie

Ćwiczenie Tematu 11 wykonano jawnie na osobnym branchu `feature/07-ci-quality-gate-demo`, w [PR #7](https://github.com/Scisly/PZL-Scislowski-Karol/pull/7). Czerwony stan nie jest przeznaczony do scalenia z main.

Commit `c1e92c54f8b2db059990d0fa38b4825d8eae57c9` dodaje jeden celowo nieprzechodzący test `QualityGateDemonstrationTests.DeliberateFailureMustStopThePipeline`. Lokalna kompilacja przeszła, a test zakończył się dokładnie jednym niepowodzeniem z komunikatem kontrolowanej próby.

[Nieudany przebieg CI 44892834616](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44892834616):

- Build i analizatory: sukces.
- Jednostkowe: 1 niepowodzenie, 28 poprawnych, 29 łącznie.
- Integracyjne PostgreSQL: 12 poprawnych.
- Job backend: niepowodzenie w kroku testów.
- Job frontend: sukces; job compose został pominięty przez zależność od backendu.

Oznacza to, że failing test rzeczywiście blokuje pipeline, a nie jest ignorowany przez konfigurację. Naprawa usuwa celowo błędny test; aplikacja nie wymagała poprawki dla tego kontrolowanego ćwiczenia.

[Poprawny przebieg po naprawie 44893292275](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893292275), commit `45de9900b01435410e5115ea96bf98b7088abce3`: wszystkie trzy joby zakończone sukcesem, w tym obraz, migracje, smoke i rzeczywiste testy przeglądarkowe. PR #7 zamknięto bez scalenia, zachowując izolowaną historię ćwiczenia.

## Oddzielny rzeczywisty błąd testu E2E

[Przebieg 44892680725](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44892680725) wykrył niezależny wyścig w sprzątaniu testu członka. Test czekał na nagłówek strony widoczny już pod dialogiem, zamiast na zakończenie DELETE zadania. DELETE projektu uruchamiał się równolegle; log Compose potwierdził `409 resource_changed`.

Poprawa polega na oczekiwaniu na konkretną odpowiedź DELETE zadania ze statusem 204 oraz zamknięcie dialogu i usunięcie elementu. Nie zaakceptowano 409 jako sukcesu i nie dodano ślepego ponawiania. To rzeczywista poprawa synchronizacji testu, oddzielona od celowego failing testu.

[Zielony przebieg po poprawce synchronizacji 44893286709](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893286709), commit `ed9a064bfbceb3542f6e35fc5061ddabe1848fe5`, potwierdza wszystkie joby dla wersji scalonej przez PR #6.

## Nawigacja przed zakończeniem wylogowania

[Przebieg main 44893653696](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44893653696) ujawnił drugi błąd synchronizacji, w przepływie rejestracji i konta administratora. Backend, frontend i smoke przeszły; trzy pozostałe przepływy przeglądarkowe również. Test rozpoczynał nawigację do `/login`, zanim przeglądarka odebrała odpowiedź wylogowania i usunęła cookie.

Ślad Playwright pokazał przerwaną odpowiedź logout, a log serwera: nawigację o 10:20:41.768, zakończenie logout o 10:20:41.770 i późniejsze `/auth/me` ze statusem 200. Poprawka wymaga odebrania konkretnej odpowiedzi logout 204 i pojawienia się formularza logowania przed rozpoczęciem sesji administratora. Nie dodaje ponawiania testu ani opóźnienia o stałej długości.

Ponowne uruchomienie ujawniło także niepotrzebny odczyt projektów po wylogowaniu: usunięcie całego cache odtwarzało jeszcze aktywne zapytania chronionego ekranu. Zmieniono zakończenie sesji: anulowanie trwającego sprawdzania `/auth/me`, ustawienie konta na `null` oraz usunięcie danych chronionych z zachowaniem obserwowanego zapytania sesji. Osobne regresje sprawdzają brak ponownego pobrania projektów i brak przywrócenia starego konta przez opóźnioną odpowiedź. Przegląd AI wskazał drugi przypadek przed zaakceptowaniem poprawki.
