import { useEffect } from 'react';

const SITE_URL = 'https://techlabssa.co.za';
const SITE_NAME = 'TechLabs Academy SA';
const DEFAULT_DESCRIPTION = 'Hands-on IT support and enterprise administration training in Cape Town with live VMware, Windows Server, Active Directory, Microsoft 365, Intune and helpdesk labs.';

type SeoPage = {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
  schema?: 'academy' | 'course';
};

const pages: Record<string, SeoPage> = {
  '/': { title: 'Practical IT Support Training in Cape Town | TechLabs Academy SA', description: DEFAULT_DESCRIPTION, schema: 'academy' },
  '/courses': { title: 'Practical IT Training Courses in Cape Town | TechLabs Academy SA', description: 'Explore practical IT support and enterprise administration training built around real labs, troubleshooting tickets and instructor guidance.' },
  '/courses/it-support': { title: 'IT Support & Enterprise Administration Bootcamp | TechLabs Academy SA', description: 'Build practical IT support skills through VMware, Windows Server, Active Directory, Microsoft 365, Entra ID, Intune, Defender and PowerShell labs.', schema: 'course' },
  '/courses/it-support/curriculum': { title: 'IT Support Bootcamp Curriculum | TechLabs Academy SA', description: 'Review the practical TechLabs curriculum covering hardware, networking, Windows Server, Active Directory, Microsoft cloud administration, security and helpdesk operations.', schema: 'course' },
  '/labs': { title: 'Hands-on Enterprise IT Labs | TechLabs Academy SA', description: 'Practise IT support in guided VMware labs covering Windows clients, servers, identity, networking, Microsoft cloud services and troubleshooting.' },
  '/how-it-works': { title: 'How TechLabs Practical IT Training Works', description: 'See how TechLabs combines instructor-led sessions, enterprise lab environments, support tickets, assessments and verified completion records.' },
  '/pricing': { title: 'IT Support Bootcamp Pricing | TechLabs Academy SA', description: 'Compare TechLabs IT Support Bootcamp tuition tiers, included practical training, payment options and learner support.' },
  '/intakes': { title: 'Upcoming IT Training Intakes | TechLabs Academy SA', description: 'View upcoming TechLabs IT Support Bootcamp cohorts, dates, delivery formats, capacity and application availability.' },
  '/career': { title: 'Start an IT Support Career | TechLabs Academy SA', description: 'Prepare for junior IT support and enterprise administration work through practical labs, troubleshooting experience and career guidance.' },
  '/about': { title: 'About TechLabs Academy SA | Practical IT Training', description: 'Learn about TechLabs Academy SA and its practical approach to IT support and enterprise administration training in Cape Town.' },
  '/faq': { title: 'IT Support Bootcamp FAQs | TechLabs Academy SA', description: 'Answers about TechLabs course requirements, schedules, practical labs, payments, certificates and learner support.' },
  '/contact': { title: 'Contact TechLabs Academy SA', description: 'Contact TechLabs Academy SA about admissions, upcoming cohorts, course requirements, tuition and student support.' },
  '/apply': { title: 'Apply for the IT Support Bootcamp | TechLabs Academy SA', description: 'Apply for a TechLabs practical IT Support and Enterprise Administration Bootcamp intake.' },
  '/verify': { title: 'Verify a TechLabs Academy Certificate', description: 'Verify a TechLabs Academy SA digital certificate of completion using its certificate number.' },
  '/terms': { title: 'Terms and Conditions | TechLabs Academy SA', description: 'Read the terms and conditions for TechLabs Academy SA training, labs, payments and certificates.' },
  '/privacy': { title: 'Privacy Policy | TechLabs Academy SA', description: 'Read how TechLabs Academy SA collects, uses and protects applicant and student information under POPIA.' },
  '/refund-policy': { title: 'Refund Policy | TechLabs Academy SA', description: 'Read the TechLabs Academy SA cancellation and refund policy for course tuition and seat reservations.' },
};

const setMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
};

const academySchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': `${SITE_URL}/#academy`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  description: DEFAULT_DESCRIPTION,
  address: { '@type': 'PostalAddress', addressLocality: 'Cape Town', addressCountry: 'ZA' },
  areaServed: { '@type': 'Country', name: 'South Africa' },
};

const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  '@id': `${SITE_URL}/courses/it-support#course`,
  name: 'IT Support & Enterprise Administration Bootcamp',
  description: 'Practical instructor-led training in IT support, VMware, Windows Server, Active Directory, Microsoft 365, Entra ID, Intune, Defender and PowerShell.',
  url: `${SITE_URL}/courses/it-support`,
  provider: { '@id': `${SITE_URL}/#academy`, '@type': 'EducationalOrganization', name: SITE_NAME, url: SITE_URL },
  educationalLevel: 'Beginner to intermediate',
  inLanguage: 'en-ZA',
  teaches: ['IT support', 'Windows Server administration', 'Active Directory', 'Microsoft 365 administration', 'Endpoint management', 'PowerShell automation'],
};

const normalizePath = (value: string) => {
  const clean = value.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  if (clean === '/refunds') return '/refund-policy';
  if (clean.startsWith('/verify/')) return '/verify';
  return clean;
};

export function Seo({ path }: { path: string }) {
  useEffect(() => {
    const normalizedPath = normalizePath(path);
    const privateRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/') || normalizedPath === '/student' || normalizedPath.startsWith('/student/');
    const page = pages[normalizedPath] || {
      title: `Page not found | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: normalizedPath,
      noIndex: true,
    };
    const canonicalPath = page.canonicalPath || normalizedPath;
    const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;
    const noIndex = privateRoute || page.noIndex;

    document.title = page.title;
    setMeta('meta[name="description"]', { name: 'description', content: page.description });
    setMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: page.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: page.description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: page.schema === 'course' ? 'website' : 'website' });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_ZA' });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.head.querySelectorAll('script[data-techlabs-schema]').forEach(element => element.remove());
    const schemas = page.schema === 'course' ? [academySchema, courseSchema] : page.schema === 'academy' ? [academySchema] : [];
    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.techlabsSchema = 'true';
      script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    });
  }, [path]);

  return null;
}
