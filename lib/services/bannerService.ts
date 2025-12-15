import { createClient } from '@/lib/supabase/client'

export interface Banner {
  id?: string
  title: string
  imageUrl: string
  layoutPosition?: number | null
  createdAt?: string
}

const supabase = createClient()

export async function createBanner(title: string, imageFile: File, layoutPosition?: number | null) {
  try {
    // Convert file to base64 and POST to server API for upload
    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

    const base64 = await toBase64(imageFile)
    const res = await fetch('/api/banners/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        fileName: imageFile.name,
        contentType: imageFile.type,
        base64,
        collection: 'banners',
        layoutPosition,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('Server upload failed', { status: res.status, body: json })
      return { success: false, error: json }
    }

    return { success: true, id: json.id }
  } catch (error) {
    console.error('Error creating banner:', error)
    return { success: false, error }
  }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error getting banners:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title || '',
      imageUrl: item.image_url,
      layoutPosition: item.order_index,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting banners:', error)
    return []
  }
}

export async function getBannersWithLayout(): Promise<(Banner | null)[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .eq('position', 'home')
      .not('order_index', 'is', null)
      .order('order_index', { ascending: true })
      .limit(4)

    if (error) {
      console.error('Error getting banners with layout:', error)
      return Array(4).fill(null)
    }

    const layoutSlots: (Banner | null)[] = Array(4).fill(null)
    ;(data || []).forEach((item: any) => {
      if (item.order_index >= 1 && item.order_index <= 4) {
        layoutSlots[item.order_index - 1] = {
          id: item.id,
          title: item.title || '',
          imageUrl: item.image_url,
          layoutPosition: item.order_index,
          createdAt: item.created_at,
        }
      }
    })

    return layoutSlots
  } catch (error) {
    console.error('Error getting banners with layout:', error)
    return Array(4).fill(null)
  }
}

export async function getBannerByLayoutPosition(position: number): Promise<Banner | null> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .eq('order_index', position)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      title: data.title || '',
      imageUrl: data.image_url,
      layoutPosition: data.order_index,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting banner by layout position:', error)
    return null
  }
}

export async function deleteBanner(id: string) {
  try {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting banner:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting banner:', error)
    return { success: false, error }
  }
}

export async function createBannerFromUrl(title: string, imageUrl: string, layoutPosition?: number | null) {
  try {
    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: title || '',
        image_url: imageUrl,
        position: 'home',
        active: true,
        order_index: layoutPosition || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating banner from URL:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id, imageUrl }
  } catch (error) {
    console.error('Error creating banner from URL:', error)
    return { success: false, error }
  }
}

export async function updateBanner(id: string, updates: Partial<Banner>) {
  try {
    const updateData: any = {}

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
    if (updates.layoutPosition !== undefined) updateData.order_index = updates.layoutPosition

    const { error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating banner:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating banner:', error)
    return { success: false, error }
  }
}
