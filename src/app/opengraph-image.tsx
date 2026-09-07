import { ImageResponse } from 'next/og';
import { OG_SIZE, SocialCard } from '@/lib/og-card';

export const alt = 'ProjectShelf: find and launch your software projects';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(<SocialCard />, { ...size });
}