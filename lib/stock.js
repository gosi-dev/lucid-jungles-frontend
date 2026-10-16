// lib/stock.js — how many of a product are left, in one place.
//
// The server is the authority (see stock_limit in original-backend/src/controllers/store.js):
// `instock` is the shopkeeper's flag, `quantity` is what is actually on the shelf, and a product
// with none left is out of stock even while the flag still says true. The UI has to agree with
// that, or it offers ADD TO CART for something the next request will refuse.
export function stockLeft(product) {
  const n = Number(product && product.quantity);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function soldOut(product) {
  if (!product) return true;
  return product.instock === false || stockLeft(product) === 0;
}

// Whether a cart line has reached the shelf: `quantity` in the basket against what is left.
export function atStockLimit(product, quantity) {
  const left = stockLeft(product);
  return left > 0 && Number(quantity) >= left;
}
