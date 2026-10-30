# Pregled postojećeg projekta pre izmena

- Statički HTML/CSS/JS projekat, bez frameworka i bez npm zavisnosti. `scripts/serve.mjs` mapira `/` na `index-5.html`.
- `index-5.html` ima ugrađen header i footer; nisu zajednički partial fajlovi. Originalni demo ima preko 100 zasebnih HTML stranica.
- Izgled: `css/style.css`, `css/templete.css`, `css/skin/skin-4.css`; Bootstrap grid; `plugins/xmenu/css/xmenu.css` za navigaciju. `css/plugins.css` uvozi i nepotrebne demo dodatke.
- Ikonice/fontovi su lokalno u `plugins/fontawesome`, `flaticon`, `line-awesome`, `themify`. Tekstualni fontovi dolaze kroz Google Fonts import. Zadržava se Roboto.
- Hero: Revolution Slider, `#rev_slider_1083_1`, tri fotografije `slide10/11/12.jpg`, dijagonalne plavo-žute površine `.clean-shape-bx`, statični caption slojevi i `dz_rev_slider_5()`.
- Kartice: `.services-style-2`; benefiti/accordion: `.faq-area2`, `.faq-style2`, Bootstrap Collapse; cene: `.pricingtable-style2`; koraci: `.services-style-3`.
- `js/custom.js` upravlja xmenu klasama `show`, `open`, `body.fixed`, skrolovanjem i sticky headerom. Učitava i spoljnu skriptu za kupovinu/podršku autora template-a: to se uklanja iz aktivnog sajta.
- `js/dz.carousel.js` inicijalizuje Owl carousele. Demo testimonials nemaju potvrđene recenzije: komponenta ostaje inertna u HTML template elementu, bez preuzimanja demo recenzija. Portfolio takođe ostaje inertan, bez lažnih rezultata.
- `booking.html` nema funkcionalno slanje i sadrži payment/account demo. `contact.html` POST šalje na `script/contact.php`, koji ne postoji u projektu. `js/dz.ajax.js` očekuje PHP JSON odgovor i reCAPTCHA; ne koristi se za novu formu.
- Za aktivnu stranicu potrebni su jQuery, Bootstrap Bundle, Revolution tools/core i background-slide/navigation/parallax ekstenzije. Nisu potrebni demo shop TouchSpin, selectpicker (koristi se native select), brojači, masonry, Magnific Popup, switcher i stari AJAX.

## Odluke

Originalni HTML fajlovi i izmenjeni originalni JS čuvaju se u `.template-backup`, koju lokalni server ne servira. Novi homepage ostaje u `index-5.html`, uz identičan `index.html` radi drugih statičkih servera. Čuvaju se izvorni CSS i vendor biblioteke. Naše dopune su u `css/custom.css`, `js/site.js`, `js/site.config.js` i prilagođenim `js/custom.js` / `js/rev.slider.js`.

Nema izmišljanja kontakt podataka, cena, recenzija ili poslovnih politika. Forma u nepovezanom režimu samo proverava/priprema upit i jasno kaže da nije poslat. Produkcioni domen, pravni tekstovi i realno slanje ostaju eksplicitni TODO.
