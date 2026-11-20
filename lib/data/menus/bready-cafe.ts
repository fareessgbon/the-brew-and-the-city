// Bready Cafe's "Menu highlights" from breadycafe.com/menu (read
// 2026-09-19). UNCONFIRMED — the café hasn't verified any of this. Their site
// shows six highlighted items with no prices and points to ordering
// elsewhere for the full menu, so this is a sample, not the menu. Not
// rendered anywhere yet.

export interface MenuItem {
  name: string;
  description?: string;
}

export const BREADY_HIGHLIGHTS: MenuItem[] = [
  { name: 'Croissant Benedict', description: 'Butter croissant, 2 poached eggs, avocado, house pesto, hollandaise, side salad' },
  { name: 'Vanilla and Berries Cube Croissant', description: 'Cube croissant with vanilla custard crème, raspberry nappage and fresh blueberries' },
  { name: 'Matcha Latte' },
  { name: 'Fig and Pear Salad', description: 'Figs, pear, dried cranberries, caramelized pecans, baked sweet potato, pumpkin seeds, goat cheese, sage vinaigrette' },
  { name: 'Scrambled Eggs & Smoked Salmon', description: 'Parmesan scrambled eggs, smoked salmon, avocado, cream cheese, on a multigrain bagel with pickled vegetables' },
  { name: 'Corned Beef Turkey Bacon Melt Panini', description: 'Corned beef, turkey bacon, cheddar, gouda, roasted bell pepper spread, aioli, on focaccia with green salad' },
];
