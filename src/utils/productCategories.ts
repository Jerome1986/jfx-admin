import type { CascaderOption } from 'element-plus'
import type { ProductCategory } from '@/types/productCategory'

// 将分类树递归转换为级联选择器选项。
export const toCategoryCascaderOptions = (categories: ProductCategory[]): CascaderOption[] =>
  categories.map((category) => ({
    value: category.id,
    label: category.name,
    ...(category.children?.length
      ? { children: toCategoryCascaderOptions(category.children) }
      : {}),
  }))

// 根据分类编号递归查找从一级分类到当前分类的完整路径。
export const findCategoryPath = (
  categories: ProductCategory[],
  categoryId: number,
  parentPath: number[] = [],
): number[] | undefined => {
  for (const category of categories) {
    const currentPath = [...parentPath, category.id]
    if (category.id === categoryId) return currentPath
    const childPath = findCategoryPath(category.children ?? [], categoryId, currentPath)
    if (childPath) return childPath
  }
}

// 根据分类编号递归获取最末级分类名称。
export const findCategoryName = (
  categories: ProductCategory[],
  categoryId: number,
): string | undefined => {
  for (const category of categories) {
    if (category.id === categoryId) return category.name
    const childName = findCategoryName(category.children ?? [], categoryId)
    if (childName) return childName
  }
}

// 获取级联路径中最终选择的分类编号。
export const lastCategoryId = (path?: number[]) => path?.[path.length - 1]
