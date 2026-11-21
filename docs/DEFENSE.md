# Obrona projektu TaskFlow

Autor: **Karol Scisłowski**, projekt indywidualny, Programowanie zaawansowane. Repozytorium publiczne: <https://github.com/Scisly/PZL-Scislowski-Karol>. Rejestr użycia AI: [AI_REGISTER.md](AI_REGISTER.md). Faktyczne wyniki uruchomień: [VERIFICATION.md](VERIFICATION.md).

## Opis w 30 sekund

TaskFlow służy studenckim zespołom do prowadzenia projektów, zadań i komentarzy. React i TypeScript obsługują interfejs, ASP.NET Core udostępnia API, a EF Core zapisuje dane w PostgreSQL. Najważniejsza reguła brzmi: użytkownik widzi tylko projekty, do których należy. Terminy, przypisania i archiwizacja mają dodatkowe reguły sprawdzane po stronie serwera.

## Pytania i odpowiedzi

1. **Dlaczego taki podział projektów?** `TaskFlow.Domain` zawiera encje i czyste reguły, bez EF ani Identity. `TaskFlow.Api` odpowiada za HTTP, usługi, bazę i integracje. `web` odpowiada za interfejs. Zmiana sposobu prezentacji nie wymaga zmiany reguł terminów.
2. **Gdzie działa logika biznesowa?** `DomainRules` sprawdza m.in. terminy, przypisania i archiwum. Usługi `ProjectService`, `TaskService` oraz `CommentService` łączą reguły, dostęp do danych i autoryzację zasobu. Kontrolery przekazują żądania do usług.
3. **Jak zastosowano SRP i DIP?** Kontroler zajmuje się HTTP, usługa przypadkiem użycia, klient świąt komunikacją z dostawcą. Kod korzysta z `IHolidayClient`, `ICurrentUser` i interfejsów usług. Konstruktor otrzymuje zależności przez DI.
4. **Dlaczego bez ogólnego Repository?** EF Core już udostępnia śledzenie zmian, zapytania i jednostkę pracy przez `DbContext`. Ogólna warstwa CRUD powielałaby te funkcje. Usługi wyrażają konkretne operacje domeny, a odczyty projektują dane bezpośrednio do DTO.
5. **Jakie są encje i relacje?** Projekt ma członkostwa i zadania, zadanie ma komentarze. `ProjectMember` łączy użytkownika i projekt przez klucz złożony. Użytkownik może być właścicielem, osobą przypisaną do zadania lub autorem komentarza. Konta obsługuje Identity w warstwie API.
6. **Dlaczego DTO zamiast serializacji encji?** DTO określa jawny kontrakt, ogranicza ujawniane dane i oddziela model HTTP od mapowania EF. Żądanie zmiany zadania nie zawiera zmiennego `projectId`.
7. **Gdzie użyto LINQ?** Ograniczanie zadań przez członkostwo (`Where` i `Any`), opcjonalne filtry statusu i przypisania, sortowanie oraz projekcja `Select` do DTO. `ToListAsync` kończy zapytanie. Warto pokazać te operacje w `TaskService`.
8. **Po co `AsNoTracking`?** Odczyt listy nie zmienia encji. Pominięcie śledzenia ogranicza pracę change trackera. Mutacje korzystają ze śledzonych encji i `SaveChangesAsync`.
9. **Czy `async` tworzy nowy wątek?** Nie jest to jego podstawowy cel. `await` nie blokuje wątku podczas oczekiwania na bazę lub HTTP. `CancellationToken` przekazany do EF i `HttpClient` pozwala przerwać niepotrzebną pracę.
10. **Jak działa uwierzytelnianie?** Interfejs korzysta z cookie Identity `HttpOnly`. Swagger i klienci demonstracyjni mogą dostać JWT na 15 minut. Obecność nagłówka Bearer jawnie wybiera JWT. Błędny JWT nie powoduje przejścia na poprawne cookie.
11. **Czym różnią się uwierzytelnianie i autoryzacja?** Pierwsze ustala tożsamość. Drugie sprawdza, czy ta osoba może wykonać operację. Role Student/Admin, polityka `CanCreateProjects` oraz kontrola członkostwa rozwiązują różne części tego problemu.
12. **Po co CSRF, skoro cookie ma `HttpOnly`?** `HttpOnly` ogranicza odczyt cookie przez JavaScript. Przeglądarka nadal automatycznie wysyła cookie, więc mutacje wymagają dodatkowego tokenu w `X-CSRF-TOKEN`. Frontend odnawia token po loginie, rejestracji i wylogowaniu. Tokenów i haseł nie przechowuje w kodzie repozytorium.
13. **Dlaczego 404 dla obcego projektu?** Odpowiedź nie potwierdza istnienia niedostępnego zasobu. Członek bez praw właściciela otrzymuje 403. Brak zalogowania daje 401. Identyfikator Guid sam w sobie nie chroni danych.
14. **Czy administrator może odczytać każdy projekt?** Nie. Rola Admin daje listę kont, ale nie omija członkostwa w projektach. Rejestracja tworzy tylko Student, a Admin pochodzi z kontrolowanego bootstrapu demo.
15. **Jak rozwiązano błędy?** Globalny handler mapuje wyjątki na Problem Details z `errorCode` i `traceId`. Walidacja daje 400, konflikt reguł 409, niespodziewany błąd 500 z bezpiecznym komunikatem. Stack trace i sekrety nie trafiają do odpowiedzi.
16. **Jak znaleźć błąd w logach?** Porównuję `traceId` z odpowiedzi i kontekst żądania w logach. Stosuję pola strukturalne zamiast składania tekstu. Information opisuje normalne operacje, Warning odrzucone żądania, Error nieoczekiwane awarie serwera. Nie loguję hasła, cookie ani JWT.
17. **Dlaczego Adapter dla kalendarza?** `NagerHolidayClient` mapuje format Nager API v4 na wewnętrzny `PublicHoliday`. Usługa porad terminów zna `IHolidayClient`, bez szczegółów HTTP. Typowane DTO ułatwia wykrycie złego JSON i mapowania `nationalHoliday`/`holidayTypes`.
18. **Co robi aplikacja, gdy API świąt nie działa?** Osobny odczyt porad zwraca 503 albo 504 przy timeout. Zapis projektu lub zadania nie wywołuje tego API, więc awaria kalendarza nie blokuje CRUD. Stub pozwala powtarzalnie pokazać sukces, timeout i błędną odpowiedź.
19. **Co sprawdzają poszczególne testy?** Unit sprawdza reguły i mapowanie integracji. Integration używa `WebApplicationFactory` oraz PostgreSQL w Testcontainers, więc obejmuje HTTP, autoryzację i zapis. Playwright obejmuje przepływ użytkownika w przeglądarce. Aktualne wyniki, liczbę testów i ewentualne blokady odczytuję z `VERIFICATION.md` oraz CI, nie z deklaracji w tym dokumencie.
20. **Co zapewnia Docker Compose?** Powtarzalnie łączy bazę, jednorazowy migrator i aplikację. Migrator kończy aktualizację schematu przed startem aplikacji. Healthcheck sprawdza gotowość. Losowe lokalne sekrety generuje `scripts/setup.mjs` do ignorowanego `.env`.
21. **Czy to gotowy system produkcyjny?** Zakres obejmuje lokalną demonstrację. Brakuje m.in. resetu hasła i potwierdzenia e-mail, paginacji, realtime oraz rozwiązywania równoczesnych edycji. Ostatni poprawny zapis wygrywa. Lokalny HTTP i bootstrap demo wymagają zmiany przed publicznym wdrożeniem.
22. **Jaki był wkład AI i autora?** AI pomagało w tworzeniu i przeglądaniu kodu, dokumentacji i testów w zakresie opisanym w rejestrze. Autor odpowiada za wybór wymagań, weryfikację, oddanie oraz wyjaśnienie rozwiązania. Nie przedstawia pomocy AI jako samodzielnie napisanej bez wsparcia pracy.

## Przygotowanie do rozmowy

Przed obroną autor powinien samodzielnie odtworzyć trzy ścieżki w kodzie: zmiana zadania od formularza do `SaveChangesAsync`, odrzucenie obcego zasobu oraz timeout klienta kalendarza. Warto też zmienić jedną regułę, przewidzieć wpływ na test i dopiero uruchomić sprawdzenie. Przećwiczenie pozostaje czynnością autora. [DEMO.md](DEMO.md) zawiera scenariusz siedmiu minut.
