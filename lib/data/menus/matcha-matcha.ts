// Matcha Matcha's menu, as listed on matchamatcha.ca/pages/menu (fetched
// 2026-09-19). Names and one-line descriptions only — no café-level prices
// appear on that page (only the retail cans below), so none are invented
// here. Nothing renders this yet: there is no café detail page in the site,
// and the database has no menu table (menu_items isn't created by any
// migration). It's kept as typed data so a café page or a `menu_items`
// import can read it later without re-copying it from their site.
//
// The café itself is already in the seed list (scripts/seed-cafes.mjs,
// slug 'matcha-matcha', Toronto, Church-Wellesley).

export interface MenuItem {
  name: string;
  description?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MATCHA_MATCHA_MENU: MenuSection[] = [
  {
    title: 'Classic matcha drinks',
    items: [
      { name: 'Matcha Latte', description: 'Ceremonial grade matcha from Kyoto and your choice of milk' },
      { name: 'Strawberry', description: 'Made with real Ontario strawberries' },
      { name: 'Vanilla Bean', description: 'Madagascar bourbon vanilla bean' },
      { name: 'Cheesecake', description: 'For matcha cheesecake lovers' },
      { name: 'Black Caramel', description: 'Okinawa black sugar and salted caramel, topped with ceremonial Kyoto matcha' },
      { name: 'Yuzu Lemonade', description: 'Sparkling lemonade with fresh lemon and yuzu' },
      { name: 'Matchacano', description: 'Matcha and water' },
      { name: 'Matcha Latte Float', description: 'Matcha latte with matcha soft serve' },
    ],
  },
  {
    title: 'Specialty drinks',
    items: [
      { name: 'Mango Coconut', description: 'Slow-cooked fresh mango, coconut and maple, with oat milk' },
      { name: 'Matcha Coco Cloud', description: 'Matcha white chocolate cloud with coconut water' },
      { name: 'White Chocolate Pistachio', description: 'Matcha latte with white chocolate and pistachio' },
      { name: 'Banana Brûlée', description: 'A banana bread–inspired matcha latte' },
      { name: 'Tokyo Fog', description: 'Earl grey, vanilla, lemon zest and matcha' },
      { name: 'Coco Pandan', description: 'Matcha latte with coconut pandan' },
      { name: 'Pumpkin Spice Latte', description: 'Matcha with a pumpkin spice blend' },
      { name: 'Biscoff', description: 'Matcha with caramelized Biscoff, vanilla cold foam and cookie crumbles' },
    ],
  },
  {
    title: 'Hojicha drinks',
    items: [
      { name: 'Hojicha Latte', description: 'Fire-roasted hojicha with your choice of milk, toasty and smooth' },
      { name: 'Strawberry Hojicha', description: 'Roasted hojicha with fresh strawberries' },
      { name: 'Hojicha Cheesecake' },
      { name: 'Hojicha Coco Cloud', description: 'Hojicha white chocolate cloud with coconut water' },
      { name: 'White Chocolate Pistachio Hojicha', description: 'Hojicha with white chocolate and pistachio' },
      { name: 'Hojicha Biscoff', description: 'Hojicha with Biscoff, vanilla cold foam and cookie crumbles' },
      { name: 'Hojicha PSL', description: 'Hojicha with a pumpkin spice blend' },
    ],
  },
  {
    title: 'Frozen drinks',
    items: [
      { name: 'Strawberry Cold Foam Frozen Matcha', description: 'Matcha blended with oat milk, strawberry cold foam' },
      { name: 'Frozen Matcha', description: 'Ceremonial grade matcha with oat milk and ice' },
      { name: 'Matcha Soft Serve' },
    ],
  },
  {
    title: 'Bakery',
    items: [
      { name: 'Hokkaido Cream Cheese Bagel' },
      { name: 'Kyoto Matcha Red Bean Bagel' },
      { name: 'Pistachio Croissant Roll' },
      { name: 'The Cookie' },
      { name: 'Matcha Choco Pie' },
      { name: 'Lemon Pound Cake' },
      { name: 'White Chocolate Biscuit Sando' },
      { name: 'Matcha Matcha Roll Cake' },
      { name: 'Strawberry Matcha Roll Cake' },
      { name: 'Strawberry Matcha Tiramisu' },
      { name: 'Chocolate Matcha Cake' },
      { name: 'Banana Cream Pudding' },
    ],
  },
];

// Retail tins, the only priced items on the page (CAD).
export const MATCHA_MATCHA_RETAIL = [
  { name: 'Matcha Matcha Can', priceCad: 33 },
  { name: 'Horii Shichimeien Matcha Can', priceCad: 55 },
  { name: 'Everyday Matcha Can', priceCad: 19 },
  { name: 'Hojicha Can', priceCad: 19 },
];
