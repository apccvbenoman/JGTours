"use client"

import React, { useState, useEffect, useRef } from 'react'
import { getPackages, addPackage, updatePackage, deletePackage } from '@/lib/actions/packages';
import { supabase } from '@/lib/supabase';
import { FiUploadCloud, FiImage, FiX } from 'react-icons/fi';

type TourPackage = {
  id: number
  title: string
  description: string
  destinations: number
  destination_details: string | null
  inclusions: string | null
  exclusions: string | null
  original_price: number
  price: number
  image: string
}

export default function ProductsPage() {
  const [packages, setPackages] = useState<TourPackage[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinations: 5,
    destination_details: '',
    inclusions: '',
    exclusions: '',
    original_price: 0,
    price: 0,
    image: ''
  })

  const fetchPackages = async () => {
    try {
      const data = await getPackages()
      setPackages((data || []) as TourPackage[])
    } catch (err) {
      console.error('Failed to fetch packages', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    getPackages()
      .then((data) => {
        if (!cancelled) setPackages((data || []) as TourPackage[])
      })
      .catch((error) => console.error('Failed to fetch packages', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    setFormData({ title: '', description: '', destinations: 5, destination_details: '', inclusions: '', exclusions: '', original_price: 0, price: 0, image: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (pkg: TourPackage) => {
    setEditingId(pkg.id)
    setSelectedFile(null)
    setPreviewUrl(pkg.image || null)
    setFormData({
      title: pkg.title,
      description: pkg.description,
      destinations: pkg.destinations,
      destination_details: pkg.destination_details || '',
      inclusions: pkg.inclusions || '',
      exclusions: pkg.exclusions || '',
      original_price: pkg.original_price,
      price: pkg.price,
      image: pkg.image
    })
    setIsModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package? This will instantly remove it from the homepage.')) return
    try {
      await deletePackage(id)
      fetchPackages()
    } catch (err) {
      alert('Failed to delete package')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let imageUrl = formData.image

    // Upload new image to Supabase Storage if a file was selected
    if (selectedFile) {
      try {
        const ext = selectedFile.name.split('.').pop()
        const fileName = `package-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('package-images')
          .upload(fileName, selectedFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('package-images')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      } catch (err) {
        console.error('Image upload failed:', err)
        alert('Failed to upload image. Please try again.')
        setUploading(false)
        return
      }
    }

    const data = new FormData()
    Object.entries({ ...formData, image: imageUrl }).forEach(([key, value]) => {
      data.append(key, value.toString())
    })

    try {
      if (editingId) {
        await updatePackage(editingId, data)
      } else {
        await addPackage(data)
      }
      setIsModalOpen(false)
      fetchPackages()
    } catch (err) {
      alert('Failed to save package')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tour Packages</h1>
          <p className="text-slate-500">Manage packages displayed on the homepage.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-amber-200/40 cursor-pointer"
        >
          + Add Package
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Package' : 'Add New Package'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">All changes will reflect on the homepage immediately.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-5">

              {/* Image Upload Zone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Package Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-44 border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-2xl flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all overflow-hidden group"
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                          <FiUploadCloud size={16} /> Click to change image
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-amber-600">
                      <FiImage size={32} className="opacity-60" />
                      <p className="text-xs font-semibold">Click to upload image</p>
                      <p className="text-[11px] text-amber-500">JPG, PNG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!previewUrl && !editingId && (
                  <p className="text-[11px] text-slate-400">An image is required for new packages.</p>
                )}
              </div>

              {/* Package Title */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Package Title</label>
                <input
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Tour A with Lunch"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Selling Price (₱)</label>
                  <input
                    type="number" required value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Original Price (₱)</label>
                  <input
                    type="number" required value={formData.original_price}
                    onChange={(e) => setFormData({...formData, original_price: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Destinations */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Number of Destinations</label>
                <input
                  type="number" required value={formData.destinations}
                  onChange={(e) => setFormData({...formData, destinations: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={formData.description} required
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the tour package"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Destination Details */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Destination Details</label>
                <textarea
                  value={formData.destination_details}
                  onChange={(e) => setFormData({...formData, destination_details: e.target.value})}
                  placeholder="Enter one destination per line"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Inclusions */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Inclusions & Required Fees</label>
                <textarea
                  value={formData.inclusions}
                  onChange={(e) => setFormData({...formData, inclusions: e.target.value})}
                  placeholder="Enter one inclusion or required fee per line"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Exclusions */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Exclusions</label>
                <textarea
                  value={formData.exclusions}
                  onChange={(e) => setFormData({...formData, exclusions: e.target.value})}
                  placeholder="Enter one exclusion per line"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Saving…' : (editingId ? 'Update Package' : 'Add Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-slate-400 font-medium">No packages yet.</p>
            <p className="text-xs text-slate-400">Click "Add Package" to create your first tour package.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Image</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package Title</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destinations</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Selling Price</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Original Price</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    {pkg.image ? (
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-14 h-10 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                        <FiImage size={16} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{pkg.title}</td>
                  <td className="p-4 text-slate-600">{pkg.destinations} spots</td>
                  <td className="p-4 font-bold text-amber-700">₱{Number(pkg.price).toLocaleString()}</td>
                  <td className="p-4 text-slate-400 line-through text-sm">₱{Number(pkg.original_price).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

