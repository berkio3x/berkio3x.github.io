import { getCollection } from 'astro:content';

// Published posts, newest first. Drafts show in `npm run dev` only.
export async function getPosts() {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
