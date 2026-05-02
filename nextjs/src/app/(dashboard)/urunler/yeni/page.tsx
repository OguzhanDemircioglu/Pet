'use client'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/products/ProductForm'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function NewProductPage() {
  const router = useRouter()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Yeni Ürün</h1>
      <ProductForm
        showSku
        submitLabel="Oluştur"
        onSubmit={async (v) => {
          try {
            await saasApi.createProduct({ name: v.name, sku: v.sku!, price: v.price, stock: v.stock })
            toast.success('Ürün oluşturuldu')
            router.push('/urunler')
          } catch (e) {
            const err = e as Error & { code?: string }
            if (err.code === 'PLAN_LIMIT_EXCEEDED') {
              toast.error('FREE plan ürün limitine ulaştınız. PRO plana yükseltin.', { duration: 5000 })
            } else {
              toast.error(err.message)
            }
            throw e
          }
        }}
      />
    </div>
  )
}
