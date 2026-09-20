import { useEffect } from 'react';
import { categories, getTerm } from '@/data';

type RouteMeta = {
  title: string;
  description: string;
};

const CURRENT_ROUTE_KEY = 'parent-decoder:current-route';
const PREVIOUS_ROUTE_KEY = 'parent-decoder:previous-route';

function categoryFromSlug(slug: string) {
  return categories.find((category) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function readPreviousInternalRoute(current: string) {
  if (typeof window === 'undefined') return '';
  try {
    const previous = window.sessionStorage.getItem(PREVIOUS_ROUTE_KEY) ?? '';
    return previous && previous !== current ? previous : '';
  } catch {
    return '';
  }
}

export function routeMeta(location: string): RouteMeta {
  const path = location.split('?')[0];
  if (path === '/' || path === '/discover') {
    return {
      title: 'Home',
      description: 'A calm, local reference for understanding online language before responding to it.',
    };
  }
  if (path === '/dictionary' || path === '/library') {
    return {
      title: 'Dictionary',
      description: 'Browse Parent Decoder’s local dictionary of online language, context, and conversation guidance.',
    };
  }
  if (path.startsWith('/library/')) {
    const category = categoryFromSlug(safeDecode(path.slice('/library/'.length)));
    return {
      title: category ? `${category} · Dictionary` : 'Category not found',
      description: category
        ? `Browse Parent Decoder entries in the ${category} category.`
        : 'That dictionary category is not in this edition.',
    };
  }
  if (path === '/decoder') {
    return {
      title: 'Decode a message',
      description: 'Use local, deterministic matching to unpack a word, phrase, emoji, or short message.',
    };
  }
  if (path === '/feedback') {
    return {
      title: 'Feedback',
      description: 'Share useful product feedback or report a Parent Decoder term or guide issue without including private information.',
    };
  }
  if (path === '/conversation-starters') {
    return {
      title: 'Conversation starters',
      description: 'Choose a calm conversation mode and keep the focus on context rather than conclusions.',
    };
  }
  if (path === '/saved') {
    return {
      title: 'Saved prompts',
      description: 'Review prompts you deliberately saved in this browser for local reuse.',
    };
  }
  if (path === '/privacy' || path === '/approach') {
    return {
      title: 'Privacy and responsible use',
      description: 'Understand Parent Decoder’s local-only boundaries and responsible-use approach.',
    };
  }
  if (path === '/editorial-review') {
    return {
      title: 'Editorial review',
      description: 'See the local prototype dictionary’s review labels, flags, and verification boundaries.',
    };
  }
  const termSlug = path.match(/^\/(?:term|terms)\/([^/]+)$/)?.[1];
  if (termSlug) {
    const term = getTerm(safeDecode(termSlug));
    return {
      title: term ? `${term.term} · Dictionary` : 'Term not found',
      description: term
        ? `Plain-English context, meanings, and conversation starters for ${term.term}.`
        : 'That phrase is not in this dictionary edition.',
    };
  }
  return {
    title: 'Page not found',
    description: 'The requested Parent Decoder page is not in this edition.',
  };
}

export function RouteQuality({ location }: { location: string }) {
  const meta = routeMeta(location);
  useEffect(() => {
    document.title = `${meta.title} · Parent Decoder`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (description) description.content = meta.description;
    if (ogTitle) ogTitle.content = document.title;
    if (ogDescription) ogDescription.content = meta.description;
    if (twitterTitle) twitterTitle.content = document.title;
    if (twitterDescription) twitterDescription.content = meta.description;
  }, [meta.description, meta.title]);

  useEffect(() => {
    try {
      const previous = window.sessionStorage.getItem(CURRENT_ROUTE_KEY);
      if (previous && previous !== location) {
        window.sessionStorage.setItem(PREVIOUS_ROUTE_KEY, previous);
      }
      window.sessionStorage.setItem(CURRENT_ROUTE_KEY, location);
    } catch {
      // Session history enhancement is optional; browser Back still works.
    }
    const main = document.getElementById('main-content');
    main?.focus({ preventScroll: true });
  }, [location]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {meta.title}
    </div>
  );
}