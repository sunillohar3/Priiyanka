import { useEffect } from 'react';

/**
 * Lightweight per-page SEO: sets document.title and the meta description
 * without adding a dependency. Google executes JS and picks these up.
 */
export function useSEO(title, description) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}

export default useSEO;
