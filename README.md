# HooDPlaka67 Preisstudio

Ein lokales Programm für Textilien, Aufkleber, Veredelungen und weitere Artikel. Version 1.0 bildet Produktpflege, Preiskalkulation, Kundenverwaltung, Angebote und Kundenausgaben ab. Textilienpreise, Motivaufpreise und Aufkleber-Mengenpreise sind hinterlegt.

## Starten

**HooDPlaka67 starten.cmd** doppelklicken. Das Programm öffnet sich im Browser unter http://127.0.0.1:6767. Node.js ab Version 22 wird benötigt und ist auf diesem Computer bereits vorhanden. Es sind keine zusätzlichen Pakete nötig. Bei erneutem Start wird der laufende Server weiterverwendet. Der Hintergrundprozess endet spätestens beim Herunterfahren von Windows. Alternativ `npm start` im Ordner verwenden und mit Strg+C beenden.

## Erste Schritte

1. Unter **Einstellungen** Firmendaten, Stundensatz und den tatsächlich verwendeten Umsatzsteuersatz ergänzen. Ein leeres Steuerfeld bedeutet „offen“, 0 bedeutet „ohne Umsatzsteuer“. Ein passender Steuerhinweis kann selbst eingetragen werden.
2. Unter **Produkte & Preise** Artikel, Varianten, Lieferanten und Kosten pflegen. Die hinterlegten Textilien und Motivaufpreise sind bereits als Produkte vorhanden. Änderungen ihres Verkaufspreises werden in die Textilienliste übernommen.
3. Unter **Kalkulator** ein Produkt auswählen und rechnen. Anschließend die Kalkulation ins Produkt übernehmen. Ein abweichender Stundensatz im Kalkulator dient nur zur Vorschau; dauerhaft wird er unter Einstellungen geändert.
4. Kunden anlegen und Angebote erstellen. Positionen können aus dem Sortiment übernommen oder frei eingetragen werden. Mengen, Rabatt, Steuersatz, Gültigkeit und Status sind bearbeitbar.
5. Angebote öffnen und über **Drucken / PDF** die Druckfunktion des Browsers verwenden. Dort „Als PDF speichern“ auswählen. Die Steuer muss vorher festgelegt sein. Prüfe Firmendaten, Inhalte und Druckvorschau vor dem Versand.
6. Produkte einzeln für die **Kundenansicht** freigeben. Sichtbar sind nur Artikel mit bekanntem Verkaufspreis und Steuersatz. Diese Ansicht und ihr Ausdruck enthalten keine Einkaufsdaten oder internen Notizen.

## Rechnungen

- **Komplette Rechnung**: Kundenauswahl, Rechnungs- und Leistungsdatum, Zahlungsziel, Positionen, Rabatt, Umsatzsteuer, Zahlungsstatus und PDF-Druck. Ein Angebot kann als Grundlage übernommen werden. Absender, Anschrift sowie Steuer- und Bankangaben werden unter Einstellungen gepflegt.
- **Einfache Rechnung**: persönlicher interner Beleg mit Nummer, Datum, Artikel, Menge, Preis und Notiz. Diese Variante hat keinen Status, keine Betragsgrenze und keine gesetzliche Vollständigkeitsprüfung. Nach dem Speichern kann sie direkt als PNG-Bild heruntergeladen werden.
- Rechnungen speichern Preise, Kunden- und Absenderdaten als Momentaufnahme. Spätere Änderungen verändern bestehende Rechnungen nicht.
- Das Modul erzeugt druckbare PDFs, keine strukturierten E-Rechnungen.

Die Kundenansicht ist eine lokale Präsentations- und Druckansicht, kein geschütztes Kundenkonto. Für Kunden nur die erzeugte PDF weitergeben. Die lokale Adresse funktioniert nur auf diesem Computer. Ein geschütztes Kundenportal, Lagerverwaltung und automatisierte Preislistenimporte sind noch nicht enthalten.

## So wird gerechnet

Alle Eingaben für EK, weitere Kosten und eigenen VK sind netto und gelten pro angegebener Einheit. Unterschiedliche Größen oder Ausführungen können als eigene Produkte geführt werden. Bei Aufklebern kann die Einheit z. B. Stück, Bogen oder m² sein; die Kosten müssen sich auf dieselbe Einheit beziehen.

- Gesamtkosten = EK + Veredelung + Minuten / 60 × Stundensatz + Verpackung + weitere Kosten.
- Berechneter VK netto = Gesamtkosten × (1 + Aufschlag / 100).
- Ein eigener VK netto überschreibt diesen Vorschlag.
- Ertrag pro Einheit = VK netto − Gesamtkosten; Marge = Ertrag / VK netto × 100.
- VK brutto = VK netto × (1 + Umsatzsteuersatz / 100).

Fehlende Kosten bleiben **offen**. Eine bewusst eingetragene 0 bedeutet, dass hier keine Kosten anfallen. Ein eigener VK kann auch bei unbekannten Kosten festgelegt werden; Ertrag und Marge bleiben dann offen. Negative Erträge werden im Kalkulator angezeigt. Die Marge bei VK 0 ist nicht definiert.

Angebote speichern Positionen, Einzelpreise, Steuersatz, Kundendaten und Firmendaten als Momentaufnahme. Spätere Produkt- und Einstellungsänderungen verändern bestehende Angebote nicht automatisch. Beim Bearbeiten eines Angebots werden Daten des ausgewählten vorhandenen Kunden aktualisiert. Geldbeträge werden auf Cent gerundet: zuerst Positionssummen, dann Rabatt auf die Nettosumme, dann Steuer auf den rabattierten Nettobetrag.

## Speicherung & Sicherungen

- Aktuelle Daten: `data/hoodplaka67.json`.
- Vor jeder Speicherung wird die vorherige Version unter `data/backups/` gesichert. Die Sicherungen werden nicht automatisch gelöscht.
- **Private Sicherung exportieren** lädt alle Daten als JSON herunter, einschließlich EK, Kalkulationen, Kunden und Angeboten. Diese Datei privat aufbewahren und regelmäßig extern sichern.
- **Öffentliche VK-Preise exportieren** erzeugt eine getrennte JSON-Datei ohne EK, Kosten, Margen, Lieferanten, Kunden, Angebote und private Kontaktdaten. Nur diese Datei ist für eine spätere öffentliche Webseite vorgesehen.
- **Sicherung einlesen** prüft das Format und ersetzt nach Bestätigung den aktuellen Bestand. Die vorherigen Daten werden zusätzlich automatisch gesichert.
- Bei einer beschädigten Datendatei startet das Programm nicht und überschreibt nichts. Vor einer manuellen Wiederherstellung das Programm beenden, die beschädigte Datei aufbewahren und eine geprüfte Sicherung als `data/hoodplaka67.json` einsetzen.
- Mehrere offene Fenster können Änderungen nicht still gegenseitig überschreiben: Bei einer veralteten Datenversion wird die Speicherung abgelehnt. Danach neu laden und die Änderung erneut durchführen.
- Der Server ist ausschließlich an 127.0.0.1 gebunden und verwendet keine externen Dienste, Schriften oder Trackingfunktionen.

## Entwicklung

`npm run build` prüft die JavaScript-Syntax. `npm test` prüft Preisberechnungen, Datenvalidierung, lokale API, Speicherung, Konflikte und Neustart. Die Tests verwenden eigene temporäre Daten, nicht den echten Bestand. Es gibt keinen Paketdownload und keinen separaten Kompilierungsschritt.

Optional wird in unterstützenden Browsern das rein lesende WebMCP-Werkzeug `read_product_prices` registriert. Dafür stand hier kein unterstützender Prüfkontext zur Verfügung; die Registrierung ist nicht browserseitig verifiziert. Die Kernabläufe wurden mit Chromium/Edge und WebKit automatisiert geprüft, einschließlich Ansichten mit 320, 390 und 1440 Pixel Breite. Dies ersetzt keinen Test auf einem physischen iPhone.

## Online-Version und Preislistenexport

Die vollständige App ist unter https://jaso081529.github.io/HP67-Preis-Kalkulator/ erreichbar. Private Eingaben bleiben im Browserspeicher dieses Geräts; sie werden nicht zu GitHub hochgeladen und nicht automatisch zwischen Geräten oder mit dem lokalen Programm synchronisiert. Zur Übertragung die private Sicherung exportieren und auf dem Zielgerät importieren.

Vor einem Import bewahrt die Online-Version den vorherigen Stand im Browserspeicher auf. Unter Einstellungen lässt er sich mit **Stand vor letztem Import herunterladen** sichern und bei Bedarf wieder importieren. Es bleibt jeweils die letzte Sicherung vor einem Import erhalten. Wenn nicht genug Speicher verfügbar ist, wird der Import abgebrochen. Gleichzeitige Schreibzugriffe werden gesperrt, veraltete Fenster müssen neu geladen werden.

Textilien, Aufkleber oder beide Listen lassen sich als PNG exportieren. Die Bilder enthalten Motivaufpreise, Preisbasis und Mengenhinweise. Der PNG-Export verteilt die Liste auf hochauflösende Seiten mit jeweils 2.400 × 3.394 Pixeln. Seiten können einzeln als PNG oder gemeinsam als ZIP gespeichert werden. Zusätzlich steht eine SVG-Datei der gesamten gewählten Liste bereit: Die vektorbasierte Schrift bleibt auch bei starkem Zoom scharf. Lange Texte werden umgebrochen. Heruntergeladene Druckdateien enthalten die Gestaltung und funktionieren auch ohne Internetverbindung.

Die Aufkleber-Preisart bleibt zunächst **Netto / Brutto noch ungeklärt**. Nach Klärung lässt sie sich unter Einstellungen festlegen. Nur bestätigte Verkaufspreise stehen in Angeboten und Rechnungen zur Auswahl; Bruttopreise werden mit dem Steuersatz des jeweiligen Belegs in netto umgerechnet. Einkaufs-Preislisten erscheinen nicht im öffentlichen JSON-Export. Bereits gespeicherte Belege behalten ihre Beträge.

## Zusätzliche Browserprüfung

Nach `npm run build:public` führt `npm run test:browser` die Kernabläufe mit einer isolierten Testdatenbasis aus. Dafür wird Playwright benötigt; `HP67_PLAYWRIGHT` kann auf eine vorhandene Installation zeigen. Standardmäßig wird der installierte Edge-Browser verwendet; mit `HP67_BROWSER=webkit` wird eine vorhandene Playwright-WebKit-Installation verwendet. Ergebnisse liegen im ignorierten Ordner `data/qa`. Die GitHub-Veröffentlichung führt vor jedem Upload die automatisierten Tests und Syntaxprüfungen aus.
