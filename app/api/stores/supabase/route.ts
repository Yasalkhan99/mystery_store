import { supabaseServer } from '@/lib/supabase/server';

interface SupabaseStoreRow {
  store_id?: string | number;
  store_name: string;
  description: string;
  store_logo_url?: string | null;
  isTrending?: boolean | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  subStoreName?: string | null;
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('store_id', { ascending: true });

    if (error) {
      console.error('Supabase get stores error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, stores: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rows = (data || []) as SupabaseStoreRow[];

    const stores = rows.map((row) => ({
      id: row.store_id?.toString(),
      name: row.store_name,
      subStoreName: row.subStoreName || undefined,
      slug: row.slug || undefined,
      description: row.description || '',
      logoUrl: row.store_logo_url || undefined,
      seoTitle: row.seoTitle || undefined,
      seoDescription: row.seoDescription || undefined,
      isTrending: row.isTrending ?? false,
      layoutPosition: null,
      categoryId: null,
      createdAt: undefined,
    }));

    return new Response(
      JSON.stringify({ success: true, stores }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase stores GET route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching Supabase stores.',
        stores: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


