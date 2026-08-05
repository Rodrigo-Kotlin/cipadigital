import { supabase } from '../supabase/client'

export const candidatePhotoBucket = 'candidate-photos'
export const candidatePhotoMaxBytes = 2 * 1024 * 1024
export const candidatePhotoAccept = '.jpg,.jpeg,.png,.webp'

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export function validateCandidatePhoto(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (
    !allowedTypes.has(file.type) ||
    !extension ||
    !['jpg', 'jpeg', 'png', 'webp'].includes(extension)
  )
    return 'Use uma imagem JPG, JPEG, PNG ou WebP.'
  if (file.size > candidatePhotoMaxBytes) return 'A foto deve ter no máximo 2 MB.'
  return null
}

function extensionFor(file: File): string {
  return allowedTypes.get(file.type) ?? file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
}

export function candidatePhotoPath(electionSlug: string, candidateId: string, file: File): string {
  return `elections/${electionSlug}/${candidateId}.${extensionFor(file)}`
}

function pathFromPublicUrl(photoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${candidatePhotoBucket}/`
  const markerIndex = photoUrl.indexOf(marker)
  return markerIndex >= 0 ? decodeURIComponent(photoUrl.slice(markerIndex + marker.length)) : null
}

export async function uploadCandidatePhoto(
  electionSlug: string,
  candidateId: string,
  file: File,
  previousPhotoUrl?: string | null,
) {
  if (!supabase) return { url: null, error: new Error('SUPABASE_NOT_CONFIGURED') }
  const path = candidatePhotoPath(electionSlug, candidateId, file)
  const upload = await supabase.storage.from(candidatePhotoBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })
  if (upload.error) return { url: null, error: upload.error }
  const { data } = supabase.storage.from(candidatePhotoBucket).getPublicUrl(path)
  const previousPath = previousPhotoUrl ? pathFromPublicUrl(previousPhotoUrl) : null
  if (previousPath && previousPath !== path)
    await supabase.storage.from(candidatePhotoBucket).remove([previousPath])
  return { url: data.publicUrl, error: null }
}

export async function removeCandidatePhoto(photoUrl: string | null) {
  if (!supabase || !photoUrl) return { error: null }
  const path = pathFromPublicUrl(photoUrl)
  if (!path) return { error: null }
  return supabase.storage.from(candidatePhotoBucket).remove([path])
}
