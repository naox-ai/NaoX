import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import * as Icons from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (!cats) { setLoading(false); return; }

      const enriched = await Promise.all(
        cats.map(async (c) => {
          const { count } = await supabase
            .from('agents')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', c.id)
            .eq('status', 'published');
          return { ...c, agent_count: count ?? 0 };
        })
      );
      setCategories(enriched);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse by category</h1>
        <p className="text-gray-500">Find the right AI agent for your use case across {categories.length} categories.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const Icon = Icons[c.icon] || Icons.Box;
            return (
              <Link
                key={c.id}
                to={`/?cat=${c.slug}`}
                className="card card-hover p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-100 group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                    <p className="text-xs text-gray-600 mt-2">{c.agent_count} agent{c.agent_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
