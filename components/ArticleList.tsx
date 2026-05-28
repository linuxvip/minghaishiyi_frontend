import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink, BookOpen } from 'lucide-react';

interface ArticleItem {
  id: number;
  title: string;
  url: string;
  cover_url: string;
  summary: string;
  category: string;
  source: string;
  tags: string;
  published_time: string | null;
}

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    axios
      .get<ArticleItem[]>('/api/articles/')
      .then(({ data }) => setArticles(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // IntersectionObserver — stagger card entrance animation
  useEffect(() => {
    if (loading || articles.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-card-index'));
            setVisibleCards((prev) => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, articles.length]);

  const setCardRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    },
    []
  );

  const parseTags = (tags: string): string[] => {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return tags.split(/[,，]/).filter(Boolean).map((t) => t.trim());
    }
  };

  const handleClick = (url: string) => {
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-stone-100 p-5">
            <div className="h-4 bg-stone-100 rounded w-3/4 mb-3" />
            <div className="h-3 bg-stone-50 rounded w-1/2 mb-2" />
            <div className="h-3 bg-stone-50 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen size={40} className="mx-auto text-stone-200 mb-4 animate-float-bob" />
        <p className="text-sm text-stone-400 font-bold">暂无文章</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <div
          key={article.id}
          ref={setCardRef(index)}
          data-card-index={index}
          onClick={() => handleClick(article.url)}
          className={`group bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-5 ${
            visibleCards.has(index) ? 'animate-card-enter' : 'opacity-0'
          }`}
          style={{
            animationDelay: visibleCards.has(index) ? `${index * 60}ms` : '0ms',
          }}
        >
          <div className="flex items-start gap-4">
            {article.cover_url && (
              <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-100">
                <img
                  src={article.cover_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-stone-800 group-hover:text-amber-700 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <ExternalLink size={14} className="flex-shrink-0 mt-1 text-stone-300 group-hover:text-amber-500 transition-colors" />
              </div>

              {article.summary && (
                <p className="text-xs text-stone-500 leading-relaxed mt-1.5 line-clamp-2">{article.summary}</p>
              )}

              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                {article.source && (
                  <span className="text-[10px] font-bold text-stone-400">{article.source}</span>
                )}
                {article.category && (
                  <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                    {article.category}
                  </span>
                )}
                {parseTags(article.tags).slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] text-stone-300">#{tag}</span>
                ))}
                {article.published_time && (
                  <span className="text-[10px] text-stone-300 ml-auto">
                    {new Date(article.published_time).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArticleList;
