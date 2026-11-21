# Oddanie projektu TaskFlow

**Autor:** Karol Scisłowski. Projekt indywidualny ze wsparciem AI opisanym w rejestrze. **Temat 12:** finalizacja projektu, dokumentacja, prezentacja i demo.

**Publiczne repozytorium:** <https://github.com/Scisly/PZL-Scislowski-Karol>

**Gałąź końcowa:** `main`

**Historia kontroli:** <https://github.com/Scisly/PZL-Scislowski-Karol/actions>

## Zawartość do oceny

| Element | Lokalizacja |
|---|---|
| Cel, funkcje i uruchomienie | [README.md](../README.md) |
| Model domenowy i relacje | [DOMAIN.md](DOMAIN.md) |
| Kontrakt HTTP | [API.md](API.md) |
| Wkład i użycie AI | [AI_REGISTER.md](AI_REGISTER.md) |
| Ograniczenia | [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |
| Rzeczywiste wyniki kontroli | [VERIFICATION.md](VERIFICATION.md) |
| Scenariusz siedmiu minut | [DEMO.md](DEMO.md) |
| Pytania do obrony | [DEFENSE.md](DEFENSE.md) |
| Prezentacja edytowalna | [PPTX, 14 slajdów](presentation/output/TaskFlow-Karol-Scislowski.pptx) |
| Kopia prezentacji do pokazu | [PDF, 14 stron](presentation/output/TaskFlow-Karol-Scislowski.pdf) |
| Notatki i źródła do odtworzenia | [presentation](presentation/) |

Powiązany końcowy pull request i aktualny commit należy odczytać z historii repozytorium. Dokument nie przypisuje numeru PR ani wyniku sprawdzeń, zanim faktycznie powstaną.

## Czynności autora przed wysłaniem

1. Otworzyć publiczny link w oknie bez logowania. Sprawdzić, że `main` zawiera ostateczny kod i dokumenty, a nie wyłącznie gałąź roboczą.
2. Przeczytać `VERIFICATION.md`, ostatni workflow dla końcowego commita i `KNOWN_ISSUES.md`. Wyników lokalnych nie utożsamiać automatycznie z wynikiem GitHub Actions.
3. Uruchomić aplikację według README. Przećwiczyć samodzielnie [DEMO.md](DEMO.md), w tym odmowę dostępu i błąd reguły. Sprawdzić możliwość wyjaśnienia kodu bez podpowiedzi AI.
4. Otworzyć wszystkie slajdy w programie używanym na zajęciach. PPTX zawiera elementy do edycji, a PDF służy do pokazu offline. Dołączyć końcowy plik z katalogu `presentation/output`. Nie oddawać plików roboczych ani raportów technicznych decku.
5. W Moodle wkleić link do publicznego repozytorium i załączyć prezentację w formacie przyjmowanym przez zadanie. Jeśli prowadzący wymaga archiwum kodu, pobrać archiwum końcowego `main`, bez `.env`, katalogów zależności, baz danych i materiałów prowadzącego.
6. Zweryfikować podgląd i potwierdzenie oddania w Moodle. Nie publikować haseł demo, tokenów ani logów zawierających dane uwierzytelniające.

Wysłanie w Moodle, sprawdzenie terminu oraz przećwiczenie wystąpienia pozostają czynnościami autora. Ten dokument nie poświadcza ich wykonania.

## Proponowany opis do Moodle

> TaskFlow – indywidualny projekt Karola Scisłowskiego. Aplikacja do zarządzania projektami studenckimi, zadaniami i komentarzami. Backend ASP.NET Core, EF Core i PostgreSQL, frontend React/TypeScript, uruchomienie lokalne i Docker Compose. Publiczne repozytorium: https://github.com/Scisly/PZL-Scislowski-Karol. Dokumentacja obejmuje instrukcję startu, model danych, API, testy, znane ograniczenia i jawny rejestr użycia AI. Dołączona prezentacja przedstawia architekturę oraz scenariusz demo.
