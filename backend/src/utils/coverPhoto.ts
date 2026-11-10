interface BasePhoto {
  url: string,
  altText: string,
}
interface PhotoWithPosition extends BasePhoto {
  position: number,
}
interface BaseItem {
  id: string,
  title: string,
  category: {
    key: string,
    name: string,
  },
  condition: string,
  childAgeMinMonths: string,
  childAgeMaxMonths: string,
  city: string,
  state: string,
  status: string,
}
export interface ItemWithPhotos extends BaseItem {
  photos: PhotoWithPosition[]
}
export interface ItemWithCoverPhoto extends BaseItem {
  coverPhoto: BasePhoto | null,
}
export const getItemWithCoverPhoto = (item: ItemWithPhotos): ItemWithCoverPhoto => {
  const firstPhoto = item.photos.sort((a: PhotoWithPosition, b: PhotoWithPosition) => a.position - b.position)[0]
  let coverPhoto: BasePhoto | null = null;
  let position: number | null;

  if (firstPhoto) {
    ({ position, ...coverPhoto } = firstPhoto);
  }

  const { photos, ...baseItem } = item
  return {
    ...baseItem,
    coverPhoto
  }
}
