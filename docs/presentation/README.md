# Prezentacja TaskFlow

Autor: **Karol Scisłowski**. Projekt indywidualny ze wsparciem AI, Programowanie zaawansowane, temat 12.

- [Prezentacja edytowalna PPTX](output/TaskFlow-Karol-Scislowski.pptx)
- [Prezentacja do odczytu PDF](output/TaskFlow-Karol-Scislowski.pdf)
- [Notatki prelegenta i źródła](SPEAKER_NOTES.md)
- [Scenariusz demo](../DEMO.md)
- [Przygotowanie do obrony](../DEFENSE.md)

Prezentacja ma 14 slajdów w proporcji 16:9. PPTX zawiera edytowalny tekst i diagramy. PDF przechowuje ten sam układ jako obrazy w rozdzielczości 2560 × 1440 na slajd i służy do pokazu bez sieci. Notatki z odwołaniami do kodu znajdują się w PPTX i w osobnym pliku Markdown.

Deck opisuje architekturę, domenę i bazę, API, uprawnienia, błędy, integrację, testy, Docker, CI, wsparcie AI i ograniczenia. Nie podaje niepotwierdzonych wyników testów ani zrzutów udających uruchomione demo. Wyniki należy odczytać z [VERIFICATION.md](../VERIFICATION.md) i historii Actions dla końcowego commita.

## Odtworzenie

Źródłem treści jest `slides.json`, a układu `build.mjs`. Do wygenerowania użyto bibliotek dostarczonych z Codex, bez instalowania zastępczego pakietu. Należy uruchomić `load_workspace_dependencies` w środowisku Codex i ustawić wskazane tam ścieżki:

```powershell
$env:ARTIFACT_TOOL_MODULES = '<bundled Node.js packages>'
$env:ARTIFACT_PYTHON = '<bundled Python executable>'
$env:PRESENTATIONS_SKILL = '<path to the Presentations SKILL.md directory>'
& '<bundled Node.js executable>' docs/presentation/build.mjs
& '<bundled Node.js executable>' docs/presentation/finalize.mjs
& $env:ARTIFACT_PYTHON docs/presentation/export-pdf.py
```

Build zapisuje materiały robocze i rendery w ignorowanym `.build`. Finalizer sprawdza strukturę, rozmiar, liczbę slajdów, font Arial i ponowny import Artifact Tool, a raport pozostaje w `.build/validation.json`. Końcowy PPTX zapisuje w `output`, odmawiając nadpisania istniejącego finalnego pliku. Przy celowej nowej rewizji należy wybrać nową nazwę `finalPath` w finalizerze. PDF odtwarza się z aktualnych renderów po buildzie.

Przy authoringu w Codex należy najpierw wykonać obowiązujący dla danego formatu marker operacji określony przez umiejętność Presentations/PDF. Przegląd wizualny wszystkich slajdów pozostaje potrzebny po zmianie treści lub układu.

Docelowy deck powstał lokalnie, ponieważ po utworzeniu pustego artefaktu Spaces połączenie zgłosiło brak kompatybilnego lokalnego Artifact Session. Pusty artefakt nie stanowi wyniku ani materiału do oddania.

## Przed wystąpieniem

Otworzyć PPTX w programie używanym na zajęciach i sprawdzić fonty oraz notatki. W razie różnic wyświetlić PDF. Przygotować lokalny start aplikacji i przećwiczyć scenariusz demo. Weryfikacja pliku i renderów nie oznacza, że autor już przeprowadził prezentację albo wysłał ją do Moodle.
