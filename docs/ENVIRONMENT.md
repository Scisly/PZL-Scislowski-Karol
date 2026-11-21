# Przygotowanie środowiska

Środowisko autora: Windows11, PowerShell, Git, Node24.13.0, DockerDesktop z WSL2. Zainstalowano lokalny SDK .NET10.0.404 w ignorowanym `.tools/dotnet`; pobrany pakiet sprawdzono sumą SHA512 z oficjalnych metadanych Microsoft.

Do pracy z lokalnym SDK w PowerShell:

```powershell
$env:DOTNET_ROOT = Join-Path (Get-Location) '.tools/dotnet'
$env:PATH = $env:DOTNET_ROOT + ';' + (Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin') + ';' + $env:PATH
dotnet --version
docker version
node --version
```

Na innym komputerze należy zainstalować SDK wskazany w `global.json`, Node24 i Docker. Lokalny katalog `.tools` nie jest częścią repozytorium.

Przygotowanie konfiguracji i uruchomienie po ukończeniu implementacji:

```powershell
node scripts/setup.mjs
docker compose up --build -d
```

Skrypt środowiska generuje lokalne sekrety w ignorowanym `.env`. Hasła i klucze nie powinny być wklejane do zgłoszeń ani rejestru AI. Ostateczne sprawdzone polecenia oraz wyniki są dopisywane do README i raportu weryfikacji wraz z implementacją.

Dokumenty źródłowe prowadzącego pozostają w lokalnym `materialy`. Nie są niezbędne do budowania aplikacji z repozytorium.
