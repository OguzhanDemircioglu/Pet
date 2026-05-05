import Link from 'next/link'
import type { Category } from '@/types'

const FALLBACK_CATEGORIES: Pick<Category, 'category_id' | 'category_name' | 'category_slug' | 'emoji'>[] = [
  { category_id: 1, category_name: 'Kedi', category_slug: 'kedi', emoji: '🐱' },
  { category_id: 2, category_name: 'Köpek', category_slug: 'kopek', emoji: '🐶' },
  { category_id: 3, category_name: 'Kuş', category_slug: 'kus', emoji: '🦜' },
  { category_id: 4, category_name: 'Balık', category_slug: 'balik', emoji: '🐠' },
  { category_id: 5, category_name: 'Kemirgen', category_slug: 'kemirgen', emoji: '🐹' },
  { category_id: 6, category_name: 'Sürüngen', category_slug: 'surungen', emoji: '🦎' },
]

interface Props {
  categories: Category[]
}

export default function CategoryBar({ categories }: Props) {
  const roots = categories.length > 0
    ? categories.filter((c) => c.parent_id === null)
    : (FALLBACK_CATEGORIES as Category[])

  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId)

  return (
    <nav className="pt-cat-bar" aria-label="Kategoriler">
      <div className="pt-cat-bar-inner">
        <div className="pt-cat-nav">
          {roots.map((root) => {
            const children = childrenOf(root.category_id)
            return (
              <div key={root.category_id} className="pt-cat-nav-item">
                <Link href={`/kategori/${root.category_slug}`} className="pt-cat-nav-btn">
                  {root.emoji && <span aria-hidden="true">{root.emoji}</span>}
                  {root.category_name}
                  {children.length > 0 && <span className="pt-cat-arrow" aria-hidden="true">▼</span>}
                </Link>
                {children.length > 0 && (
                  <div className="pt-cat-dropdown" role="menu">
                    {children.map((child) => (
                      <Link
                        key={child.category_id}
                        href={`/kategori/${child.category_slug}`}
                        className="pt-drop-item"
                        role="menuitem"
                      >
                        {child.emoji && <span aria-hidden="true">{child.emoji}</span>}
                        {child.category_name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
