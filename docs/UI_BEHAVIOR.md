# TaskFlow: kontrakt zachowania interfejsu

Źródła: docs/PLAN.md, docs/API.md; język pl-PL, timestamp Europe/Warsaw. Wygląd: DESIGN.md. Pierwsza implementacja, brak poprzedniego rodzeństwa do migracji.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | web/src/ui/Select.tsx | ten kontrakt | authored single select | ui.test.tsx, E2E |
| Date | web/src/ui/Fields.tsx | API date-only | native date, platform popup accepted | validation.test.ts, E2E |
| Form | web/src/ui/useForm.ts | ten kontrakt | create/edit/auth | validation.test.ts, E2E |
| Scrollbar | web/src/tokens.css | DESIGN.md | global, table overflow | browser |
| Toast | web/src/context.tsx | ten kontrakt | success/info/error | ui.test.tsx |
| CRUD | web/src/api.ts, pages | docs/API.md | pessimistic, return/stay | api.test.ts, E2E |

Projekty: utworzenie zamyka formularz i przechodzi do projektu. Edycja wraca do bieżącego projektu. Zadanie: zapis zamyka formularz i odświeża listę oraz liczniki; szczegóły dostępne z Kanbanu i listy. Komentarz pozostaje w szczegółach. Usunięcie zasobu wymaga dialogu z nazwą i konsekwencją, finalny przycisk ma czasownik Usuń. Archiwizacja i zmiana członkostwa również wymagają potwierdzenia. Przywrócenie jest odwracalne i bez dodatkowego potwierdzenia.

Właściciel zarządza projektem i członkostwem; członkowie zadaniami. Autor edytuje komentarz; autor i właściciel go usuwają. Archiwum jest tylko do odczytu, z przywracaniem/usuwaniem projektu dla właściciela. Administrator widzi konta i nie omija członkostwa. UI ukrywa nieuprawnione działania, serwer zawsze egzekwuje reguły. 403 pozostaje błędem w kontekście operacji z zachowaniem pól.

Każda lista ma loading/error/retry/empty/no-results i licznik. Filtry, zakładki, wyszukiwanie i strona są źródłowo w URL; filtrowanie lokalne nie wymaga debounce ani sieci. Czyszczenie wyszukiwania natychmiastowe i przywraca fokus. Tabele i listy stosują klientową paginację po 12 elementów (API v1 bez paginacji), Kanban pokazuje wszystkie dopasowane zadania. Dane są prawdziwe, bez mocków produkcyjnych.

Formularze noValidate: wymagane pola, limity i zależności dat są sprawdzane przed API; błędy przy polach i wspólna informacja, fokus pierwszego błędu. Błędy serwera zachowują wszystkie wartości, wyświetlają traceId, walidację pól i umożliwiają poprawę. Wysyłanie blokuje duplikację i zachowuje geometrię przycisków. Hasła zamaskowane, z pokazywaniem/ukrywaniem i właściwym autocomplete; brak zapisu sekretów w storage. Ostrzeżenia kalendarza są osobnym zapytaniem i nigdy nie blokują zapisu.

Wszystkie mutacje pesymistyczne; brak offline queue. Błąd sieci zachowuje formularz i daje możliwość ponowienia. Konflikt 409 wyjaśnia regułę z API; wersja 1 stosuje ostatni poprawny zapis, bez obietnic merge. 401 po zalogowaniu otwiera ponowne logowanie nad bieżącym ekranem, zachowując wpisane dane w pamięci. Po odnowieniu token CSRF pobierany od nowa. Użytkownik może zakończyć sesję i porzucić dane; nie są utrwalane na dysku. Zwykłe in-app opuszczenie brudnego formularza jest blokowane dialogiem; rzeczywisty unload korzysta wyłącznie z beforeunload. Po wylogowaniu cache jest czyszczony.

Modal ma tytuł, focus trap, fokus i Escape z kontrolą niezapisanych zmian, przywrócenie do wywołującego elementu. Select: strzałki, Home/End, Enter/Space, Escape, Tab i typeahead. Widoczny fokus, nazwy ikon, semantyczne linki/przyciski, live feedback, reduced motion i forced colors. Minimum telefonu 360px; zakładki i menu nie polegają na hover. Zmiany danych w otwartym formularzu nie nadpisują pól.
