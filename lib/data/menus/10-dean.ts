// 10 DEAN's online menu (10dean.ca/s/order, Waverley pickup), read
// 2026-09-19. UNCONFIRMED — the café hasn't verified any of this. Partial:
// the page loads its sections dynamically and the read was cut off partway
// through Cold Coffee, so Cold Coffee, matcha, tea, baked goods and food are
// missing rather than guessed. Prices are CAD as shown; a range is a size or
// preparation spread. Not rendered anywhere yet (no café page, no menu table).

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const TEN_DEAN_MENU: MenuSection[] = [
  {
    title: 'Feature drinks',
    items: [
      { name: 'Nitro Honey Oat Latte', description: 'Oat latte sweetened with house honey syrup and infused with nitrogen', price: '$8.00' },
      { name: 'Strawberry Matcha Latte', description: 'House-made strawberry syrup, single origin matcha, milk of choice', price: '$7.00' },
      { name: 'Coconut Mango Matcha Latte', description: 'Layered matcha with mango premix, coconut jelly and milk. Iced only', price: '$8.00' },
      { name: 'Yuzu Honey Fizz', description: 'Sparkling yuzu honey drink, with espresso or Ceylon tea concentrate. Iced only', price: '$7.00' },
    ],
  },
  {
    title: 'Hot coffee',
    items: [
      { name: 'Double Espresso', price: '$4.50' },
      { name: 'Hot Americano', price: '$4.75' },
      { name: 'Drip Coffee', price: '$3.75–$4.75' },
      { name: 'Pour Over', price: '$7.00–$14.00' },
      { name: 'Cortado', price: '$4.75' },
      { name: 'Flat White', price: '$5.50' },
      { name: 'Cappuccino', price: '$5.50' },
      { name: 'Latte', price: '$6.00' },
      { name: 'Mocha', price: '$6.25' },
    ],
  },
  {
    title: 'Cold coffee (partial)',
    items: [
      { name: 'Iced Coffee', price: '$5.25' },
      { name: 'Iced Americano', price: '$5.25' },
    ],
  },
];
