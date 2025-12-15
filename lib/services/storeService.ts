import { createClient } from '@/lib/supabase/client'

export interface Store {
  id?: string
  name: string
  subStoreName?: string
  slug?: string
  description: string
  logoUrl?: string
  voucherText?: string
  seoTitle?: string
  seoDescription?: string
  isTrending?: boolean
  layoutPosition?: number | null
  categoryId?: string | null
  createdAt?: string
}

const supabase = createClient()

export async function getStores(): Promise<Store[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting stores:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      subStoreName: item.sub_store_name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url,
      voucherText: item.voucher_text,
      seoTitle: item.seo_title,
      seoDescription: item.seo_description,
      isTrending: item.featured,
      layoutPosition: item.layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting stores:', error)
    return []
  }
}

export async function getTrendingStores(): Promise<(Store | null)[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('featured', true)
      .not('layout_position', 'is', null)
      .order('layout_position', { ascending: true })
      .limit(8)

    if (error) {
      console.error('Error getting trending stores:', error)
      return Array(8).fill(null)
    }

    const layoutSlots: (Store | null)[] = Array(8).fill(null)
    ;(data || []).forEach((item: any) => {
      if (item.layout_position >= 1 && item.layout_position <= 8) {
        layoutSlots[item.layout_position - 1] = {
          id: item.id,
          name: item.name,
          subStoreName: item.sub_store_name,
          slug: item.slug,
          description: item.description || '',
          logoUrl: item.logo_url,
          voucherText: item.voucher_text,
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          isTrending: item.featured,
          layoutPosition: item.layout_position,
          categoryId: item.category_id,
          createdAt: item.created_at,
        }
      }
    })

    return layoutSlots
  } catch (error) {
    console.error('Error getting trending stores:', error)
    return Array(8).fill(null)
  }
}

export async function createStore(store: Omit<Store, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .insert({
        name: store.name,
        sub_store_name: store.subStoreName,
        slug: store.slug,
        description: store.description,
        logo_url: store.logoUrl,
        voucher_text: store.voucherText,
        seo_title: store.seoTitle,
        seo_description: store.seoDescription,
        featured: store.isTrending || false,
        layout_position: store.layoutPosition,
        category_id: store.categoryId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating store:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating store:', error)
    return { success: false, error }
  }
}

export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error getting store:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      subStoreName: data.sub_store_name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.logo_url,
      voucherText: data.voucher_text,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      isTrending: data.featured,
      layoutPosition: data.layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting store:', error)
    return null
  }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.error('Error getting store by slug:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      subStoreName: data.sub_store_name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.logo_url,
      voucherText: data.voucher_text,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      isTrending: data.featured,
      layoutPosition: data.layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting store by slug:', error)
    return null
  }
}

export async function isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
  try {
    let query = supabase.from('stores').select('id').eq('slug', slug)

    if (excludeStoreId) {
      query = query.neq('id', excludeStoreId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking slug uniqueness:', error)
      return false
    }

    return (data || []).length === 0
  } catch (error) {
    console.error('Error checking slug uniqueness:', error)
    return false
  }
}

export async function updateStore(id: string, updates: Partial<Store>) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateData.name = updates.name
    if (updates.subStoreName !== undefined) updateData.sub_store_name = updates.subStoreName
    if (updates.slug !== undefined) updateData.slug = updates.slug
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl
    if (updates.voucherText !== undefined) updateData.voucher_text = updates.voucherText
    if (updates.seoTitle !== undefined) updateData.seo_title = updates.seoTitle
    if (updates.seoDescription !== undefined) updateData.seo_description = updates.seoDescription
    if (updates.isTrending !== undefined) updateData.featured = updates.isTrending
    if (updates.layoutPosition !== undefined) updateData.layout_position = updates.layoutPosition
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId

    const { error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating store:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating store:', error)
    return { success: false, error }
  }
}

export async function deleteStore(id: string) {
  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting store:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting store:', error)
    return { success: false, error }
  }
}

export async function getStoresByCategoryId(categoryId: string): Promise<Store[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting stores by category:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      subStoreName: item.sub_store_name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url,
      voucherText: item.voucher_text,
      seoTitle: item.seo_title,
      seoDescription: item.seo_description,
      isTrending: item.featured,
      layoutPosition: item.layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting stores by category:', error)
    return []
  }
}
