# Oddanie projektu TaskFlow

**Autor:** Karol Scisłowski. Projekt indywidualny ze wsparciem AI opisanym w rejestrze. **Temat 12:** finalizacja projektu, dokumentacja, prezentacja i demo.

**Publiczne repozytorium:** <https://github.com/Scisly/PZL-Scislowski-Karol>

**Gałąź końcowa:** `main`

**Pull request z aplikacją i materiałami do obrony:** [PR #8](https://github.com/Scisly/PZL-Scislowski-Karol/pull/8). Uzupełnienia i dowody dla poszczególnych tematów wskazuje [mapa tematów](COURSE_MAP.md).

**Historia kontroli:** <https://github.com/Scisly/PZL-Scislowski-Karol/actions>

## Zawartość do oceny

| Element | Lokalizacja |
|---|---|
| Cel, funkcje i uruchomienie | [README.md](../README.md) |
| Model domenowy i relacje | [DOMAIN.md](DOMAIN.md) |
| Kontrakt HTTP | [API.md](API.md) |
| Dowody z każdego tematu i linki do PR | [COURSE_MAP.md](COURSE_MAP.md) |
| Wkład i użycie AI | [AI_REGISTER.md](AI_REGISTER.md) |
| Ograniczenia | [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |
| Rzeczywiste wyniki kontroli | [VERIFICATION.md](VERIFICATION.md) |
| Scenariusz siedmiu minut | [DEMO.md](DEMO.md) |
| Pytania do obrony | [DEFENSE.md](DEFENSE.md) |
| Prezentacja edytowalna | [PPTX, 14 slajdów](presentation/output/TaskFlow-Karol-Scislowski.pptx) |
| Kopia prezentacji do pokazu | [PDF, 14 stron](presentation/output/TaskFlow-Karol-Scislowski.pdf) |
| Notatki i źródła do odtworzenia | [presentation](presentation/) |

## Wkład autora

Karol Scisłowski wybrał zakres projektu indywidualnego, zatwierdził plan obejmujący backend i frontend oraz wskazał publiczne repozytorium na swoim koncie i prefiks `feature/` dla gałęzi. Codex wspierał analizę materiałów, implementację, testy, konfigurację CI, dokumentację i przegląd kodu. Zakres i sposób sprawdzenia tych prac opisuje [rejestr AI](AI_REGISTER.md).

## Czynności autora przed wysłaniem

1. Otworzyć publiczny link w oknie bez logowania. Sprawdzić, że `main` zawiera ostateczny kod i dokumenty, a nie wyłącznie gałąź roboczą.
2. Przeczytać `VERIFICATION.md`, ostatni workflow dla końcowego commita i `KNOWN_ISSUES.md`. Wyników lokalnych nie utożsamiać automatycznie z wynikiem GitHub Actions.
3. Uruchomić aplikację według README. Przećwiczyć samodzielnie [DEMO.md](DEMO.md), w tym odmowę dostępu i błąd reguły. Sprawdzić możliwość wyjaśnienia kodu bez podpowiedzi AI.
4. Otworzyć wszystkie slajdy w programie używanym na zajęciach. PPTX zawiera elementy do edycji, a PDF służy do pokazu offline. Dołączyć końcowy plik z katalogu `presentation/output`. Nie oddawać plików roboczych ani raportów technicznych decku.
5. W Moodle podać link do publicznego repozytorium i wskazać `main` jako końcową gałąź. Dołączyć prezentację i rejestr AI. Instrukcja startu jest w README. Gdy Moodle wymaga osobnych dowodów z tematów, użyć [mapy tematów z linkami do PR](COURSE_MAP.md). Jeśli prowadzący wymaga archiwum kodu, pobrać archiwum końcowego `main`.
6. Zweryfikować podgląd i potwierdzenie oddania w Moodle. Nie publikować haseł demo, tokenów ani logów zawierających dane uwierzytelniające.

Wysłanie w Moodle, sprawdzenie terminu oraz przećwiczenie wystąpienia pozostają czynnościami autora. Ten dokument nie poświadcza ich wykonania.

## Proponowany opis do Moodle

> TaskFlow to indywidualny projekt Karola Scisłowskiego. Aplikacja służy do zarządzania projektami studenckimi, zadaniami i komentarzami. Korzysta z ASP.NET Core, EF Core, PostgreSQL i Reacta z TypeScript. Instrukcja uruchomienia z Docker Compose znajduje się w README na końcowej gałęzi `main`. Prezentacja przedstawia architekturę i scenariusz demo. Rejestr AI opisuje zakres pomocy i weryfikację. Repozytorium jest dostępne publicznie pod adresem https://github.com/Scisly/PZL-Scislowski-Karol.
