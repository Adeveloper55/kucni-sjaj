# Mirnija paleta i providna hero podela

- Sačuvana je postojeća podela hero-a na tri dijagonalna dela. Fotografija se sada vidi ispod sva tri dela.
- Levo: tamnoplavi sloj `rgba(16, 43, 60, .78)`. Desno: tamni zlatni sloj `rgba(157, 116, 42, .58)`. Srednji deo ostaje bez toniranog sloja. Ovo su stalni providni slojevi, ne efekat koji zavisi od miša, pa isti prikaz postoji i na telefonu.
- Uklonjeni su panel Pre/Posle, naziv prostora, vidljiva oznaka AI slika, pauza i strelice. Ostaje dostupni opis AI ilustracije i prethodna dokumentacija o poreklu slika. Nema tvrdnje da slike prikazuju stvarne radove firme.
- Automatski ciklus sa dva para slika ostaje: 2 s prljavo, 1,4 s otkrivanje čistog, 2,6 s čisto, pa drugi prostor. JS više ne traži uklonjene kontrole. Reduced-motion i zaustavljanje u skrivenom tabu/van prikaza ostaju.
- Cela lokacija koristi teget `#173344`, plavosivu `#365b6d`, prigušenu zlatnu `#d2b57a`, toplu belu `#fcfbf8` i mirne neutralne tonove. Usklađeni su meni, CTA, servisne ikone, kartice, koraci, FAQ, footer, kontakt i unutrašnji naslovi.
- Paleta je centralizovana u `css/custom.css` preko `--dom-*` promenljivih. Aktivni skin koristi iste promenljive. Prethodni stilovi i hero HTML su sačuvani u `.template-backup`.

Provera: build, audit linkova/resursa i JS sintaksa prolaze. Browser je potvrdio obe RGBA providnosti, nula uklonjenih kontrola u DOM-u i automatsku promenu para. Sve glavne stranice proverene su na 375, 390, 430, 768, 1024, 1440 i 1920px: 49 kombinacija bez horizontalnog skrola, neispravnih učitanih slika i grešaka u konzoli. Rezultati su u `premium-palette-results.json`.
