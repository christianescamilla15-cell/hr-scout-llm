// Normalizacion de texto: quita acentos, minusculas, limpia caracteres especiales
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.\/\-+#]/g, " ");
}
