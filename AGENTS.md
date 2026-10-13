
- SEO: head por rota via react-helmet-async (RouteSeo) e metadados em src/data/seoRoutes.json; scripts/prerender.mjs roda após vite build e gera HTML estático por rota pública + sitemap.xml. Por quê: indexação no Google em radar.bewild.com.br sem SSR.
- Home pré-renderizada com React (src/entry-server.tsx + vite build --ssr) e hidratada via hydrateRoot só quando data-ssr-path bate com a rota; partes de navegador ficam em ClientOnly. Por quê: guia completo indexável sem quebrar o SPA.
