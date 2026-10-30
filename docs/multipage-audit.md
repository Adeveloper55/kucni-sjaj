# Multi-page podela — završna provera

Postojeći sajt je razdvojen u sedam zasebnih statičkih stranica: Početna (`/`, `index.html`, `index-5.html`), `usluge.html`, `cenovnik.html`, `kako-funkcionise.html`, `o-nama.html`, `faq.html`, `kontakt.html`. Dve pravne stranice takođe koriste zajednički header/footer, ali ostaju označeni nacrti.

## Implementacija

- Originalni one-page sajt sačuvan u `.template-backup/phase1-onepage.html`.
- Postojeće HTML sekcije prenete su u `content/`; zajednički HTML i schema u `partials/`; metapodaci i meni definisani su u `pages.json`.
- `npm run build` / `npm run configure` generiše obične HTML dokumente. Nema novog frameworka, baze ili runtime template engine-a. Dev/start automatski pripremaju stranice.
- Početna je skraćena na hero slider, trust strip, tri servisne kartice i CTA ka Kontaktu. Puni sadržaj raspoređen je po odgovarajućim stranicama.
- Svi glavni meni linkovi, footer i CTA vode na stvarne dokumente. Aktivna stavka menija je statički označena sa `aria-current="page"`.
- Na unutrašnjim stranicama postoji H1 banner i breadcrumb. Svaka stranica ima poseban title/meta description. Canonical/OG i sitemap koriste pojedinačne putanje tek kada se konfiguriše pravi domen.
- Slider biblioteke učitavaju se samo na početnoj. Unutrašnje stranice nemaju greške zbog nepostojećeg slidera ili sekcija.
- CTA za uslugu vodi na Kontakt sa bezbednim ključem u `?usluga=`. Telefon, ime i drugi lični podaci nisu u URL-u.
- Stari homepage linkovi `/#o-nama`, `/#usluge`, itd. preusmeravaju na odgovarajuću novu stranicu kada je JavaScript uključen. Proveren je prelazak stare O nama adrese iz već otvorenog taba.

## Potvrđeni rezultati

- `npm run build`, `npm run check`, `node --check` za izmenjeni JS/server/build prolaze.
- Offline audit obuhvata svih 10 javnih HTML fajlova (homepage uključuje alias), linkove između dokumenata i fragmente, labels, jedinstvene ID-jeve, jedan H1, ispravan meni i odsustvo demo sadržaja.
- Kroz browser je kliknuto svih sedam stavki glavnog menija: svaka otvara traženi zasebni dokument sa ispravnim naslovom i aktivnom stavkom.
- Sve glavne stranice proverene na 375, 390, 430, 768, 1024, 1440 i 1920 px: **49 kombinacija, bez horizontalnog overflow-a, bez neispravnih učitanih slika i sa jednim H1**. Rezultati su u `multipage-results.json`.
- Nema prijavljenih console error-a tokom obilaska.
- Mobilni meni na 390px otvara sedam ispravnih linkova. Prelazak tastaturom na Kontakt menja dokument, zatvara meni i zadržava ispravnu aktivnu stavku.
- Generalno čišćenje sa stranice Usluge prenosi se u Kontakt select. Prazna forma tada traži ime i telefon; validni sintetički podaci daju `prepared`, bez lažnog slanja. Test unosi očišćeni navigacijom.
- FAQ odgovor na zasebnoj stranici otvara se kroz Bootstrap Collapse i menja `aria-expanded`.

## Granice provere

Backend nije konfigurisan: forma ostaje priprema/kopiranje upita i ne rezerviše termin. Stvarni kontakti, domen i pravni tekstovi ostaju raniji TODO. Pravi mobilni uređaji, isporuka emaila i produkcioni hosting nisu deo ove provere. Stari neaktivni vendor CSS URL-ovi navedeni u phase1 auditu ostaju neaktivni i ne predstavljaju pokvarene linkove u javnom sadržaju.
