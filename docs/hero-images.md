# Hero: dva prostora pre i posle čišćenja

Četiri slike napravljene su ugrađenim Imagegen alatom. Prvo su generisani prljav stan i prljava soba; zatim je svaka zasebno editovana u čistu verziju, uz očuvan ugao kamere, arhitekturu i nameštaj. Slike su AI ilustracije, bez tvrdnje da predstavljaju stvarne radove firme. Vidljive oznake i komande su naknadno uklonjene na zahtev korisnika; AI opis ostaje u aria-label-u i ovoj dokumentaciji.

## Sačuvani fajlovi

- `images/hero-comparison/stan-prljav.webp`
- `images/hero-comparison/stan-cist.webp`
- `images/hero-comparison/soba-prljava.webp`
- `images/hero-comparison/soba-cista.webp`

Svaka slika ima 1672 × 941 px. Četiri WebP fajla zajedno imaju približno 939 KB. Originalni generisani PNG fajlovi nalaze se u `images/hero-comparison/source/` pod istim nazivima.

## Konačni promptovi

### Stan — pre

Use case: photorealistic-natural. Create ONE landscape wide 16:9 photorealistic architectural interior photo, approximately 1800x1000 pixels, for a Serbian home cleaning website hero. Scene A BEFORE CLEANING: a noticeably dirty, neglected but attractive real Belgrade apartment living room opening onto a small kitchen, oak parquet flooring, warm off-white walls, light gray fabric sofa on the RIGHT, low wood coffee table on the right-center, sage green kitchen cabinetry along the far right back wall, large daylight window on back wall, one tall plant. Clearly visible dirt and everyday mess: dusty floor with scattered crumbs and muddy shoe prints, coffee rings and dirty cups on table, scattered magazines and clothes, dusty surfaces, dirty kitchen counter. Not damaged or ruined, no broken furniture, no hoarding, no gross bodily waste. Fixed camera at eye height from room doorway, natural perspective, wide interior photography, realistic fine textures. All most important recognizable furniture is in the CENTER and RIGHT TWO THIRDS because website text overlays left side. Bright soft natural daylight, pleasant plausible color, no people. Exactly ONE continuous full-frame photograph. NO before-after split, NO panels, NO text, NO letters, NO logos, NO watermark. This image will next be edited to the exact same apartment after cleaning, so keep straight architecture and clear furniture.

### Stan — posle

Edit target: the provided dirty apartment living-room photo. Create ONE AFTER CLEANING photo of EXACTLY THE SAME APARTMENT. Change ONLY its cleanliness and tidiness. Lock the camera position, perspective, crop, aspect ratio, every wall/window/door location, outside view, lighting, gray sofa, oak coffee table, rug, TV stand, sage-green kitchen cabinets, dining table/chairs, plant, all architecture and large furnishings. Remove ALL muddy shoe prints, dust, crumbs, stains, dirty mugs/dishes, loose clothes and papers. Clean oak floor and rug meticulously, wipe table/counter surfaces clean. Neatly arrange existing sofa cushions and throw; retain the existing plant and room styling. Keep realistic materials and EXACT same daylight, no makeover, no new furniture, no new decorations. The resulting photo must line up with the input for a precisely registered wipe before-after effect. Wide landscape full-frame photograph, no collage, no panels, no people, NO text, logo or watermark.

### Soba — pre

Use case: photorealistic-natural. Create ONE landscape wide 16:9 photorealistic architectural interior photo, approximately 1800x1000 pixels, for a Serbian domestic cleaning website hero. Scene B BEFORE CLEANING: a DISTINCT cozy bedroom in a real Belgrade apartment, different from a living room. Cream walls, muted dusty blue accent wall behind a double bed positioned in RIGHT HALF, beige upholstered headboard, oak bedside table, off-white duvet rumpled and unmade, blue throw, white wardrobe along the back wall, window and curtains at far right, light oak floor. Clearly dirty and messy: dust and crumbs on floor, muddy footprints, clothes and socks scattered at foot of bed, dusty bedside table with cups and clutter, smudges on mirror/wardrobe. The room is fully furnished and structurally sound; not dilapidated or hoarding. Camera fixed at eye level from bedroom doorway, wide architectural photo with clean geometry. Salient bed, mirror and mess in CENTER AND RIGHT TWO THIRDS of photograph, since website text overlays the left. Soft neutral daylight, naturally bright realistic texture, no people. Exactly ONE continuous full-frame photo. NO before-after split, NO collage, NO panels, NO text, NO letters, NO logo, NO watermark. Image will next be edited to identical camera and room after cleaning; make all architectural features consistent.

### Soba — posle

Edit target: the provided dirty bedroom photo. Create ONE AFTER CLEANING photo of EXACTLY THE SAME BEDROOM. Change ONLY cleanliness and tidiness. Preserve exact camera, perspective, crop, aspect ratio, light, shadows, cream walls, dusty-blue wall, all framed art, beige bed and headboard, bedside table, wardrobe doors, mirror frame and its reflection, window, curtains, plants, floor, rug and all furniture positions. Remove all muddy footprints, dust and crumbs, smudges, used cups and clutter, loose clothes/socks from bed and floor. Clean and polish surfaces, clean rug and mirror. Make the SAME bed neatly with the SAME off-white duvet and blue throw folded neatly at the foot, straighten pillows. Close the existing slightly ajar wardrobe door. Do not move furniture or add new decor. Keep the same brightness and realistic texture; NO renovations. Must line up with input as a perfectly registered before-after wipe. One continuous full-frame wide landscape photograph. No collage, no labels, no people, NO text/logo/watermark.

## Provera

U browseru: početak otkrivanja ~2061ms od ručne promene para (cilj 2000ms, provera uključuje interval čekanja alata); čista slika ~3475ms; drugi prostor ~6023ms. Pauza zadržava identičan procenat otkrivanja, ručni next menja prostor i resetuje prikaz na prljavu sliku. Na širinama 375, 390, 430, 768, 1024, 1440 i 1920px nema horizontalnog skrola niti preklapanja oznake sa hero tekstom. Sve četiri slike se učitavaju. Build, audit linkova/slika i JS sintaksna provera prolaze.

## Naknadna dorada palete

Hero zadržava tri dijagonalna dela: providni tamnoplavi sloj (rgba 16,43,60 / 78%), sredina sa fotografijom i providni tamni zlatni sloj (rgba 157,116,42 / 58%). Cela lokacija koristi mirniju teget, plavosivu, zlatnu i toplu belu paletu. Pauza, strelice i caption panel su uklonjeni iz HTML/CSS/JS; automatski ciklus ostaje. Raniji opis provere ručnih kontrola iznad odnosi se na prethodnu verziju.
