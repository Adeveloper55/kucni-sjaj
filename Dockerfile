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
# Copy every built page (pages.json landings grow over time — no hard-coded allowlist).
COPY --from=build /app/*.html /usr/share/nginx/html/
COPY --from=build /app/robots.txt /app/sitemap.xml /usr/share/nginx/html/
COPY --from=build /app/css /usr/share/nginx/html/css
COPY --from=build /app/js /usr/share/nginx/html/js
COPY --from=build /app/images /usr/share/nginx/html/images
COPY --from=build /app/fonts /usr/share/nginx/html/fonts
COPY --from=build /app/plugins /usr/share/nginx/html/plugins

EXPOSE 80
