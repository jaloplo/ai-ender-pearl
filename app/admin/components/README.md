# Admin Visual Components Gallery

The `/admin/components` route is the authenticated visual reference for the application. It uses fake data and intentionally reuses the app's live typography, controls, tables, cards, result, QR, pager, and analytics styling patterns.

When a visual component changes in the application, update the gallery example or shared class usage at the same time. The route is protected by `middleware.js`; the current application authentication model has one admin credential represented by the `auth=true` cookie.
