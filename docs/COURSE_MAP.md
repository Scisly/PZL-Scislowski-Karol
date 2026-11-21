# Mapa wymagań 12 tematów

Źródło wymagań stanowią przekazane zadania i lokalne materiały prowadzącego. Poniższa mapa wskazuje implementację i sposób sprawdzenia. Faktyczne wyniki uruchomień oraz odnośniki CI znajdują się w VERIFICATION.md.

| Temat | Implementacja / dowód | Jak sprawdzić |
| --- | --- | --- |
| 1 Git | main, branche feature, logiczne commity, PR-y i jawne review wspomagane AI | git log --graph --all; historia PR w GitHub |
| 2 Model | Domain: Project, TaskItem, Comment, ProjectMember; ApplicationUser w Api; enumy, DTO i DOMAIN.md | Build rozwiązania i diagram |
| 3 EF | AppDbContext, PostgreSQL/Npgsql, InitialCreate, CRUD | Migracje na świeżym PostgreSQL w testach; create/read/update/delete API |
| 4 Usługi/DI | IProjectService, ITaskService, ICommentService, IHolidayClient; Scoped, constructor injection, DomainRules | Cienkie kontrolery; unit doradcy; brak ogólnego Repository |
| 5 API | Kontrolery CRUD i dwa GET Minimal API /api/compare/tasks | Swagger, integracyjne CRUD/filtry/statusy |
| 6 Auth | Identity cookie, CSRF, JWT, Student/Admin, sub, CanCreateProjects | Prawdziwy JWT, 401/403, izolacja projektów i Admin bez obejścia |
| 7 Błędy | GlobalExceptionHandler, ApiProblems, RequestTrace, structured logging | 400/404/409/500 i równość traceId odpowiedź/nagłówek |
| 8 Integracja | Typed NagerHolidayClient jako Adapter, własne DTO, timeout i anulowanie, Stub | Unit błędów dostawcy, niepoprawny JSON, Live/Stub i osobne żądanie doradcy |
| 9 Testy | xUnit, fake klienta i czasu, WebApplicationFactory/Testcontainers, Playwright | Jedno polecenie dotnet test, pełny scripts/verify.mjs --e2e |
| 10 Jakość | QUALITY.md: rzeczywisty baseline, 5 problemów, 3 naprawy i Extract Class | Wyniki przed/po, analyzer, nullable/warnings i review |
| 11 Docker/CI | Dockerfile multi-stage, .dockerignore, Compose migrate, GitHub Actions | Budowa/start/smoke/E2E i kontrolowany failed test → failed CI → naprawa |
| 12 Obrona | README, AI_REGISTER, KNOWN_ISSUES, DEMO, DEFENSE i prezentacja | Przećwiczenie scenariusza i komplet materiałów do Moodle |

## Trzy zapytania LINQ i tracking

1. ProjectService.ListAsync: tylko dostępne projekty, sortowanie i agregaty postępu w projekcji.
2. TaskService.ListAsync: członkostwo, projectId/status/assignedUserId oraz projekcja DTO.
3. CommentService.ListAsync: dostęp do zadania, sortowanie komentarzy i projekcja autora.

Odczyty używają AsNoTracking. Zapis korzysta z tracked encji i SaveChangesAsync. Queryable jest materializowany asynchronicznie po filtrowaniu. Migracje są przechowywane razem z modelem.

## SRP, DIP i Adapter

Kontroler obsługuje HTTP, usługa przypadek użycia, DomainRules regułę, a klient integracyjny protokół dostawcy. Kontrolery zależą od interfejsów usług; DeadlineAdvisor zależy od IHolidayClient. Scoped odpowiada cyklowi życia DbContext. Repository nie dodano, ponieważ nie wnosi tu osobnej odpowiedzialności. Adapter oddziela DTO Nager od PublicHoliday aplikacji.

## Historia i autorstwo

Historia rejestruje rzeczywistą pracę bieżącej implementacji; części backendu rozwijano wspólnie dla spójnego kontraktu, więc jeden PR może obejmować kilka tematów. Nie rekonstruowano fikcyjnej wcześniejszej historii ani nie pogarszano kodu na potrzeby refaktoryzacji. Przeglądy AI są tak oznaczane; finalny obowiązek rozumienia i oddania należy do autora.
