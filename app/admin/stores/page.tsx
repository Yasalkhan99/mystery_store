'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  Store,
  isSlugUnique,
} from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    subStoreName: '',
    slug: '',
    description: '',
    logoUrl: '',
    seoTitle: '',
    seoDescription: '',
    isTrending: false,
    layoutPosition: null,
    categoryId: null,
  });
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('file');
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreviewRows, setUploadPreviewRows] = useState<string[][]>([]);
  const [uploadPreviewError, setUploadPreviewError] = useState<string | null>(null);
  const [uploadingBulkStores, setUploadingBulkStores] = useState(false);
  const [supabaseStores, setSupabaseStores] = useState<Store[]>([]);
  let newStores = [...stores, ...supabaseStores];
  console.log("newStores: ", newStores);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Validate slug uniqueness
  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug || slug.trim() === '') {
      setSlugError('Slug is required');
      return false;
    }

    // Check slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    const isUnique = await isSlugUnique(slug);
    if (!isUnique) {
      setSlugError('This slug is already taken. Please use a different one.');
      return false;
    }

    setSlugError('');
    return true;
  };
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    let currentLine = '';
    let inQuotes = false;

    const pushLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const cells = line
        // Split on commas that are not inside quotes
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((cell) =>
          cell
            .replace(/^"|"$/g, '') // remove surrounding quotes
            .replace(/""/g, '"') // unescape double quotes
            .trim()
        );
      rows.push(cells);
    };

    for (const line of lines) {
      if (!inQuotes) {
        currentLine = line;
      } else {
        currentLine += `\n${line}`;
      }

      // Walk characters to track quotes, taking into account escaped double quotes ("")
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          const isEscaped = i + 1 < line.length && line[i + 1] === '"';
          if (isEscaped) {
            i++; // skip the escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        }
      }

      if (!inQuotes) {
        pushLine(currentLine);
        currentLine = '';
      }
    }

    // Handle any remaining buffered line
    if (currentLine && !inQuotes) {
      pushLine(currentLine);
    }

    return rows;
  };

  const handleStoresFileChange = (file: File | null) => {
    if (!file) {
      setUploadPreviewRows([]);
      setUploadPreviewError(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      setUploadPreviewRows([]);
      setUploadPreviewError('Preview currently supports only CSV files. Please upload a .csv file.');
      return;
    }

    file
      .text()
      .then((text) => {
        const rows = parseCsv(text);
        setUploadPreviewRows(rows);
        setUploadPreviewError(null);
      })
      .catch((error) => {
        console.error('Error reading CSV file:', error);
        setUploadPreviewRows([]);
        setUploadPreviewError('Failed to read CSV file. Please try again.');
      });
  };

  const normalizeBoolean = (value: string | undefined | null): boolean => {
    if (!value) return false;
    const v = value.toString().trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 't'].includes(v);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadPreviewRows.length) {
      setUploadPreviewError('Please select a CSV file before uploading.');
      return;
    }

    const [headerRow, ...dataRows] = uploadPreviewRows;
    if (!headerRow || !dataRows.length) {
      setUploadPreviewError('The CSV file appears to be empty.');
      return;
    }

    const header = headerRow.map((h) => h.toString().trim().toLowerCase());
    const indexOf = (name: string) => header.indexOf(name.toLowerCase());

    const idxStoreName = indexOf('store_name');
    const idxDescription = indexOf('description');
    const idxLogoUrl = indexOf('store_logo_url');
    const idxIsTrending = indexOf('isTrending');
    const idxSeoTitle = indexOf('seoTitle');
    const idxSeoDescription = indexOf('seoDescription'); // as per Supabase column name
    const idxSlug = indexOf('slug');
    const idxSubStoreName = indexOf('subStoreName') !== -1 ? indexOf('subStoreName') : indexOf('subStoreName'); // handle minor naming variations

    if (idxStoreName === -1 || idxDescription === -1) {
      setUploadPreviewError('CSV must include at least "store_name" and "description" columns.');
      return;
    }

    const supabaseRows = dataRows
      .map((row) => {
        const store_name = row[idxStoreName] || '';
        const description = row[idxDescription] || '';

        if (!store_name && !description) return null;

        return {
          store_name,
          description,
          store_logo_url: idxLogoUrl !== -1 ? (row[idxLogoUrl] || null) : null,
          isTrending: idxIsTrending !== -1 ? normalizeBoolean(row[idxIsTrending]) : false,
          seoTitle: idxSeoTitle !== -1 ? (row[idxSeoTitle] || null) : null,
          seoDescription: idxSeoDescription !== -1 ? (row[idxSeoDescription] || null) : null,
          slug: idxSlug !== -1 ? (row[idxSlug] || null) : null,
          subStoreName: idxSubStoreName !== -1 ? (row[idxSubStoreName] || null) : null,
        };
      })
      .filter((row) => row !== null) as {
        store_name: string;
        description: string;
        store_logo_url?: string | null;
        isTrending?: boolean;
        seoTitle?: string | null;
        seoDescription?: string | null;
        slug?: string | null;
        subStoreName?: string | null;
      }[];

    if (!supabaseRows.length) {
      setUploadPreviewError('No valid data rows found in CSV.');
      return;
    }

    setUploadingBulkStores(true);
    setUploadPreviewError(null);

    try {
      // Upload to Supabase via API only (no Firebase mirror)
      const response = await fetch('/api/stores/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: supabaseRows }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Bulk upload failed.');
      }

      alert(`Successfully uploaded ${supabaseRows.length} stores.`);
      setShowUploadModal(false);
      setUploadPreviewRows([]);
      setUploadPreviewError(null);
      fetchStores();
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadPreviewError(
        error instanceof Error ? error.message : 'Failed to upload stores. Please try again.'
      );
    } finally {
      setUploadingBulkStores(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    const data = await getStores();
    setStores(data);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [storesData, categoriesData, supabaseResponse] = await Promise.all([
        getStores(),
        getCategories(),
        fetch('/api/stores/supabase')
          .then((res) => res.json())
          .catch((err) => {
            console.error('Error fetching Supabase stores:', err);
            return { success: false, stores: [] };
          }),
      ]);
      const supabaseList: Store[] = Array.isArray(supabaseResponse?.stores)
        ? (supabaseResponse.stores as Store[])
        : [];
      setSupabaseStores(supabaseList);
      setStores(storesData);
      setCategories(categoriesData);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate slug
    if (!formData.slug || formData.slug.trim() === '') {
      alert('Please enter a slug for the store');
      return;
    }

    const slugValid = await validateSlug(formData.slug);
    if (!slugValid) {
      return;
    }

    // Check if layout position is already taken
    if (formData.layoutPosition && formData.isTrending) {
      const storesAtPosition = stores.filter(
        s => s.layoutPosition === formData.layoutPosition && s.isTrending
      );
      if (storesAtPosition.length > 0) {
        if (!confirm(`Layout ${formData.layoutPosition} is already assigned to "${storesAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other store
        await updateStore(storesAtPosition[0].id!, { layoutPosition: null });
      }
    }

    // Use Cloudinary URL directly if it's valid, only extract if malformed
    let logoUrlToSave: string | undefined = undefined;
    if (logoUrl && logoUrl.trim() !== '') {
      if (isCloudinaryUrl(logoUrl)) {
        // Check if URL is malformed (has /image/image/upload/)
        if (logoUrl.includes('/image/image/upload/') || logoUrl.match(/res\.cloudinary\.com\/image\//)) {
          // Extract to fix malformed URL
          logoUrlToSave = extractOriginalCloudinaryUrl(logoUrl);
          console.log('🔧 Fixed malformed Cloudinary URL:', { original: logoUrl, fixed: logoUrlToSave });
        } else {
          // Use Cloudinary URL directly (it's already correct)
          logoUrlToSave = logoUrl;
          console.log('✅ Using Cloudinary URL directly:', logoUrlToSave);
        }
      } else {
        // For non-Cloudinary URLs, use as-is
        logoUrlToSave = logoUrl;
      }
    }

    // Only set layoutPosition if store is trending
    const layoutPositionToSave = formData.isTrending ? formData.layoutPosition : null;

    const storeData: Omit<Store, 'id'> = {
      name: formData.name || '',
      subStoreName: formData.subStoreName || undefined,
      slug: formData.slug || '',
      description: formData.description || '',
      logoUrl: logoUrlToSave,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
      isTrending: formData.isTrending || false,
      layoutPosition: layoutPositionToSave,
      categoryId: formData.categoryId || null,
    };

    const result = await createStore(storeData);

    if (result.success) {
      fetchStores();
      setShowForm(false);
      setFormData({
        name: '',
        subStoreName: '',
        slug: '',
        description: '',
        logoUrl: '',
        seoTitle: '',
        seoDescription: '',
        isTrending: false,
        layoutPosition: null,
        categoryId: null,
      });
      setSlugError('');
      setAutoGenerateSlug(true);
      setLogoUrl('');
      setExtractedLogoUrl(null);
      setStoreUrl('');
      setLogoFile(null);
      setLogoPreview(null);
      setUploadingToCloudinary(false);
      setLogoUploadMethod('file');
      setFileInputKey(prev => prev + 1);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
    } else {
      setExtractedLogoUrl(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this store?')) {
      // Check if it's a Supabase store
      const isSupabaseStore = supabaseStores.some(s => s.id === id || s.slug === id);
      
      if (isSupabaseStore) {
        try {
          const res = await fetch(`/api/stores/supabase/by-id/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          
          if (res.ok && data.success) {
            // Refresh stores
            const [storesData, supabaseResponse] = await Promise.all([
              getStores(),
              fetch('/api/stores/supabase').then(res => res.json()).catch(err => ({ success: false, stores: [] }))
            ]);
            
            const supabaseList: Store[] = Array.isArray(supabaseResponse?.stores)
              ? (supabaseResponse.stores as Store[])
              : [];
              
            setStores(storesData);
            setSupabaseStores(supabaseList);
          } else {
            alert(`Failed to delete store from Supabase: ${data.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Error deleting Supabase store:', err);
          alert('Failed to delete store. Check console for details.');
        }
      } else {
        await deleteStore(id);
        const data = await getStores();
        setStores(data);
      }
    }
  };

  const handleToggleTrending = async (store: Store) => {
    if (store.id) {
      const newTrendingStatus = !store.isTrending;
      // If removing from trending, also clear layout position
      const updates: Partial<Store> = {
        isTrending: newTrendingStatus,
        ...(newTrendingStatus ? {} : { layoutPosition: null })
      };
      await updateStore(store.id, updates);
      fetchStores();
    }
  };

  const handleAssignLayoutPosition = async (store: Store, position: number | null) => {
    if (!store.id) return;

    // Check if position is already taken by another store
    if (position !== null) {
      const storesAtPosition = stores.filter(
        s => s.id !== store.id && s.layoutPosition === position && s.isTrending
      );
      if (storesAtPosition.length > 0) {
        if (!confirm(`Layout ${position} is already assigned to "${storesAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other store
        await updateStore(storesAtPosition[0].id!, { layoutPosition: null });
      }
    }

    await updateStore(store.id, { layoutPosition: position });
    fetchStores();
  };

  const handleExtractFromUrl = async () => {
    if (!storeUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storeUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-populate form fields
        setFormData({
          name: data.name || formData.name || '',
          description: data.description || formData.description || '',
          isTrending: formData.isTrending || false,
          layoutPosition: formData.layoutPosition || null,
        });

        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
        }

        // Show success message
        alert(`Successfully extracted data from ${data.name || 'the website'}!`);
      } else {
        alert(`Failed to extract metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract metadata. Please check the URL and try again.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Stores</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUploadPreviewRows([]);
              setUploadPreviewError(null);
              setShowUploadModal(true);
            }}
            className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Upload Stores
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : 'Create New Store'}
          </button>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upload Stores</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close upload modal"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleBulkUpload}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="storesUploadFile"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Select file to upload
                </label>
                <input
                  id="storesUploadFile"
                  name="storesUploadFile"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleStoresFileChange(file);
                  }}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports CSV or Excel files containing store data.
                </p>
              </div>

              <div>
                <div className="text-gray-700 text-sm font-semibold mb-2">Expected Columns for Stores:</div>
                <div className="text-gray-500 text-xs">
                  <ul className="list-disc list-inside flex flex-wrap gap-2">
                    <li>Store Name</li>
                    <li>Store Logo URL</li>
                    <li>Description</li>
                    <li>Slug</li>
                    <li>Sub Store Name</li>
                    <li>SEO Title</li>
                    <li>SEO Description</li>
                    <li>Category ID</li>
                    <li>Category Name</li>
                    <li>Trending</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-gray-700 text-sm font-semibold mb-2">
                  Preview (first 50 rows)
                </div>
                {uploadPreviewError && (
                  <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {uploadPreviewError}
                  </div>
                )}
                {uploadPreviewRows.length === 0 ? (
                  <div className="rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-xs text-gray-400">
                    Select a CSV file to see a preview here.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          {uploadPreviewRows[0].map((header, index) => (
                            <th
                              key={index}
                              className="whitespace-nowrap px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200"
                            >
                              {header || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreviewRows.slice(1, 51).map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="whitespace-nowrap px-3 py-1 border-b border-gray-100 text-gray-700"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingBulkStores}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingBulkStores ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Store
          </h2>

          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="storeUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Store Info from URL (e.g., nike.com, amazon.com)
            </label>
            <div className="flex gap-2">
              <input
                id="storeUrl"
                name="storeUrl"
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="Enter website URL (e.g., nike.com or https://nike.com)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !storeUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract store name, logo, description, and other information from the website.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                  Store Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Store Name (e.g., Nike)"
                  value={formData.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      // Auto-generate slug from name only if auto-generate is enabled
                      slug: autoGenerateSlug ? generateSlug(name) : formData.slug
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="subStoreName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Sub Store Name (Displayed on store page)
                </label>
                <input
                  id="subStoreName"
                  name="subStoreName"
                  type="text"
                  placeholder="Sub Store Name (e.g., Nike Official Store)"
                  value={formData.subStoreName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, subStoreName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will be displayed on the store page when visiting the store
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slug" className="block text-gray-700 text-sm font-semibold">
                    Slug (URL-friendly name)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={(e) => {
                        const isAuto = e.target.checked;
                        setAutoGenerateSlug(isAuto);
                        // If enabling auto-generate, update slug from name
                        if (isAuto && formData.name) {
                          setFormData({ ...formData, slug: generateSlug(formData.name) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>Auto-generate from name</span>
                  </label>
                </div>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder={autoGenerateSlug ? "Auto-generated from name" : "Enter custom slug (e.g., nike-store)"}
                  value={formData.slug || ''}
                  onChange={async (e) => {
                    // If auto-generate is enabled, don't allow manual editing
                    if (autoGenerateSlug) return;

                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setFormData({ ...formData, slug });
                    if (slug) {
                      await validateSlug(slug);
                    } else {
                      setSlugError('');
                    }
                  }}
                  disabled={autoGenerateSlug}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${slugError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    } ${autoGenerateSlug ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  required
                />
                {slugError && (
                  <p className="mt-1 text-xs text-red-600">{slugError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  URL will be: /stores/{formData.slug || 'slug'}
                  {autoGenerateSlug && <span className="text-blue-600 ml-2">(Auto-generated)</span>}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Logo Upload Method</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="file"
                    checked={logoUploadMethod === 'file'}
                    onChange={(e) => {
                      setLogoUploadMethod('file');
                      setLogoUrl('');
                      setExtractedLogoUrl(null);
                    }}
                    className="mr-2"
                  />
                  File Upload
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="url"
                    checked={logoUploadMethod === 'url'}
                    onChange={(e) => {
                      setLogoUploadMethod('url');
                      setLogoFile(null);
                    }}
                    className="mr-2"
                  />
                  URL (Cloudinary)
                </label>
              </div>

              {logoUploadMethod === 'file' ? (
                <>
                  <label htmlFor="logo" className="sr-only">Logo (PNG / SVG / JPG)</label>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setLogoFile(file);

                      if (file) {
                        // Show preview immediately
                        setLogoPreview(URL.createObjectURL(file));

                        // Automatically upload to Cloudinary
                        setUploadingToCloudinary(true);
                        try {
                          // Convert file to base64
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              const base64 = result.split(',')[1]; // Remove data URL prefix
                              resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });

                          // Upload to Cloudinary via API
                          const uploadResponse = await fetch('/api/coupons/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              fileName: file.name,
                              contentType: file.type || 'image/png',
                              base64: base64,
                            }),
                          });

                          const uploadData = await uploadResponse.json();

                          if (uploadData.success && uploadData.logoUrl) {
                            // Set the Cloudinary URL automatically
                            const cloudinaryUrl = uploadData.logoUrl;
                            setLogoUrl(cloudinaryUrl);
                            setExtractedLogoUrl(cloudinaryUrl);

                            // Switch to URL method to show the uploaded URL
                            setLogoUploadMethod('url');

                            console.log('✅ Logo uploaded to Cloudinary:', cloudinaryUrl);
                            alert('✅ Logo uploaded to Cloudinary successfully! URL has been set.');
                          } else {
                            console.error('❌ Upload failed:', uploadData.error);
                            alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('❌ Error uploading to Cloudinary:', error);
                          alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setUploadingToCloudinary(false);
                        }
                      } else {
                        setLogoPreview(null);
                        setLogoUrl('');
                        setExtractedLogoUrl(null);
                      }
                    }}
                    className="w-full"
                    key={`file-input-${fileInputKey}`}
                    disabled={uploadingToCloudinary}
                  />
                  {uploadingToCloudinary && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                    Logo URL (Cloudinary URL)
                  </label>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={logoUrl || ''}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://res.cloudinary.com/..."
                  />
                  {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                      <strong>Extracted Original URL:</strong>
                      <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                    </div>
                  )}
                </>
              )}

              {/* Show Cloudinary URL if uploaded */}
              {logoUrl && logoUploadMethod === 'url' && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                  <strong>✅ Uploaded to Cloudinary:</strong>
                  <div className="mt-1 break-all text-xs">{logoUrl}</div>
                </div>
              )}

              {/* Logo Preview */}
              {(logoPreview || logoUrl) && (
                <div className="mt-2">
                  <img
                    src={logoPreview || (extractedLogoUrl || logoUrl)}
                    alt="Logo preview"
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Store Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">SEO Settings (Browser Tab Hover)</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="seoTitle" className="block text-gray-700 text-sm font-semibold mb-2">
                    SEO Title
                  </label>
                  <input
                    id="seoTitle"
                    name="seoTitle"
                    type="text"
                    placeholder="e.g., Kohl's US - Best Coupons & Deals 2025"
                    value={formData.seoTitle || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seoTitle: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={60}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This title will appear when hovering over the browser tab. Recommended: 50-60 characters.
                    {formData.seoTitle && <span className="ml-2 text-blue-600">({formData.seoTitle.length} characters)</span>}
                  </p>
                </div>
                <div>
                  <label htmlFor="seoDescription" className="block text-gray-700 text-sm font-semibold mb-2">
                    SEO Description
                  </label>
                  <textarea
                    id="seoDescription"
                    name="seoDescription"
                    placeholder="e.g., Get exclusive Kohl's coupons and promo codes. Save up to 50% on fashion, home, and more!"
                    value={formData.seoDescription || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seoDescription: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This description will appear when hovering over the browser tab. Recommended: 150-160 characters.
                    {formData.seoDescription && <span className="ml-2 text-blue-600">({formData.seoDescription.length} characters)</span>}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-gray-700 text-sm font-semibold mb-2">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId || ''}
                onChange={(e) => {
                  const categoryId = e.target.value || null;
                  setFormData({ ...formData, categoryId });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Assign this store to a category
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  id="isTrending"
                  name="isTrending"
                  type="checkbox"
                  checked={formData.isTrending || false}
                  onChange={(e) => {
                    const isTrending = e.target.checked;
                    setFormData({
                      ...formData,
                      isTrending,
                      // Clear layout position if trending is disabled
                      layoutPosition: isTrending ? formData.layoutPosition : null
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isTrending" className="text-gray-700">Mark as Trending</label>
              </div>

              <div>
                <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Layout Position (1-8)
                </label>
                <select
                  id="layoutPosition"
                  name="layoutPosition"
                  value={formData.layoutPosition || ''}
                  onChange={(e) => {
                    const position = e.target.value ? parseInt(e.target.value) : null;
                    setFormData({
                      ...formData,
                      layoutPosition: position,
                      // Auto-enable trending if layout position is assigned
                      isTrending: position !== null ? true : formData.isTrending
                    });
                  }}
                  disabled={!formData.isTrending && !formData.layoutPosition}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = stores.some(
                      s => s.layoutPosition === pos && s.isTrending && s.id
                    );
                    const takenBy = stores.find(
                      s => s.layoutPosition === pos && s.isTrending && s.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.name})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isTrending && !formData.layoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Trending" or select a layout position</p>
                )}
                {formData.layoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Store will be placed at Layout {formData.layoutPosition} in Trending Stores section
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Store
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading stores...</div>
      ) : newStores.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No stores created yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Store Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Trending
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Layout Position
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {newStores.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="h-12 w-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {store.id}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {store.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                      {store.description}
                    </td> 
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleTrending(store)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${store.isTrending
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {store.isTrending ? 'Trending' : 'Not Trending'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={store.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(store, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!store.isTrending}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!store.isTrending && (
                        <p className="text-xs text-gray-400 mt-1">Enable Trending first</p>
                      )}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(store.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

