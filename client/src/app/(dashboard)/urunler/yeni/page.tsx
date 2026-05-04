'use client'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/products/ProductForm'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'

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
              swalError('FREE plan ürün limitine ulaştınız. PRO plana yükseltin.', 'Plan limiti aşıldı')
            } else {
              swalError(err.message)
            }
            // No re-throw: ProductForm's inline-banner path is reserved for client-side
            // validation; API errors are owned by the Swal modal here.
            throw e // keep throw so ProductForm catch resets busy via finally
          }
        }}
      />
    </div>
  )
}
