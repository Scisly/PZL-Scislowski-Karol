# Przygotowanie środowiska

Środowisko autora: Windows 11, PowerShell, Git, Node 24.13.0, Docker Desktop z WSL2. Zainstalowano lokalny SDK .NET 10.0.404 w ignorowanym `.tools/dotnet`; pobrany pakiet sprawdzono sumą SHA512 z oficjalnych metadanych Microsoft.

Do pracy z lokalnym SDK w PowerShell:

```powershell
$env:DOTNET_ROOT = Join-Path (Get-Location) '.tools/dotnet'
$env:PATH = $env:DOTNET_ROOT + ';' + (Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin') + ';' + $env:PATH
dotnet --version
docker version
node --version
```

Na innym komputerze należy zainstalować SDK wskazany w `global.json`, Node 24 i Docker. Lokalny katalog `.tools` nie jest częścią repozytorium. `global.json` sprawdza SDK lokalny, a następnie zainstalowany w systemie.

Przygotowanie konfiguracji i uruchomienie:

```powershell
node scripts/setup.mjs
docker compose up --build --detach --wait
```

Skrypt środowiska generuje lokalne sekrety w ignorowanym `.env`. Hasła i klucze nie powinny być wklejane do zgłoszeń ani rejestru AI. Działająca aplikacja jest dostępna pod `http://localhost:8080`. Pełna kontrola: `node scripts/verify.mjs --e2e`. Sprawdzone polecenia oraz wyniki znajdują się w [README](../README.md) i [raporcie weryfikacji](VERIFICATION.md).

Do pracy nad backendem użyj `node scripts/dev-backend.mjs`. Skrypt uruchamia osobny projekt Compose `taskflow-dev`, bazę na lokalnym porcie 55432, migracje i API na 5080. Nie współdzieli wolumenu z pełnym Compose. Frontend developerski: `cd web`, `npm ci`, `npm run dev` (port 5173, proxy do API).

Dokumenty źródłowe prowadzącego pozostają w lokalnym `materialy`. Nie są niezbędne do budowania aplikacji z repozytorium.
