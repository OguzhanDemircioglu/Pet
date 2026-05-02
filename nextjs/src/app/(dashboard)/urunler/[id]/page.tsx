'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/products/ProductForm'
import { saasApi, type ProductDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [p, setP] = useState<ProductDto | null>(null)

  useEffect(() => {
    saasApi.getProduct(Number(id)).then(setP).catch((e) => toast.error(e.message))
  }, [id])

  if (!p) return <p className="text-gray-500">Yükleniyor…</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{p.name}</h1>
      <ProductForm
        initial={{ name: p.name, sku: p.sku, price: p.price, stock: p.stock, active: p.active }}
        showSku={false}
        showActive
        submitLabel="Güncelle"
        onSubmit={async (v) => {
          await saasApi.updateProduct(p.id, { name: v.name, price: v.price, stock: v.stock, active: v.active })
          toast.success('Güncellendi')
          router.push('/urunler')
        }}
      />
    </div>
  )
}
