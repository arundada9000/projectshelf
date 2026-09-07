import { redirect } from 'next/navigation';

/** The app area opens on the projects view, which is the primary screen. */
export default function AppIndexPage() {
  redirect('/app/projects');
}
