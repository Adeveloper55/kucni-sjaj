# Static site: Node builds HTML from site.config.js, nginx only serves the result.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json pages.json ./
COPY js ./js
COPY scripts ./scripts
COPY content ./content
COPY partials ./partials
COPY css ./css
COPY images ./images
COPY fonts ./fonts
COPY plugins ./plugins

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/index.html \
  /app/index-5.html \
  /app/usluge.html \
  /app/cenovnik.html \
  /app/kako-funkcionise.html \
  /app/o-nama.html \
  /app/faq.html \
  /app/kontakt.html \
  /app/politika-privatnosti.html \
  /app/uslovi-koriscenja.html \
  /app/robots.txt \
  /app/sitemap.xml \
  /usr/share/nginx/html/
COPY --from=build /app/css /usr/share/nginx/html/css
COPY --from=build /app/js /usr/share/nginx/html/js
COPY --from=build /app/images /usr/share/nginx/html/images
COPY --from=build /app/fonts /usr/share/nginx/html/fonts
COPY --from=build /app/plugins /usr/share/nginx/html/plugins

EXPOSE 80
