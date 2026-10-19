# Telemetria sesji ucznia

Ten projekt wysyła appId=databases do kolejki java-lab.activity przez endpointy tego samego originu /api/telemetry/session i /api/telemetry/events. Serwer i klient korzystają z kontraktu shared/telemetry/schema.js zgodnego z Java Lab i Lab Admin.

Włącz VITE_TELEMETRY_ENABLED=true i uzupełnij serwerowe TELEMETRY_TOKEN_SECRET (min. 32 znaki), TELEMETRY_ALLOWED_ORIGINS (dokładny origin lokalny lub produkcyjny) oraz RABBITMQ_HTTP_URL, RABBITMQ_USERNAME i RABBITMQ_PASSWORD. Hasła nie mogą mieć prefiksu VITE_. Vite obsługuje lokalne endpointy przez server/telemetryPlugin.js; produkcja Vercel korzysta z api/telemetry/*.js. Lokalna konfiguracja jest w ignorowanym .env.local. Produkcja jest wdrażana z głównej gałęzi GitHuba.

Snapshot: na starcie, zmianie zadania, uruchomieniu i co 30 s po zmianie kodu. Heartbeat co 15 s aktualizuje obecność. Bufor 20 zdarzeń w RAM; zamknięcie karty traci niewysłane dane. Przy przepełnieniu jest wpis o luce historii; błąd sieci nie blokuje edytora.

Pole nazwy ucznia jest opcjonalne, do 80 znaków, zapamiętywane lokalnie. ID identyfikuje instalację przeglądarki, a nie sprzęt. Kod i nazwa są udostępniane nauczycielowi, o czym informuje pasek boczny.

SQL jest plikiem query.sql. Wynik zawiera status, kolumny, liczbę wierszy i komunikaty; nie wysyłamy zwróconych rekordów ani konfiguracji connectora. Trening SQL ma osobną sesję, z tym samym ID instalacji.

Historia jest przechowywana w SQLite panelu 14 dni, z limitem 500 MiB treści. RabbitMQ potwierdza odbiór dopiero po zapisie. Panel musi mieć trwały dysk.


Statystyki edycji: snapshot.editingActivity zawiera liczbę znaków wpisanych ręcznie, znaków wklejonych, liczbę i największy rozmiar wklejenia, akcje usuwania oraz tempo w znakach/min z ostatnich 60 sekund (na początku okno ma minimum 10 sekund). Liczniki dotyczą jednej sesji/karty i resetują się po jej ponownym otwarciu. Obejmują tylko edytory kodu; pola nazwy i wyszukiwania są pomijane. Dodatkowe metryki zawierają liczby i znaczniki czasu, bez treści schowka ani rejestru klawiszy. Autouzupełnianie, formatowanie i cofanie nie są liczone jako ręczne pisanie. Metryki są orientacyjne i raportowane przez klienta, nie służą do automatycznego ustalania autorstwa. Aktualizacja przez heartbeat co 15 s i zapisy/Play; stare sesje bez pomiaru mają editingActivity=null.
