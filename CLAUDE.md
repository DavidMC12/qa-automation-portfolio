# Contexto: Automatización Web/Mobile & CI/CD

## Objetivo
Proyecto de portafolio QA enfocado en automatización multiplataforma y ejecución continua mediante pipelines de CI/CD.

## Stack
* **Web:** Playwright (TypeScript) + Page Object Model — objetivo: SauceDemo (saucedemo.com)
* **Mobile:** Maestro CLI — objetivo: Sauce Labs "My Demo App" (Android), self-hosted
* **CI/CD:** GitHub Actions (`web-tests.yml`, `mobile-tests.yml`, `pages.yml`)
* **Reportes:** GitHub Pages (self-hosted) — reporte HTML de Playwright + galería de videos
  generados con `maestro record --local`. Sin cuentas de terceros.

## Alcance
* Automatizar pruebas end-to-end para entorno Web y Mobile.
* Configurar ejecuciones automáticas activadas desde GitHub Actions.
* Publicar evidencia real de ejecución (screenshots/video/traces) en GitHub Pages, gratis.

## Decisiones rechazadas (no reabrir)
* **Maestro Cloud** — sus planes cloud parten de $250/dispositivo/mes; solo hay trial gratuito,
  no un tier gratis permanente. No cumple el requisito de "servicio gratis".
* **Appium** — evaluado como alternativa a Maestro; descartado por requerir más configuración y
  mantenimiento (servidor, capabilities, selectores XPath más frágiles).