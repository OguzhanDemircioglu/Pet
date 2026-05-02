import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

// Backend admin paneli ürün/kategori/site ayarı güncelleyince çağırır.
// Header: X-Revalidate-Secret = REVALIDATE_SECRET (env'den)
//
// Body:
//   { tags?: string[], paths?: string[] }
// Örnek:
//   { tags: ['catalog', 'product-mama-12kg'], paths: ['/urun/mama-12kg'] }

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const tags: string[] = Array.isArray(body.tags) ? body.tags : []
    const paths: string[] = Array.isArray(body.paths) ? body.paths : []

    for (const tag of tags) revalidateTag(tag, 'max')
    for (const path of paths) revalidatePath(path)

    return NextResponse.json({
      success: true,
      revalidated: { tags, paths },
      timestamp: Date.now(),
    })
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: e instanceof Error ? e.message : 'Revalidation failed',
    }, { status: 500 })
  }
}
