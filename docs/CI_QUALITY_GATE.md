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

Oznacza to, że failing test rzeczywiście blokuje pipeline, a nie jest ignorowany przez konfigurację. Naprawa usuwa wyłącznie celowo błędny test; aplikacja nie wymagała poprawki dla tego kontrolowanego ćwiczenia. Wynik kolejnego przebiegu jest uzupełniany po jego zakończeniu.

## Oddzielny rzeczywisty błąd testu E2E

[Przebieg 44892680725](https://github.com/Scisly/PZL-Scislowski-Karol/actions/runs/44892680725) wykrył niezależny wyścig w sprzątaniu testu członka. Test czekał na nagłówek strony widoczny już pod dialogiem, zamiast na zakończenie DELETE zadania. DELETE projektu uruchamiał się równolegle; log Compose potwierdził `409 resource_changed`.

Poprawa polega na oczekiwaniu na konkretną odpowiedź DELETE zadania ze statusem 204 oraz zamknięcie dialogu i usunięcie elementu. Nie zaakceptowano 409 jako sukcesu i nie dodano ślepego ponawiania. To rzeczywista poprawa synchronizacji testu, oddzielona od celowego failing testu.
