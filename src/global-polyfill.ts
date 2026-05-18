/**
 * Polyfill — sockjs-client et autres librairies Node.js dans le navigateur.
 *
 * sockjs-client référence la variable globale `global` (Node.js).
 * Le navigateur n'a que `window`. Ce fichier est chargé dans polyfills.js
 * qui précède vendor.js dans l'ordre de chargement webpack.
 */
(window as any).global = window;
