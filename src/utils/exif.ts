import exifr from 'exifr'
import ColorThief from 'colorthief'

export type ExifResult = {
  camera_make?: string
  camera_model?: string
  lens?: string
  aperture?: string
  shutter_speed?: string
  iso?: number
  focal_length?: string
  gps_lat?: number
  gps_lng?: number
  taken_at?: number
  raw_exif_json?: string
}

export const extractExif = async (file: File): Promise<ExifResult> => {
  const exif: any = await exifr.parse(file, { gps: true, translateValues: false })
  if (!exif) return {}

  const takenAt = exif.DateTimeOriginal ? Math.floor(exif.DateTimeOriginal.getTime() / 1000) : undefined

  return {
    camera_make: exif.Make,
    camera_model: exif.Model,
    lens: exif.LensModel,
    aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
    shutter_speed: exif.ExposureTime ? `${exif.ExposureTime}s` : undefined,
    iso: exif.ISO,
    focal_length: exif.FocalLength ? `${exif.FocalLength}mm` : undefined,
    gps_lat: exif.latitude,
    gps_lng: exif.longitude,
    taken_at: takenAt,
    raw_exif_json: JSON.stringify(exif)
  }
}

export const dominantColorHex = async (file: File): Promise<string | undefined> => {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load image failed'))
    })
    img.src = url
    await loaded

    const thief = new ColorThief()
    const [r, g, b] = thief.getColor(img)
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
  } finally {
    URL.revokeObjectURL(url)
  }
}
