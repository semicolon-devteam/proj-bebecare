import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/onboarding/'] },
    ],
    sitemap: 'https://bebecare.vercel.app/sitemap.xml',
  }
}
