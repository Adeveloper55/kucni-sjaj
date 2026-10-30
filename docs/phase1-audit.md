# Faza 1 — završni audit

## Potvrđene provere

- `npm run check`: četiri javna HTML dokumenta, 24 direktno povezana CSS/JS fajla; postoje svi aktivni resursi i anchor-i, jedinstveni ID-jevi, jedan H1 po dokumentu i labels za sva polja. `index.html` i `index-5.html` su identični.
- `node --check`: prilagođeni frontend JS, slider konfiguracija i server/configure skripte prolaze sintaksnu proveru.
- HTTP: homepage, pravna obaveštenja i robots.txt vraćaju 200; `.template-backup/index-5.html` vraća 404. Server ostaje na loopback-u i ne objavljuje dokumentaciju, rezervnu kopiju ili skripte.
- Browser: nema prijavljenih console error-a; originalni Revolution slider se inicijalizuje, fotografije se menjaju i ručne komande/pauza rade. Sticky header menja stanje pri skrolovanju.
- Mobilni meni se otvara/zatvara, sadrži sedam relevantnih linkova; zatvara se pri izboru linka. Dodati Escape, zadržavanje fokusa u otvorenom meniju i vraćanje fokusa.
- Bootstrap FAQ otvara izabrani odgovor i zatvara prethodni; provereno stanje `aria-expanded` i prikaz odgovora.
- CTA za generalno čišćenje postavlja odgovarajuću vrednost u formi. Linkovi vode na stvarne sekcije ili postojeća pravna obaveštenja.
- Forma: prazna obavezna polja daju tri jasne greške; neispravan telefon, email, negativna površina, decimalni broj prostorija i prošli datum daju odgovarajuće greške. Fokus odlazi na prvo neispravno polje.
- Ispravni sintetički test unosi prikazuju stanje `prepared`, tekst upita za kopiranje i jasno obaveštenje **nije poslat / termin nije rezervisan**. Nijedan upit nije poslat. Test unosi uklonjeni osvežavanjem stranice.
- Dostava i budući success/error API tok nisu testirani sa pravim backend-om: endpoint nije konfigurisan niti napravljen. UI za te odgovore postoji, ali nije predstavljena potvrda funkcionalnog slanja.
- Hero nije lazy-loaded; prva slika ima preload; slike ispod hero sekcije su lazy sa dimenzijama. Tri hero fotografije i dve prateće slike imaju lokalne WebP kopije. Roboto je lokalizovan; nema aktivne skripte za podršku/kupovinu template-a niti društvenih demo linkova.

## Responsive merenja u browseru

| Širina viewport-a | Horizontalni overflow | Hero tekst unutar hero sekcije | Neispravne učitane slike | Mobilni CTA |
|---|---|---|---|---|
| 375 | nema | da | 0 | uključen |
| 390 | nema | da | 0 | uključen |
| 430 | nema | da | 0 | uključen |
| 768 | nema | da | 0 | isključen |
| 1024 | nema | da | 0 | isključen |
| 1440 | nema | da | 0 | isključen |
| 1920 | nema | da | 0 | isključen |

Mobilni CTA ima safe-area padding i rezervisan prostor u dokumentu. Skriva se dok korisnik uređuje polja forme ili dok je mobilni meni otvoren. Proverena je simulirana širina browsera; pravi iOS/Android softverski tastaturni i safe-area uslovi nisu provereni na fizičkom uređaju.

## Uklonjeno iz javnog sajta

Demo navigacija, shop/payment/login, blog, lažne cene, recenzije i portfolio rezultati, lažni telefon/adresa, Lorem Ipsum, autorov buy/support dodatak i spoljni demo društveni linkovi. Originalne demo stranice ostaju u rezervnoj kopiji; vendor source komentari i biblioteke nisu brisani.

## Preostalo za naredni korak

1. Konačan naziv firme, pravi kontakt kanali i potvrda poslovnih pravila/termina/sredstava.
2. Potvrđen cenovnik; struktura `#pricing-options` spremna je za budući kalkulator.
3. Stvarni backend/email servis za booking, validacija na serveru i provera stvarne isporuke pre aktiviranja.
4. Konačni pravni tekstovi i podaci pružaoca usluge; postojeće pravne stranice su obeležene kao priprema.
5. Produkcioni HTTPS domen za canonical/OG/sitemap. `npm run configure` generiše ih tek kada postoji potvrđen `SITE_URL`. Lokalna priprema se ne indeksira.
6. Stvarne fotografije pre/posle i prave recenzije pre aktiviranja inertnih komponenti. Testimonials/Owl nije prikazan niti inicijalizovan jer nema potvrđenog sadržaja.
7. LocalBusiness JSON-LD sadrži samo poznato ime, Beograd i usluge; nema izmišljenih polja i ne predstavlja kompletan Google rich-result profil.

Neaktivni izvorni CSS sadrži stare URL-ove za loading.GIF, star.svg i .cur kursore. Nisu korišćeni aktivnim DOM-om; browser provera nije prijavila neuspešno učitavanje za njih. Namerno se ne prepisuje čitav vendor stylesheet zbog neaktivnih demo selektora. Formalan Lighthouse/CLS audit nije pokrenut; dimenzije slika i rezervisana hero visina dodate su radi stabilnosti layouta.
