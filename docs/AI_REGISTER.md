# Rejestr wykorzystania AI

Autor: Karol Scisłowski. Projekt powstaje ze znaczącym wsparciem Codex. Ten rejestr opisuje rzeczywiste użycie; nie jest oświadczeniem o samodzielnym napisaniu całości kodu.

| Data | Obszar i cel | Rezultat | Weryfikacja | Decyzja |
| --- | --- | --- | --- | --- |
| 2026-11-21 | Analiza 12 tematów i organizacja materiałów | Odczyt 165 dokumentów, 12 checklist, 146 punktów | Porównanie bajtowe z ZIP, sprawdzenie linków, odczyt tekstu i wybranych stron PDF | Wykorzystano do planowania |
| 2026-11-21 | Projektowanie aplikacji | Zakres, technologie, uprawnienia, reguły i plan realizacji | Przegląd wymagań, dokumentacja oficjalna, decyzje użytkownika w rozmowie | Zaakceptowano |
| 2026-11-21 | Backend | Model, migracje, CRUD, usługi, Identity i kontrakty HTTP | 28 testów jednostkowych i 12 integracyjnych PostgreSQL; osobny przegląd zgodności i jakości | modified: poprawiono wykryte błędy odpowiedzi dostawcy i korelacji |
| 2026-11-21 | Frontend | React, formularze, Kanban, uprawnienia i sesje | 21 testów Vitest, 4 przepływy rzeczywistej przeglądarki, mobile, klawiatura, lint/typecheck/build | modified: poprawiono CSRF, wygasłą sesję, ochronę szkiców i anulowanie starych odczytów przy logout |
| 2026-11-21 | Refaktoryzacja | Lista 5 problemów i propozycje zmian | Rzeczywisty baseline oraz wyniki przed/po w QUALITY.md | partially accepted: wdrożono 3 naprawy, 2 obserwacje pozostawiono jawnie |
| 2026-11-21 | Testy | Regresje, fake klienta i czasu, dane izolowane | Zaobserwowane niepowodzenia przed poprawką i sukcesy po niej; CI wykrył wyścigi sprzątania i nawigacji po logout | modified: oczekiwanie na odpowiedź DELETE/logout; poprawa cache i anulowania sprawdzania sesji |
| 2026-11-21 | Docker i CI | Obraz wieloetapowy, Compose, bootstrap sekretów i pipeline | Lokalne build/start/smoke, rzeczywisty kalendarz Live, GitHub Actions i kontrolowany failing test | modified: wyizolowano developerską bazę, poprawiono synchronizację E2E |
| 2026-11-21 | Dokumentacja i prezentacja | README, diagram, scenariusz, pytania i 14 slajdów | Kontrola odnośników, render wszystkich slajdów i stron PDF, finalizer PPTX | accepted po korekcie diagramu i sprawdzeniu układu |
| 2026-11-21 | Review | Osobne konteksty agentów oceniają zgodność i jakość | Uwagi P2 otrzymały regresje i poprawki; komentarze PR jawnie opisują wsparcie AI | accepted; nie jest to niezależna akceptacja drugiego człowieka |
| 2026-11-21 | Audyt 12 tematów | Porównano kod i historię z wymaganiami. Wydzielono operacje konta, uzupełniono metadane Swaggera i dowody do Moodle. | 29 testów jednostkowych i 13 integracyjnych, porównanie wygenerowanej specyfikacji, przebudowa Compose i sprawdzenie odnośników. | modified po poprawieniu referencji Bearer wskazanej przez test i przegląd. |

Autor przed oddaniem powinien przeczytać i zrozumieć kod, powtórzyć demonstrację i potwierdzić sprawdzenia. Przeglądy AI są jawnie oznaczane i nie zastępują niezależnego review innej osoby.
