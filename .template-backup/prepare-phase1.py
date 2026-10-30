"""One-time migration; original files are retained in .template-backup."""
from pathlib import Path
import re
import shutil
from PIL import Image

root = Path(__file__).resolve().parent.parent
backup = root / '.template-backup'
if backup.exists():
    raise SystemExit('Backup already exists: do not repeat migration.')
original = (root / 'index-5.html').read_text(encoding='utf-8')
backup.mkdir()
for file in root.glob('*.html'):
    shutil.move(str(file), backup / file.name)
for name in ('custom.js', 'rev.slider.js'):
    shutil.copy2(root / 'js' / name, backup / name)

# Retain original Revolution DOM, transitions, slide IDs and shape classes.
slider = original[original.index('        <div class="main-slider'):original.index('\t\t<!-- Slider END -->')]
start = slider.index('\t\t\t\t\t\t\t<div style="" class="tp-static-layers')
end = slider.index('\t\t\t\t\t\t\t<div class="tp-bannertimer', start)
slider = slider[:start] + slider[end:]
slider = slider.replace('id="home"', 'aria-hidden="true"')
slider = slider.replace('style="margin:0px auto;background-color:transparent;padding:0px;margin-top:0px;margin-bottom:0px;"', '')
for number in (10, 11, 12):
    img = root / f'images/main-slider/slide{number}.jpg'
    Image.open(img).save(img.with_suffix('.webp'), 'WEBP', quality=86)
    slider = slider.replace(f'slide{number}.jpg', f'slide{number}.webp')
slider = re.sub(r'<img src="(images/main-slider/slide\d+.webp)"', r'<img width="1800" height="900" src="\1"', slider)
slider = slider.replace('data-title="Number One"', 'data-title="Čišćenje doma"').replace('data-title="Number Two"', 'data-title="Održavanje doma"').replace('data-title="Number Three"', 'data-title="Uredan prostor"')
slider = slider.replace('<!-- START REVOLUTION SLIDER 5.4.1 auto mode -->', '<!-- Originalni slider i prelazi -->')

for name in ('pic3', 'pic5'):
    img = root / f'images/about/{name}.jpg'
    Image.open(img).save(img.with_suffix('.webp'), 'WEBP', quality=85)

nav = [('pocetna', 'Početna'), ('usluge', 'Usluge'), ('cenovnik', 'Cenovnik'), ('kako-funkcionise', 'Kako funkcioniše'), ('o-nama', 'O nama'), ('faq', 'FAQ'), ('kontakt', 'Kontakt')]
nav_html = '\n'.join(f'<li><a href="#{anchor}"'+ (' class="active" aria-current="page"' if i == 0 else '') + f'>{title}</a></li>' for i, (anchor, title) in enumerate(nav))
logo = '''<!-- BRAND --><a class="brand-mark" href="/#pocetna" aria-label="Čisto Dom — početna" data-brand-link><svg aria-hidden="true" viewBox="0 0 64 64" width="44" height="44"><path d="M8 31 30 12l22 19M15 27v28h30V27M25 55V39h11v16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><path d="m49 4 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#fff02e"/></svg><span><strong data-brand>Čisto Dom</strong><small>Čišćenje stanova i kuća</small></span></a>'''
services = [
    ('redovno', 'Redovno čišćenje', 'Redovno održavanje stana ili kuće prema dogovorenom rasporedu.', 'flaticon-dustpan'),
    ('generalno', 'Generalno čišćenje', 'Detaljno čišćenje svih prostorija, površina, kuhinje i kupatila.', 'flaticon-house'),
    ('renoviranje', 'Čišćenje nakon renoviranja', 'Uklanjanje prašine i nečistoća nakon građevinskih i renovacionih radova.', 'flaticon-sweep'),
    ('useljenje', 'Čišćenje pri useljenju ili iseljenju', 'Detaljna priprema prostora pre useljenja ili nakon iseljenja.', 'flaticon-vacuum-cleaner'),
    ('kuhinja', 'Čišćenje kuhinje i kupatila', 'Detaljno čišćenje prostora koji zahtevaju posebnu pažnju.', 'flaticon-people'),
    ('prozori', 'Pranje prozora', 'Pranje staklenih površina i dostupnih delova prozora po dogovoru.', 'flaticon-dustpan'),
]
cards = ''.join(f'''<div class="col-lg-4 col-md-6"><article id="usluga-{key}" class="dlab-box services-style-2 bg-white text-center">
  <div class="dlab-content"><div class="icon-bx-md icon-bx bg-primary" aria-hidden="true"><span class="icon-cell"><i class="glyph-icon {icon}"></i></span></div>
  <h3 class="dlab-tilte m-b10">{title}</h3><p>{description}</p>
  <a href="#zakazivanje" data-service="{key}" class="site-button btn-block button-md radius-sm" aria-label="Zatraži cenu: {title}">Zatraži cenu <i aria-hidden="true" class="fa fa-arrow-right"></i></a></div>
</article></div>''' for key, title, description, icon in services)
benefits = [
    ('Fleksibilni termini', 'Termin prilagođavamo vašim obavezama.'),
    ('Jasan dogovor', 'Pre početka znate šta je uključeno u uslugu.'),
    ('Detaljan pristup', 'Posebnu pažnju posvećujemo kuhinji, kupatilu i najkorišćenijim površinama.'),
    ('Jednostavno zakazivanje', 'Pošaljite upit ili nas pozovite.'),
]
benefit_html = ''.join(f'<li><span class="benefit-icon" aria-hidden="true"><i class="fa fa-check"></i></span><div><h3>{title}</h3><p>{description}</p></div></li>' for title, description in benefits)
steps = [('Izaberite uslugu', 'Recite nam šta treba očistiti i približnu veličinu prostora.'), ('Dogovorite termin', 'Potvrđujemo detalje, termin i cenu.'), ('Mi čistimo', 'Naš tim dolazi u dogovoreno vreme i obavlja dogovoreno čišćenje.')]
step_html = ''.join(f'<div class="col-lg-4"><div class="dlab-box services-style-3 text-center"><div class="dlab-content"><div class="number">0{i}</div><h3 class="dlab-tilte text-secondry">{title}</h3><p>{description}</p></div></div></div>' for i, (title, description) in enumerate(steps, 1))
prices = [('redovno', 'Redovno čišćenje', 'Cena prema veličini prostora i obimu posla'), ('generalno', 'Generalno čišćenje', 'Cena prema veličini prostora i stanju objekta'), ('renoviranje', 'Nakon renoviranja', 'Individualna procena'), ('prozori', 'Pranje prozora', 'Prema broju i dimenzijama')]
price_html = ''.join(f'<div class="col-md-6"><article class="pricingtable-wrapper pricingtable-style2" data-pricing-service="{key}"><div class="pricingtable-inner"><div class="pricingtable-price"><h3>{title}</h3></div><p data-price-placeholder>{description}</p><div class="pricingtable-footer"><a href="#zakazivanje" data-service="{key}" class="site-button-link" aria-label="Zatraži procenu: {title}">Zatraži procenu <i class="fa fa-angle-right m-l10" aria-hidden="true"></i></a></div></div></article></div>' for key, title, description in prices)
faqs = [
    ('Šta je uključeno u čišćenje?', 'Obim posla dogovaramo prema odabranoj usluzi i stanju prostora. Pre dolaska potvrđujemo koje prostorije i površine treba očistiti i da li su potrebne dodatne usluge.'),
    ('Koliko traje čišćenje?', 'Trajanje zavisi od veličine i stanja prostora, kao i od dogovorenog obima posla. Okvirno trajanje potvrđujemo nakon što dobijemo te informacije.'),
    ('Da li donosimo sopstvena sredstva za čišćenje?', 'Prilikom zakazivanja dogovaramo da li je potrebno da tim donese sredstva i opremu.'),
    ('Koliko unapred treba zakazati termin?', 'Pošaljite željeni datum čim znate kada vam je čišćenje potrebno. Dostupnost termina proveravamo i potvrđujemo nakon upita.'),
    ('Da li mogu da zakažem samo određene prostorije?', 'U upitu navedite koje prostorije treba očistiti. Obim usluge i cenu dogovaramo prema vašim potrebama.'),
    ('Da li radite vikendom?', 'Ako vam odgovara vikend, navedite to u upitu. Mogućnost dolaska zavisi od raspoloživih termina i potvrđuje se pri dogovoru.'),
    ('Kako se određuje cena?', 'Cena zavisi od površine, stanja prostora i izabranih dodatnih usluga. Konačnu cenu potvrđujemo pre početka čišćenja.'),
]
faq_html = ''.join(f'''<div class="panel"><div class="acod-head"><h3 class="acod-title"><button type="button" class="faq-toggle {'collapsed' if i else ''}" id="faq-question-{i}" data-bs-toggle="collapse" data-bs-target="#faq-answer-{i}" aria-controls="faq-answer-{i}" aria-expanded="{'false' if i else 'true'}"><span class="icon-bx" aria-hidden="true"><i class="fa fa-plus"></i></span>{q}</button></h3></div><div id="faq-answer-{i}" class="acod-body collapse {'show' if not i else ''}" data-bs-parent="#faq-list" role="region" aria-labelledby="faq-question-{i}"><div class="acod-content">{answer}</div></div></div>''' for i, (q, answer) in enumerate(faqs))

head = '''<!DOCTYPE html>
<html lang="sr-Latn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="format-detection" content="telephone=no">
  <title>Čišćenje stanova Beograd | Profesionalno čišćenje</title>
  <meta name="description" content="Profesionalno čišćenje stanova i kuća u Beogradu. Redovno, generalno i detaljno čišćenje, čišćenje nakon renoviranja i pranje prozora.">
  <meta name="theme-color" content="#0a2882">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sr_RS">
  <meta property="og:title" content="Čišćenje stanova i kuća u Beogradu">
  <meta property="og:description" content="Redovno, generalno ili detaljno čišćenje doma. Pogledajte usluge i zatražite procenu.">
  <!-- TODO SITE_URL: canonical, og:url i og:image dodaje js/site.js tek kada postoji potvrđen domen. -->
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="images/main-slider/slide10.webp" as="image" fetchpriority="high">
  <link rel="stylesheet" href="plugins/bootstrap/css/bootstrap.min.css">
  <link rel="stylesheet" href="plugins/fontawesome/css/all.min.css">
  <link rel="stylesheet" href="plugins/flaticon/css/flaticon.css">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="plugins/xmenu/css/xmenu.css">
  <link rel="stylesheet" href="css/skin/skin-4.css">
  <link rel="stylesheet" href="css/templete.css">
  <link rel="stylesheet" href="plugins/revolution/revolution/css/settings.css">
  <link rel="stylesheet" href="plugins/revolution/revolution/css/navigation.css">
  <link rel="stylesheet" href="css/custom.css">
  <script type="application/ld+json" id="business-schema">{"@context":"https://schema.org","@type":"LocalBusiness","name":"Čisto Dom","description":"Čišćenje stanova i kuća u Beogradu.","areaServed":{"@type":"City","name":"Beograd"},"hasOfferCatalog":{"@type":"OfferCatalog","name":"Usluge čišćenja doma","itemListElement":[{"@type":"Service","name":"Redovno čišćenje"},{"@type":"Service","name":"Generalno čišćenje"},{"@type":"Service","name":"Čišćenje nakon renoviranja"},{"@type":"Service","name":"Čišćenje pri useljenju ili iseljenju"},{"@type":"Service","name":"Čišćenje kuhinje i kupatila"},{"@type":"Service","name":"Pranje prozora"}]}}</script>
</head>
<body id="bg" class="home-page">
<a class="skip-link" href="#main">Preskoči na sadržaj</a>
<div class="page-wraper page-wraper-full font-roboto btn-lsnone">
'''
header = f'''<header class="site-header header-style-6" id="pocetna">
  <div class="top-bar"><div class="container-fluid"><span>Čišćenje stanova i kuća · Beograd</span><a href="#zakazivanje">Pronađimo vaš termin <i class="fa fa-arrow-right" aria-hidden="true"></i></a></div></div>
  <div class="main-bar-wraper sticky-header"><div class="main-bar clearfix"><div class="container-fluid inner-bar align-items-center clearfix">
    <div class="logo-header">{logo}</div>
    <button type="button" class="xmenu-toggler navicon" data-target="#xMenuNav" aria-controls="xMenuNav" aria-expanded="false" aria-label="Otvori meni"><span></span><span></span><span></span></button>
    <div class="menu-close fade-overlay" aria-hidden="true"></div>
    <nav class="header-nav xmenu xmenu-end mo-left" id="xMenuNav" aria-label="Glavna navigacija">
      <div class="mobile-menu-heading"><span>Meni</span><button type="button" class="close-menu" aria-label="Zatvori meni"><i class="fa fa-times" aria-hidden="true"></i></button></div>
      <ul class="nav navbar-nav">{nav_html}</ul>
      <a class="site-button menu-booking" href="#zakazivanje">Zakaži čišćenje</a>
    </nav>
    <div class="extra-nav"><a href="#zakazivanje" class="site-button header-booking radius-sm">Zakaži čišćenje <i class="fa fa-arrow-right" aria-hidden="true"></i></a></div>
  </div></div></div>
</header>
<main id="main" class="page-content bg-white" tabindex="-1">
<section class="hero-section" aria-labelledby="hero-title">
{slider}
  <div class="hero-copy"><p class="hero-eyebrow">Profesionalno čišćenje u Beogradu</p>
    <h1 id="hero-title">Vaš dom savršeno čist, bez gubljenja vremena</h1>
    <p class="hero-description">Pouzdano čišćenje stanova i kuća prilagođeno vašem terminu. Redovno, generalno ili detaljno čišćenje — jednostavno zakažite termin.</p>
    <div class="cta-actions"><a class="site-button button-md radius-sm" href="#zakazivanje">Zakaži čišćenje <i class="fa fa-arrow-right" aria-hidden="true"></i></a><button class="call-button" type="button" data-contact="phone" disabled aria-describedby="phone-pending">Pozovite nas</button></div>
    <p id="phone-pending" class="contact-pending">Telefon će biti dodat uskoro.</p>
  </div>
  <div class="slider-controls" aria-label="Kontrole fotografija"><button type="button" data-slider="prev" aria-label="Prethodna fotografija"><i class="fa fa-arrow-left" aria-hidden="true"></i></button><button type="button" data-slider="pause" aria-label="Pauziraj smenu fotografija" aria-pressed="false"><i class="fa fa-pause" aria-hidden="true"></i></button><button type="button" data-slider="next" aria-label="Sledeća fotografija"><i class="fa fa-arrow-right" aria-hidden="true"></i></button></div>
</section>
<section class="section-full call-action bg-secondry style1 value-strip" aria-label="Prednosti zakazivanja"><div class="container-fluid"><div class="row align-items-center"><div class="col-lg-9"><ul class="trust-list"><li><i class="fa fa-check" aria-hidden="true"></i> Jednostavno zakazivanje</li><li><i class="fa fa-check" aria-hidden="true"></i> Fleksibilni termini</li><li><i class="fa fa-check" aria-hidden="true"></i> Čišćenje po dogovoru</li></ul></div><div class="col-lg-3"><div class="img-box"><img src="images/about/basket.png" width="424" height="356" alt="" loading="lazy"></div></div></div></div></section>
<section id="usluge" class="section-full content-inner bg-white services-area2" aria-labelledby="services-title"><div class="container-fluid"><div class="section-head style1 text-center"><p class="section-kicker">Usluge za vaš dom</p><h2 id="services-title" class="title text-black">Šta treba da očistimo?</h2><p>Od redovnog održavanja do detaljnog čišćenja. Izaberite uslugu koja vam je potrebna.</p></div><div class="row service-grid">{cards}</div></div></section>
<section id="o-nama" class="section-full bg-white content-inner-2 benefits-section" aria-labelledby="benefits-title"><div class="container-fluid"><div class="row faq-area2 align-items-center"><div class="col-lg-6"><img src="images/about/pic3.webp" width="684" height="780" alt="Sredstva i oprema za čišćenje doma" loading="lazy" class="benefits-photo"></div><div class="col-lg-6"><div class="section-head style1 text-left"><p class="section-kicker">O nama</p><h2 id="benefits-title" class="title-head text-black">Čišćenje bez komplikacija</h2><p>Dogovorite termin, recite nam šta vam je potrebno i prepustite čišćenje nama.</p></div><ul class="benefits-list">{benefit_html}</ul><!-- BRAND --><p class="about-copy"><span data-brand>Čisto Dom</span> je namenjen čišćenju stanova i kuća u Beogradu. Dogovor počinje vašim potrebama: šta treba očistiti, kada i u kom obimu.</p></div></div></div></section>
<section id="kako-funkcionise" class="section-full content-inner bg-gray steps-section" aria-labelledby="steps-title"><div class="container-fluid"><div class="section-head style1 text-center"><p class="section-kicker">Od upita do čistog doma</p><h2 id="steps-title" class="title text-black">Tri jednostavna koraka</h2></div><div class="row steps-grid">{step_html}</div><div class="text-center"><a href="#zakazivanje" class="site-button button-md radius-sm">Zakaži termin <i class="fa fa-arrow-right" aria-hidden="true"></i></a></div></div></section>
<section id="cenovnik" class="section-full content-inner-2 bg-white" aria-labelledby="pricing-title"><div class="container-fluid"><div class="row pricingtable-area2 align-items-center"><div class="col-xl-5 col-lg-5"><div class="section-head style1"><p class="section-kicker">Cenovnik</p><h2 id="pricing-title" class="title text-black">Cena prema vašem prostoru</h2><p>Recite nam veličinu prostora i šta je potrebno očistiti. Zatim dogovaramo obim usluge i cenu.</p></div><img src="images/about/pic5.webp" width="800" height="651" loading="lazy" alt="Priprema za čišćenje doma" class="pricing-photo"></div><div class="col-xl-7 col-lg-7"><div id="pricing-options" class="row pricing-grid" data-pricing-mode="inquiry">{price_html}</div><p class="pricing-note">Konačna cena zavisi od površine, stanja prostora i odabranih dodatnih usluga.</p></div></div></div></section>
<!-- PRE/AFTER DISABLED UNTIL REAL PROJECT PHOTOS ARE PROVIDED -->
<template id="before-after-template"><section class="section-full content-inner" aria-label="Pre i posle"><div class="container-fluid"><h2>Pre i posle</h2><div class="row" data-projects></div></div></section></template>
<!-- TESTIMONIALS DISABLED UNTIL REAL REVIEWS ARE PROVIDED -->
<template id="testimonials-template"><section class="section-full content-inner bg-gray" aria-label="Utisci klijenata"><div class="container-fluid"><h2>Utisci klijenata</h2><div class="owl-carousel testimonial-three" data-real-reviews></div></div></section></template>
<section class="section-full content-inner overlay-primary-dark inquiry-cta" aria-labelledby="cta-title"><div class="container-fluid"><div class="row align-items-center"><div class="col-lg-8 text-white"><h2 id="cta-title">Treba vam čist stan bez gubljenja celog dana?</h2><p>Pošaljite nam osnovne informacije o prostoru i dogovorićemo termin koji vam odgovara.</p></div><div class="col-lg-4"><div class="cta-actions"><a href="#zakazivanje" class="site-button button-md radius-sm">Zakaži čišćenje</a><button type="button" class="call-button call-button-light" data-contact="phone" disabled aria-describedby="cta-phone-note">Pozovite nas</button></div><p id="cta-phone-note" class="contact-pending">Telefon će biti dodat uskoro.</p></div></div></div></section>
<section id="faq" class="section-full content-inner bg-white" aria-labelledby="faq-title"><div class="container-fluid"><div class="row"><div class="col-lg-4"><div class="section-head style1"><p class="section-kicker">Pre zakazivanja</p><h2 id="faq-title" class="title text-black">Česta pitanja</h2><p>Sve detalje usluge potvrđujemo u dogovoru sa vama.</p><a href="#zakazivanje" class="site-button-link">Imate drugo pitanje? <i class="fa fa-arrow-right" aria-hidden="true"></i></a></div></div><div class="col-lg-8"><div class="faq-style2 dlab-accordion" id="faq-list">{faq_html}</div></div></div></div></section>
<section id="zakazivanje" class="section-full content-inner bg-gray booking-section" aria-labelledby="booking-title"><div class="container-fluid"><div class="row"><div class="col-lg-4"><div class="section-head style1"><p class="section-kicker">Vaš sledeći korak</p><h2 id="booking-title" class="title text-black">Dogovorimo čišćenje</h2><p>Unesite osnovne informacije. Željeni datum i vreme potvrđuju se naknadno.</p></div><aside id="kontakt" aria-labelledby="contact-title"><h3 id="contact-title">Kontakt</h3><p>Grad / zona rada: <strong>Beograd</strong></p><dl class="contact-list"><div><dt>Telefon</dt><dd data-contact-value="PHONE_NUMBER">Biće dodat uskoro</dd></div><div><dt>WhatsApp</dt><dd data-contact-value="WHATSAPP_NUMBER">Biće dodat uskoro</dd></div><div><dt>Viber</dt><dd data-contact-value="VIBER_NUMBER">Biće dodat uskoro</dd></div><div><dt>Email</dt><dd data-contact-value="EMAIL_ADDRESS">Biće dodat uskoro</dd></div></dl><div class="contact-channels"><button type="button" data-contact="whatsapp" disabled>WhatsApp</button><button type="button" data-contact="viber" disabled>Viber</button><button type="button" data-contact="email" disabled>Email</button></div></aside></div>
<div class="col-lg-8"><div class="booking-card"><p id="booking-availability" class="booking-notice" role="note">Online slanje još nije dostupno. Ovde možete pripremiti upit; podaci se ne šalju i termin nije rezervisan.</p><noscript><p>Za proveru i pripremu upita uključite JavaScript. Forma trenutno ne šalje podatke.</p></noscript>
<form id="booking-form" class="booking-form" novalidate aria-describedby="booking-availability required-note">
<fieldset id="booking-fields" disabled><legend class="visually-hidden">Podaci za upit o čišćenju</legend><p id="required-note">Polja označena zvezdicom (*) su obavezna.</p><div id="form-errors" class="form-errors" role="alert" tabindex="-1" hidden></div><div class="row">
<div class="col-md-6 form-group"><label for="full-name">Ime i prezime *</label><input class="form-control" id="full-name" name="fullName" type="text" autocomplete="name" required minlength="2" maxlength="100" aria-describedby="full-name-error"><span id="full-name-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="phone">Telefon *</label><input class="form-control" id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30" aria-describedby="phone-error"><span id="phone-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="email">Email</label><input class="form-control" id="email" name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="email-error"><span id="email-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="service">Tip usluge *</label><select class="form-control" id="service" name="service" required aria-describedby="service-error"><option value="">Izaberite uslugu</option><option value="redovno">Redovno čišćenje</option><option value="generalno">Generalno čišćenje</option><option value="renoviranje">Nakon renoviranja</option><option value="useljenje">Useljenje / iseljenje</option><option value="prozori">Pranje prozora</option><option value="ostalo">Ostalo</option></select><span id="service-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="area">Veličina prostora / m²</label><input class="form-control" id="area" name="area" type="number" min="1" step="0.5" inputmode="decimal" aria-describedby="area-error"><span id="area-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="rooms">Broj prostorija</label><input class="form-control" id="rooms" name="rooms" type="number" min="1" step="1" inputmode="numeric" aria-describedby="rooms-error"><span id="rooms-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="date">Željeni datum</label><input class="form-control" id="date" name="date" type="date" aria-describedby="date-error"><span id="date-error" class="field-error"></span></div>
<div class="col-md-6 form-group"><label for="time">Željeno vreme</label><input class="form-control" id="time" name="time" type="time" aria-describedby="time-error"><span id="time-error" class="field-error"></span></div>
<div class="col-12 form-group"><label for="location">Lokacija / deo grada</label><input class="form-control" id="location" name="location" type="text" autocomplete="address-level3" maxlength="150" aria-describedby="location-error"><span id="location-error" class="field-error"></span></div>
<div class="col-12 form-group"><label for="message">Dodatna poruka</label><textarea class="form-control" id="message" name="message" rows="4" maxlength="2000" aria-describedby="message-error"></textarea><span id="message-error" class="field-error"></span></div>
</div><p class="form-privacy">Ne unosite osetljive podatke. <a href="politika-privatnosti.html">Informacije o privatnosti</a>.</p><button id="booking-submit" type="submit" class="site-button button-md radius-sm">Pripremi upit <i class="fa fa-arrow-right" aria-hidden="true"></i></button></fieldset>
<div id="booking-status" class="booking-status" role="status" aria-live="polite" tabindex="-1" hidden></div><div id="inquiry-draft" hidden><label for="draft-text">Vaš pripremljeni upit — nije poslat</label><textarea id="draft-text" class="form-control" rows="9" readonly></textarea><button id="copy-inquiry" class="site-button radius-sm" type="button">Kopiraj upit</button><span id="copy-status" role="status"></span></div>
</form></div></div></div></div></section>
</main>
'''
footer_services = ''.join(f'<li><a href="#usluga-{key}">{title}</a></li>' for key, title in [('redovno','Redovno čišćenje'), ('generalno','Generalno čišćenje'), ('renoviranje','Nakon renoviranja'), ('useljenje','Useljenje / iseljenje'), ('prozori','Pranje prozora')])
footer = f'''<footer class="site-footer home-footer"><div class="footer-top"><div class="container-fluid"><div class="row"><div class="col-lg-4 col-md-6">{logo}<p>Čišćenje stanova i kuća u Beogradu. Usluga prema vašem prostoru, potrebama i dogovorenom terminu.</p></div><div class="col-lg-3 col-md-6"><h2>Usluge</h2><ul>{footer_services}</ul></div><div class="col-lg-2 col-md-6"><h2>Brzi linkovi</h2><ul><li><a href="#pocetna">Početna</a></li><li><a href="#o-nama">O nama</a></li><li><a href="#faq">FAQ</a></li><li><a href="#kontakt">Kontakt</a></li></ul></div><div class="col-lg-3 col-md-6"><h2>Kontakt</h2><p>Beograd</p><p>Telefon: <span data-contact-value="PHONE_NUMBER">uskoro</span></p><p>Email: <span data-contact-value="EMAIL_ADDRESS">uskoro</span></p><a class="site-button radius-sm" href="#zakazivanje">Zakaži čišćenje</a></div></div></div></div><div class="footer-bottom"><div class="container-fluid"><div class="footer-bottom-inner"><!-- BRAND --><span>© <span class="current-year">2026</span> <span data-brand>Čisto Dom</span>. Sva prava zadržana.</span><div><a href="politika-privatnosti.html">Politika privatnosti</a><a href="uslovi-koriscenja.html">Uslovi korišćenja</a></div></div></div></div></footer>
<button type="button" class="scroltop fa fa-arrow-up" aria-label="Vrati se na vrh"></button>
<nav class="mobile-sticky-cta" aria-label="Brzo zakazivanje"><button type="button" data-contact="phone" disabled title="Telefon će biti dodat uskoro">Pozovi <small data-phone-hint>Broj uskoro</small></button><a href="#zakazivanje">Zakaži <i class="fa fa-arrow-right" aria-hidden="true"></i></a></nav>
</div>
<script defer src="js/site.config.js"></script>
<script defer src="js/jquery.min.js"></script>
<script defer src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script defer src="plugins/revolution/revolution/js/jquery.themepunch.tools.min.js"></script>
<script defer src="plugins/revolution/revolution/js/jquery.themepunch.revolution.min.js"></script>
<script defer src="plugins/revolution/revolution/js/extensions/revolution.extension.slideanims.min.js"></script>
<script defer src="plugins/revolution/revolution/js/extensions/revolution.extension.navigation.min.js"></script>
<script defer src="plugins/revolution/revolution/js/extensions/revolution.extension.parallax.min.js"></script>
<script defer src="plugins/revolution/revolution/js/extensions/revolution.extension.migration.min.js"></script>
<script defer src="plugins/revolution/revolution/js/extensions/revolution.extension.layeranimation.min.js"></script>
<script defer src="js/rev.slider.js"></script>
<script defer src="js/custom.js"></script>
<script defer src="js/site.js"></script>
</body>
</html>'''
homepage = head + header + footer
for name in ('index.html', 'index-5.html'):
    (root / name).write_text(homepage, encoding='utf-8')

# Legal drafts are explicit publication blockers, not invented policies.
for filename, title, content in [
    ('politika-privatnosti.html', 'Politika privatnosti', 'Online slanje upita trenutno nije aktivno. Unosi u formu se ne šalju niti se čuvaju u lokalnoj memoriji pregledača. Kontakt podaci firme i potpune informacije o obradi podataka biće dodati pre aktiviranja slanja.'),
    ('uslovi-koriscenja.html', 'Uslovi korišćenja', 'Sajt je trenutno u pripremi. Popunjavanje forme ne rezerviše termin i ne predstavlja potvrdu usluge. Termin, obim posla i cenu potrebno je naknadno dogovoriti. Podaci o pružaocu usluge i konačni uslovi biće dodati pre javne objave.'),
]:
    page = f'''<!DOCTYPE html><html lang="sr-Latn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>{title} — Čisto Dom</title><link rel="icon" href="images/favicon.svg"><link rel="stylesheet" href="plugins/bootstrap/css/bootstrap.min.css"><link rel="stylesheet" href="css/fonts.css"><link rel="stylesheet" href="css/custom.css"><script defer src="js/site.config.js"></script><script defer src="js/site.js"></script></head><body class="legal-page"><header class="legal-header">{logo}</header><main id="main" class="container"><a href="/">← Početna</a><p class="section-kicker">Dokument u pripremi</p><h1>{title}</h1><p>{content}</p><p>Ovaj tekst je obaveštenje o trenutnom stanju sajta. Konačan dokument još nije objavljen.</p><a class="site-button" href="/#kontakt">Kontakt</a></main></body></html>'''
    (root / filename).write_text(page, encoding='utf-8')

rev = (backup / 'rev.slider.js').read_text(encoding='utf-8')
function = rev[rev.index('function dz_rev_slider_5(){'):]
function = function.replace('gridheight:[960,600,500,500]', 'gridheight:[880,800,820,840]')
function = function.replace('jsFileLocation:"revolution/js/"', 'jsFileLocation:"plugins/revolution/revolution/js/"')
function = function.replace('onHoverStop:"off"', 'onHoverStop:"on"')
function = function.replace('h_offset:30', 'h_offset:20')
(root / 'js/rev.slider.js').write_text("'use strict';\nvar dzrevapi;\nvar dzQuery = jQuery;\n" + function, encoding='utf-8')
print('Original pages archived; homepage, legal draft pages and optimized images created.')
