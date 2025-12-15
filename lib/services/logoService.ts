import { createClient } from '@/lib/supabase/client'

export interface Logo {
  id?: string
  name: string
  logoUrl: string
  websiteUrl?: string
  layoutPosition?: number | null
  createdAt?: string
  updatedAt?: string
}

const supabase = createClient()

export async function createLogoFromUrl(
  name: string,
  logoUrl: string,
  layoutPosition?: number | null,
  websiteUrl?: string
) {
  try {
    // Note: Logos can be stored in stores table or a separate logos table
    // For now, we'll use stores table with a flag or create a separate table
    // Since we don't have a logos table in schema, we'll use stores
    const { data, error } = await supabase
      .from('stores')
      .insert({
        name: name || '',
        logo_url: logoUrl,
        website_url: websiteUrl || logoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating logo:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating logo from URL:', error)
    return { success: false, error }
  }
}

export async function getLogos(): Promise<Logo[]> {
  try {
    // Using stores table for logos (or create separate logos table)
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, logo_url, website_url, created_at, updated_at')
      .not('logo_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting logos:', error)
      return []
    }

    return (data || []).map((item: any, index: number) => ({
      id: item.id,
      name: item.name,
      logoUrl: item.logo_url,
      websiteUrl: item.website_url,
      layoutPosition: index + 1, // Assign sequential positions
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting logos:', error)
    return []
  }
}

export async function getLogoById(id: string): Promise<Logo | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, logo_url, website_url, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error getting logo:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      logoUrl: data.logo_url || '',
      websiteUrl: data.website_url,
      layoutPosition: null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error getting logo:', error)
    return null
  }
}

export async function getLogosWithLayout(): Promise<(Logo | null)[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, logo_url, website_url, created_at, updated_at')
      .not('logo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(18)

    if (error) {
      console.error('Error getting logos with layout:', error)
      return Array(18).fill(null)
    }

    const layoutSlots: (Logo | null)[] = Array(18).fill(null)
    ;(data || []).forEach((item: any, index: number) => {
      if (index < 18) {
        layoutSlots[index] = {
          id: item.id,
          name: item.name,
          logoUrl: item.logo_url || '',
          websiteUrl: item.website_url,
          layoutPosition: index + 1,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }
      }
    })

    return layoutSlots
  } catch (error) {
    console.error('Error getting logos with layout:', error)
    return Array(18).fill(null)
  }
}

export async function updateLogo(id: string, updates: Partial<Logo>) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateData.name = updates.name
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl
    if (updates.websiteUrl) updateData.website_url = updates.websiteUrl

    const { error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating logo:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating logo:', error)
    return { success: false, error }
  }
}

export async function deleteLogo(id: string) {
  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting logo:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting logo:', error)
    return { success: false, error }
  }
}
