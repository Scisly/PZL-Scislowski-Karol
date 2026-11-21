# Ograniczenia i dalszy rozwój

Zakres wersji1 odpowiada projektowi zaliczeniowemu uruchamianemu lokalnie. Poniższe ograniczenia są jawne, a nie deklarowane jako ukończone funkcje.

- Równoczesna edycja stosuje ostatni poprawny zapis, bez ETag, kontroli wersji i aktualizacji realtime. Reguły są sprawdzane w usługach; wersja 1 nie rozwiązuje wszystkich wyścigów między równoległymi operacjami w wielu kartach.
- Listy nie mają paginacji; docelowy zakres to niewielkie zespoły studenckie.
- Nie ma e-maili, potwierdzania adresu, resetu hasła, logowania uczelnianego, transferu własności, plików, czatu ani powiadomień.
- Administrator widzi listę kont, ale nie zarządza dowolnymi projektami. Jest to świadome ograniczenie uprawnień.
- JWT demo ważny 15 min nie jest unieważniany wylogowaniem sesji cookie. Endpoint JWT i Swagger wymagają jawnego Demo:Enabled. Nie ma refresh tokenów.
- Klucze Data Protection kontenera nie są przechowywane w trwałym wolumenie. Odtworzenie kontenera może wymagać ponownego zalogowania; baza PostgreSQL pozostaje trwała.
- Hasło Demo:Password jest używane do założenia kont podczas pierwszego seedowania. Zmiana wartości w .env nie resetuje istniejących haseł Identity.
- Kalendarz Live zależy od dostępności publicznej usługi. Domyślny Stub zapewnia powtarzalną demonstrację bez internetu; nie jest oznaczany jako dane na żywo.
- Instalacja npm zgłasza komunikat deprecated dla przypiętej rodziny ESLint 9. Kontrola podatności wykazała 0 problemów, a lint, TypeScript i build przechodzą. Aktualizacja narzędzi lint do kolejnej głównej wersji wymaga sprawdzenia zgodności pluginów.
- Środowisko lokalne HTTP jest wystawione tylko na loopback. Produkcyjny hosting, HTTPS/proxy, trwałość kluczy sesji i pełne zarządzanie cyklem kont są poza uzgodnionym wdrożeniem.

Możliwe następne kroki: kontrola wersji zmian, paginacja, testy współbieżności reguł agregatu, zaproszenia i bezpieczne odzyskiwanie konta. Nie są konieczne do prezentacji uzgodnionej wersji1.
