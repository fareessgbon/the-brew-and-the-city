import { OG_SIZE, renderOgImage } from './opengraph-shared';

export const alt = 'Brew and the City — every good café in Calgary, matched to your taste';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return renderOgImage();
}
