# Demo TaskFlow w 7 minut

Scenariusz demonstracji dla autora. To instrukcja do przećwiczenia, a nie zapis wykonanej prezentacji. Repozytorium: <https://github.com/Scisly/PZL-Scislowski-Karol>. Faktyczne wyniki weryfikacji: [VERIFICATION.md](VERIFICATION.md).

## Przygotowanie przed zajęciami

W katalogu głównym repozytorium, przy działającym Docker Desktop z kontenerami Linux:

```powershell
node scripts/setup.mjs
docker compose up --build --detach --wait
node scripts/verify.mjs --e2e
```

Ostatnie polecenie wykonuje kontrole backendu i frontendu, uruchamia Compose, smoke oraz Playwright. Wymaga lokalnego SDK .NET, Node i Dockera. Nie uruchamiać pełnej instalacji zależności po raz pierwszy podczas wystąpienia. Stan i przeszkody sprawdzić w `VERIFICATION.md`.

Otworzyć <http://localhost:8080>, Swagger w profilu Demo oraz stronę Actions repozytorium. Przygotować narzędzia deweloperskie przeglądarki z zakładką Network. Dla właściciela i członka użyć oddzielnych profili przeglądarki. Osobne okno prywatne posłuży do próby bez logowania.

Konta: `owner@taskflow.local`, `member@taskflow.local`, `outsider@taskflow.local`, `admin@taskflow.local`. Wspólne lokalne hasło demo odczytać wyłącznie na swoim komputerze:

```powershell
node scripts/setup.mjs --show-credentials
```

Nie udostępniać widoku terminala z hasłem, `.env`, tokenem ani cookie. Nie wpisywać sekretów do slajdów lub zrzutów. Dla stabilnego demo pozostawić `HOLIDAY_API_MODE=Stub` i scenariusz `Success`.

## Przebieg

| Czas | Działanie | Co powiedzieć / dowód |
|---|---|---|
| 0:00–0:35 | Pokazać ekran logowania i zalogować właściciela | „Projekt łączy zespoły, zadania i terminy. Serwer pilnuje dostępu do projektu”. W Network wskazać `/api/auth/me` i logowanie. |
| 0:35–1:30 | Utworzyć projekt „Demo obrony”, przedmiot, opis i termin za miesiąc. Otworzyć go ponownie i poprawić opis | CRUD projektu zapisuje dane w PostgreSQL. Data projektu jest wymagana. Pokazać wynik po odświeżeniu strony. |
| 1:30–2:35 | Dodać istniejące konto członka. Utworzyć zadanie z priorytetem, terminem i przypisaniem. Zmienić status w Kanbanie, sprawdzić filtr na liście | Przypisanie dotyczy tylko członka. Kanban zmienia status bez drag and drop. Ta sama encja jest widoczna na liście. |
| 2:35–3:15 | Dodać komentarz i zmienić jego treść. Następnie usunąć komentarz lub dodatkowe zadanie demonstracyjne | Autor edytuje swój komentarz. Właściciel może też usuwać komentarze innych osób. Pokazać odpowiedź 200/204 w Network. |
| 3:15–4:05 | W oknie prywatnym wejść na `/api/tasks`. W profilu członka pokazać zakaz operacji właściciela | Bez sesji API daje **401**, bez przekierowania do HTML. Zalogowany członek przy próbie zmiany projektu otrzymuje **403**. Ukryty przycisk w UI nie zastępuje kontroli serwera. |
| 4:05–4:45 | Pokazać regułę terminu lub archiwum | UI waliduje dane wcześnie. API niezależnie zwraca **409**, gdy termin zadania przekroczy termin projektu albo mutacja dotyczy archiwum. W odpowiedzi wskazać `errorCode` i `traceId`. |
| 4:45–5:20 | Otworzyć porady terminu dla weekendu/święta. Omówić Nager i Stub | Ostrzeżenie nie blokuje zapisu. Timeout i awarie dostawcy dotyczą osobnego odczytu porady, ze statusami 504/503. |
| 5:20–6:15 | Pokazać test reguły w kodzie, test API i Playwright. Otworzyć faktyczny wynik CI | Rozdzielić zakres testów. Wynik udowadnia ostatnie uruchomienie dla konkretnego commita. Nie nazywać CI zielonym, jeśli nie jest zielone. |
| 6:15–7:00 | Pokazać plik Compose, migrator, publiczne repo i rejestr AI. Wymienić dwa ograniczenia | „Autor pracował sam ze wsparciem AI. Brak realtime i ostatni poprawny zapis wygrywa”. Usunąć projekt demo, jeśli pozostał czas. |

## Powtarzalne pokazanie 403 i 409 w Swaggerze

Frontend prawidłowo ukrywa część niedozwolonych operacji. Do dowodu kontroli API użyć Swaggera oraz **JWT konta członka** uzyskanego przez `POST /api/auth/token` w profilu Demo. Wprowadzić dane logowania prywatnie. W `Authorize` ustawić Bearer i nie wyświetlać tokenu publicznie.

1. Właściciel tworzy projekt, dodaje członka i zapisuje identyfikator projektu.
2. Jako członek wykonać `PUT /api/projects/{id}` z kompletnym poprawnym body projektu. Oczekiwane **403**.
3. Jako członek wykonać `POST /api/tasks` dla tego projektu z terminem późniejszym od terminu projektu. Pozostałe pola mają być poprawne. Oczekiwane **409** i kod konfliktu domenowego.
4. Opcjonalnie jako outsider wykonać `GET /api/projects/{id}`. Oczekiwane **404**, ponieważ projekt jest niedostępny. Admin również nie omija członkostwa.

JWT służy tu wyłącznie demonstracji. Zwykły frontend używa cookie i tokenu CSRF. Nie zastępować 403 błędem walidacji 400: body próby musi być poprawne.

## Plan awaryjny

- **Brak sieci:** Compose, Stub i pobrane zależności umożliwiają demo lokalne. Otworzyć lokalny [PPTX](presentation/output/TaskFlow-Karol-Scislowski.pptx) albo [PDF](presentation/output/TaskFlow-Karol-Scislowski.pdf). Sprawdzić pliki przed zajęciami.
- **Aplikacja nie startuje:** sprawdzić `docker compose ps` oraz `docker compose logs app migrate`. Nazwy usług potwierdzić w bieżącym Compose. Nie pokazywać pliku `.env`. Użyć rzeczywistego raportu `VERIFICATION.md` i źródeł do wyjaśnienia przepływu. Nie przedstawiać slajdu lub logu jako działającego demo.
- **CI trwa lub nie przechodzi:** pokazać faktyczny status i przyczynę. Udany lokalny test oraz CI to dwa odrębne dowody.
- **Brakuje czasu:** priorytet to zapis zadania, 401/403/409, krótki test i opis architektury. Instalację narzędzi oraz przełączanie trybu kalendarza wykonać przed zajęciami.

Nie używać `docker compose down --volumes` podczas obrony: usuwa dane bazy. Zwykłe zakończenie demo: `docker compose down`.
