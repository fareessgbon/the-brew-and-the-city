import { redirect } from 'next/navigation';

// /partners and /for-cafes are the same page — the partner pitch, pricing,
// City Card explanation, FAQ, and application form all live at /for-cafes;
// this just gives partners a second, equally valid URL to land on.
export default function PartnersPage() {
  redirect('/for-cafes');
}
