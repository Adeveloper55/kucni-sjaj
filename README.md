# Čisto Dom — višestranični sajt

Sajt za čišćenje stanova i kuća u Beogradu. Postojeći HTML/CSS/JS/Bootstrap projekat, zasnovan na originalnom `index-5.html`. Bez promene frameworka i bez backend-a.

## Pokretanje

Potreban je Node.js 18 ili noviji. Nema dodatnih paketa za instalaciju.

```sh
npm run dev
```

Otvori http://127.0.0.1:3000. `/`, `/index.html` i `/index-5.html` otvaraju novu početnu. Ako je server već pokrenut u pozadini, koristi postojeći URL. Pokrenuti foreground server zaustavlja se sa Ctrl+C; drugi port zadaje se kroz `PORT`.

## Organizacija

- Javne stranice: `index-5.html` / `index.html` (Početna), `usluge.html`, `cenovnik.html`, `kako-funkcionise.html`, `o-nama.html`, `faq.html`, `kontakt.html`. Svaka stavka menija otvara stvarni zasebni HTML dokument.
- `content/`: HTML sadržaj pojedinačnih stranica. `partials/`: zajednički head, header, footer, skripte i schema. `pages.json`: redosled menija i jedinstveni SEO naslov/opis svake stranice. Ovde se uređuje sadržaj; `npm run build` ili `npm run configure` regeneriše javne HTML fajlove. Nema runtime templating-a niti frameworka. `npm run dev` / `npm start` automatski pokreću ovu pripremu.
- `css/custom.css`: naše dopune, responsive pravila i focus stanja. Izvorni stilovi i Bootstrap nisu prepisivani.
- `js/custom.js`: aktivni meni, focus trap/Escape, sticky header i scroll. Aktivna stavka se postavlja statički za svaku stranicu; stari homepage hash linkovi preusmeravaju na nove stranice.
- `js/hero-comparison.js`: dva para pre/posle. Prljavo stanje 2 sekunde, otkrivanje čiste slike 1,4 sekunde, čisto stanje 2,6 sekundi, pa sledeći prostor. Automatski prikaz bez vidljivih kontrola i oznaka; reduced motion i zaustavljanje van viewport-a/skrivenog taba. Originalni Revolution fajlovi su sačuvani, ali se više ne učitavaju.
- `js/site.config.js`: jedino mesto za brend, kontakt kanale, budući endpoint i domen.
- `js/site.js`: prikaz konfiguracije i validacija/priprema upita. Podaci forme se ne čuvaju. Google Ads merenje i pristanak opisani su u odeljku ispod.
- `politika-privatnosti.html`, `uslovi-koriscenja.html`: jasno označena obaveštenja/nacrti, `noindex`; nisu konačni pravni dokumenti.
- `fonts/roboto`, `css/fonts.css`: lokalni Roboto; ikonice ostaju iz template-a. Nema Google Fonts zahteva u aktivnoj stranici.
- `.template-backup/`: originalni demo HTML i originalni izmenjeni JS, kao i jednokratne skripte. Nije javna ruta. Ne objavljivati ovaj folder na statičkom hostingu.
- `docs/phase1-analysis.md`, `docs/phase1-audit.md`: analiza, potvrđene provere i preostali koraci.

## Poslovni podaci

U `js/site.config.js` zameni `brand`, `PHONE_NUMBER`, `WHATSAPP_NUMBER`, `VIBER_NUMBER`, `EMAIL_ADDRESS` i tek po potvrdi `SITE_URL`. Ne unositi demo podatke. Nepopunjeni kontakt kanali prikazani su kao nedostupni. Kada se unesu pravi brojevi, `site.js` aktivira tel/WhatsApp/Viber/email linkove. Nigde nije uneta adresa, PIB, radno vreme, statistika ili izmišljena cena.

Posle konfiguracije pokreni:

```sh
npm run configure
npm run check
```

`configure` sastavlja sve javne stranice, sinhronizuje brend u HTML-u i JSON-LD-u, homepage alias i zasebni canonical/OG za svaki dokument. Uz potvrđen HTTPS `SITE_URL` kreira stvarni `sitemap.xml` sa svih sedam glavnih stranica i odgovarajući robots.txt. Bez domena robots.txt blokira indeksiranje lokalne pripreme; sitemap ostaje dokumentovana struktura u `sitemap.template.xml`, bez izmišljenog domena. Pravni nacrti ne ulaze u sitemap.

## Forma i buduće slanje

Trenutno `BOOKING_ENDPOINT: null`. Dugme **Pripremi upit** proverava podatke i kreira tekst koji korisnik može kopirati. Jasno piše da upit nije poslat i termin nije rezervisan. Podaci ostaju u memoriji otvorene stranice i nestaju posle osvežavanja. Bez JavaScript-a fieldset je isključen i prikazano je obaveštenje.

Budući stvarni backend povezuje se preko istog origin-a, putanjom `/api/…`. Mora validirati sva polja na serveru i potvrditi stvarni prijem/slanje. Frontend POST šalje JSON sa ključevima `fullName`, `phone`, `email`, `service`, `area`, `rooms`, `date`, `time`, `location`, `message`. Success stanje prikazuje se **samo** za HTTP 2xx i JSON `{ "success": true }`. Ostali odgovori, neispravan JSON, mrežna greška ili timeout daju poruku da upit nije poslat, uz očuvane unose. Zaštita od duplog klika i timeout su pripremljeni. Ovaj lokalni statički server ne implementira `/api/` i ne obrađuje poruke.

Pre aktiviranja slanja završiti poslovne/pravne podatke, pravila obrade i stvarno email/backend povezivanje. Endpoint, API ključeve i tajne ne izlagati u browser konfiguraciji; ključevi ostaju na budućem serveru.

## Sadržaj i sačuvane komponente

Početna ima hero sa ilustrativnim parovima pre/posle, trust strip, tri servisne kartice i CTA; puna lista šest usluga je na zasebnoj stranici Usluge. Cenovnik, Kako funkcioniše, O nama, FAQ i Kontakt imaju zasebne stranice sa zajedničkim menijem/footerom. Kontakt sadrži booking formu. CTA prenosi uslugu kroz `kontakt.html?usluga=generalno#zakazivanje` (ili drugi dozvoljeni ključ); kontakt podaci posetioca se ne prenose kroz URL. Sve stranice mogu se direktno otvoriti i osvežiti.

Testimonial i pre/posle komponente su sačuvane u `partials/future-components.html` kao inertni `<template>` elementi bez demo recenzija i lažnih radova. Kada stignu pravi podaci, mogu se aktivirati; Owl i galerijske biblioteke ostaju sačuvane u projektu ali se sada ne učitavaju. Namenski hero-comparison JS se učitava samo na početnoj; Revolution ostaje sačuvan bez učitavanja.

Originalna one-page verzija ove faze sačuvana je u `.template-backup/phase1-onepage.html`. Novi audit i responsive rezultati su u `docs/multipage-audit.md` i `docs/multipage-results.json`; prethodni phase1 izveštaji predstavljaju stanje pre podele.

Shop, payment, login, blog, društveni demo linkovi, podrška/kupovina autora template-a i ogromni demo meniji uklonjeni su iz javnog sajta. Izvorni vendor copyright komentari nisu uklanjani. Pre prvog javnog objavljivanja obezbediti odgovarajuće pravo korišćenja preuzetog template-a i fotografija.

`npm run check` koristi Python 3 za audit strukture, linkova i resursa; za svakodnevno pokretanje dovoljan je Node. Jednokratna priprema WebP slika koristila je Pillow; nije runtime zavisnost. Originalni izvor: https://clean360-html.vercel.app/index-5.html.

Hero slike, tačni Imagegen promptovi i provera prelaza dokumentovani su u `docs/hero-images.md`.

Potvrđene početne cene i obim usluga uneti su po dostavljenom cenovniku u `content/cenovnik.html`. Ovaj fajl je izvor za izmene cena; nakon izmena pokrenuti `npm run build`. Cenovnik uključuje pet glavnih usluga, šest dodatnih, minimalne iznose i redovno održavanje. Kalkulator se ne obračunava automatski.


## Telefonska dugmad i Google Ads (4. novembar 2026.)

Aktuelni broj je `+381603273705` (060 327 3705), za poziv, WhatsApp i Viber.
`configure-site.mjs` povezuje telefonske linkove sa brojem iz konfiguracije, zadržava otvaranje stranica usluga preko dugmeta „Zatraži procenu” na karticama i dodaje stalno dugme za poziv na svih 26 stranica. Linkovi rade bez JavaScript-a.

U Google Ads nalogu Pametna Rešenja kreirana je akcija **Čišćenje Beograd – klik na telefon 0603273705**, ID `7889149877`, odredište `AW-18482209563/D1l5CLW_67EdEJvGgO1E`. Kategorija Contact, brojanje One, bez novčane vrednosti. Privremeno je Secondary i nije uključena u account-level goals, kako ne bi uticala na postojeće kampanje. Za buduću kampanju čišćenja treba zasebno izabrati odgovarajući cilj i optimizaciju. Nijedna kampanja nije kreirana niti pokrenuta ovim izmenama.

`js/phone-conversion.js` meri samo klik na `tel:` link za podešeni broj; ne učitavanje stranice, otvaranje formulara ili potvrđen razgovor. Google tag se učitava samo na HTTPS produkcionom domenu iz `SITE_URL` i tek nakon pristanka. Odbijanje ne ometa pozive. Pristanak se može promeniti u podnožju i čuva se do 180 dana. Personalizacija i enhanced conversions su isključeni. Lokalni razvoj ne šalje Google događaje.

Provere: `npm run check` i `node scripts/test-phone-conversion.mjs` (simulacija pristanka i događaja, bez mrežnih poziva). Provereno 119 telefonskih CTA/linkova na 26 stranica. Google Ads potvrda je `docs/google-ads-phone-conversion.png`.

Izmene su pripremljene lokalno. Pre korišćenja u kampanji objaviti generisane HTML fajlove, `css/custom.css` i JS fajlove zajedno, zatim proveriti Google tag i stvarno merenje na javnom domenu. Status kreirane akcije pri pripremi: Awaiting conversions.
