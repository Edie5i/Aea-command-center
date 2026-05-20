import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { posts, getPost } from '@/lib/blog-data';
import { AppFooter } from '@/components/footer';
import { Clock, ArrowLeft } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — Auto Escuela Americana`,
    description: post.description,
    alternates: {
      canonical: `https://www.autoescuelaamericana.com/blog/${post.slug}`,
    },
    robots: 'index, follow',
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.autoescuelaamericana.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      siteName: 'Auto Escuela Americana',
      locale: 'es_MX',
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

function renderContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold mt-8 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('| ')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split('|').filter(Boolean).map((h) => h.trim());
      const rows = tableLines.slice(2).map((row) =>
        row.split('|').filter(Boolean).map((cell) => cell.trim())
      );
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                {headers.map((h, j) => (
                  <th key={j} className="text-left py-2 pr-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className="border-b last:border-0">
                  {row.map((cell, k) => (
                    <td key={k} className="py-2 pr-4 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1 text-muted-foreground my-3">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 space-y-1 text-muted-foreground my-3">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ol>
      );
      continue;
    } else if (line.trim() !== '') {
      elements.push(
        <p
          key={i}
          className="text-muted-foreground leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />
      );
    }

    i++;
  }

  return elements;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline hover:text-foreground">$1</a>');
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const otherPosts = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <nav className="mb-8 text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="truncate">{post.title}</span>
        </nav>

        <article>
          <h1 className="text-3xl font-headline font-bold mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-10 border-b pb-6">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTime} lectura
            </span>
          </div>

          <div className="text-sm">{renderContent(post.content)}</div>
        </article>

        <div className="mt-16 pt-8 border-t">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todos los artículos
          </Link>
        </div>

        {otherPosts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold mb-4">Otros artículos</h2>
            <div className="space-y-4">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block text-sm hover:underline text-muted-foreground hover:text-foreground"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <AppFooter />
    </main>
  );
}
