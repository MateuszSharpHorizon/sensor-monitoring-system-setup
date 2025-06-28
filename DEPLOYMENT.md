# Instrukcja wdrożenia systemu monitorowania czujników

## 1. Instalacja systemu operacyjnego

1. Pobierz obraz Debian 12.11.0 ze strony:
   https://www.debian.org/releases/stable/

2. Utwórz bootowalny pendrive używając Rufus lub balenaEtcher

3. Podczas instalacji:
   - Wybierz język: Polski
   - Wybierz środowisko graficzne: LXDE
   - Ustaw nazwę hosta: signal-monitor
   - Utwórz użytkownika:
     - Nazwa: sh
     - Hasło: 12345678@q

## 2. Konfiguracja sieci

1. Zaloguj się do systemu jako użytkownik 'sh'

2. Otwórz terminal i edytuj plik konfiguracji sieci:
```bash
sudo nano /etc/network/interfaces
```

3. Dodaj konfigurację statycznego IP:
```
auto eth0
iface eth0 inet static
    address 10.0.0.10
    netmask 255.255.255.0
    gateway 10.0.0.1
```

4. Zapisz plik (Ctrl+O, Enter) i wyjdź (Ctrl+X)

5. Zrestartuj sieć:
```bash
sudo systemctl restart networking
```

## 3. Instalacja zależności

1. Zaktualizuj system:
```bash
sudo apt update
sudo apt upgrade -y
```

2. Zainstaluj wymagane pakiety:
```bash
sudo apt install -y git nodejs npm chromium
```

## 4. Instalacja aplikacji

1. Sklonuj repozytorium:
```bash
cd /home/sh
git clone https://github.com/MateuszSharpHorizon/sensor-monitoring-system-setup.git
cd sensor-monitoring-system-setup
```

2. Zainstaluj zależności Node.js:
```bash
npm install
```

3. Zbuduj aplikację:
```bash
npm run build
```

## 5. Konfiguracja trybu kiosk

1. Utwórz skrypt startowy:
```bash
nano /home/sh/start-kiosk.sh
```

2. Dodaj zawartość:
```bash
#!/bin/bash

# Uruchom backend
cd /home/sh/sensor-monitoring-system-setup
npm run backend &

# Poczekaj na uruchomienie backendu
sleep 5

# Uruchom frontend
npm run frontend &

# Poczekaj na uruchomienie frontendu
sleep 10

# Uruchom przeglądarkę w trybie kiosk
chromium --kiosk --disable-restore-session-state http://localhost:8000
```

3. Nadaj uprawnienia wykonywania:
```bash
chmod +x /home/sh/start-kiosk.sh
```

## 6. Konfiguracja autostartu

1. Utwórz katalog autostartu:
```bash
mkdir -p /home/sh/.config/lxsession/LXDE
```

2. Utwórz plik autostartu:
```bash
nano /home/sh/.config/lxsession/LXDE/autostart
```

3. Dodaj zawartość:
```
@/home/sh/start-kiosk.sh
```

## 7. Konfiguracja urządzeń RDI

1. Skonfiguruj RDI-A:
   - IP: 10.0.0.11
   - Port: 3003

2. Skonfiguruj RDI-D:
   - IP: 10.0.0.12
   - Port: 3004

## 8. Pierwsze uruchomienie

1. Zrestartuj komputer:
```bash
sudo reboot
```

2. System powinien:
   - Uruchomić się automatycznie
   - Zalogować użytkownika 'sh'
   - Uruchomić backend i frontend
   - Otworzyć przeglądarkę w trybie kiosk

## 9. Weryfikacja

1. Sprawdź czy:
   - Backend nasłuchuje na portach UDP (3003, 3004)
   - Frontend jest dostępny na porcie 8000
   - Dane z czujników są wyświetlane
   - Konfiguracja jest dostępna po podaniu hasła (12345678@q)

## 10. Rozwiązywanie problemów

1. Jeśli backend nie uruchamia się:
```bash
cd /home/sh/sensor-monitoring-system-setup
npm run backend
```
Sprawdź logi błędów w terminalu

2. Jeśli frontend nie uruchamia się:
```bash
cd /home/sh/sensor-monitoring-system-setup
npm run frontend
```
Sprawdź logi błędów w terminalu

3. Jeśli przeglądarka nie uruchamia się w trybie kiosk:
```bash
chromium --kiosk http://localhost:8000
```

4. Sprawdź logi systemowe:
```bash
journalctl -xe
```

## 11. Konfiguracja ThingSpeak

1. Kanały ThingSpeak są już skonfigurowane:
   - Kanał 1: Ciśnienie Oleju (AN00)
   - Kanał 2: Temperatura Płynu (AN01)
   - Kanał 3: Alarm Ciśnienia (DI00)
   - Kanał 4: Alarm Temperatury (DI01)
   - Kanał 5: Alarm Prądnicy (DI02)
   - Kanał 6: Stan cewki gaszącej (DI03)
   - API Key: 296327WRNNJAANKD

2. Dane będą wysyłane automatycznie dla sygnałów z zaznaczonym "ptaszkiem" w konfiguracji

## 12. Backup i przywracanie

1. Wykonaj backup konfiguracji:
```bash
cd /home/sh/sensor-monitoring-system-setup
tar -czf backup.tar.gz .env config/* 
```

2. Przywróć backup:
```bash
cd /home/sh/sensor-monitoring-system-setup
tar -xzf backup.tar.gz
```

## 13. Aktualizacje

1. Sprawdź dostępne aktualizacje systemu:
```bash
sudo apt update
sudo apt list --upgradable
```

2. Zainstaluj aktualizacje:
```bash
sudo apt upgrade -y
```

3. Zrestartuj system po ważnych aktualizacjach:
```bash
sudo reboot
```

## Kontakt

W razie problemów z wdrożeniem, prosimy o kontakt z działem wsparcia technicznego.
