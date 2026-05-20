import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/lib/blog-data';
import { AppFooter } from '@/components/footer';
import { ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — Auto Escuela Americana | Consejos de Manejo en CDMX',
  description:
    'Artículos sobre cómo aprender a manejar en la Ciudad de México: cuántas clases necesitas, automático vs. estándar, cómo sacar tu licencia y más.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/blog',
  },
  robots: 'index, follow',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

export default function BlogPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <nav className="mb-8 text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Blog</span>
        </nav>

        <h1 className="text-3xl font-headline font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-12">
          Consejos y guías para aprender a manejar en la Ciudad de México.
        </p>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="border-b pb-8 last:border-0">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold group-hover:underline mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                  {post.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime} lectura
                  </span>
                  <span className="flex items-center gap-1 text-foreground font-medium group-hover:gap-2 transition-all">
                    Leer <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
