// 图片编辑工具函数

/**
 * 旋转图片
 * @param canvas Canvas 元素
 * @param angle 旋转角度（度）
 */
export function rotateImage(canvas: HTMLCanvasElement, angle: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // 创建临时 canvas
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = width
  tempCanvas.height = height
  tempCtx.drawImage(canvas, 0, 0)

  // 清空原 canvas
  ctx.clearRect(0, 0, width, height)

  // 保存状态
  ctx.save()

  // 移动到中心
  ctx.translate(width / 2, height / 2)

  // 旋转
  ctx.rotate((angle * Math.PI) / 180)

  // 绘制原图（逆旋转以保持方向）
  ctx.drawImage(tempCanvas, -width / 2, -height / 2)

  // 恢复状态
  ctx.restore()
}

/**
 * 翻转图片
 * @param canvas Canvas 元素
 * @param direction 翻转方向：'horizontal' 或 'vertical'
 */
export function flipImage(canvas: HTMLCanvasElement, direction: 'horizontal' | 'vertical'): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // 创建临时 canvas
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = width
  tempCanvas.height = height
  tempCtx.drawImage(canvas, 0, 0)

  // 清空原 canvas
  ctx.clearRect(0, 0, width, height)

  ctx.save()

  if (direction === 'horizontal') {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, height)
    ctx.scale(1, -1)
  }

  ctx.drawImage(tempCanvas, 0, 0)

  ctx.restore()
}

/**
 * 应用滤镜
 * @param canvas Canvas 元素
 * @param filter 滤镜类型
 */
export function applyFilter(canvas: HTMLCanvasElement, filter: string): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg
        data[i + 1] = avg
        data[i + 2] = avg
      }
      break

    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      }
      break

    case 'brightness':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3)
        data[i + 1] = Math.min(255, data[i + 1] * 1.3)
        data[i + 2] = Math.min(255, data[i + 2] * 1.3)
      }
      break

    case 'contrast':
      const factor = 1.5
      const intercept = 128 * (1 - factor)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept))
        data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept))
        data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept))
      }
      break

    case 'blur':
      // 简单的模糊效果
      const tempData = new Uint8ClampedArray(data)
      const w = canvas.width
      const h = canvas.height
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * w + (x + kx)) * 4 + c
                sum += tempData[idx]
              }
            }
            data[(y * w + x) * 4 + c] = sum / 9
          }
        }
      }
      break
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * 裁剪为正方形
 * @param canvas Canvas 元素
 */
export function cropToSquare(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = canvas
  const size = Math.min(img.width, img.height)
  const x = (img.width - size) / 2
  const y = (img.height - size) / 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, x, y, size, size, 0, 0, size, size)
}

/**
 * 裁剪为 16:9 比例
 * @param canvas Canvas 元素
 */
export function cropTo16x9(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = canvas
  const ratio = 16 / 9
  let width = img.width
  let height = img.height

  if (width / height > ratio) {
    width = height * ratio
  } else {
    height = width / ratio
  }

  const x = (img.width - width) / 2
  const y = (img.height - height) / 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
}

/**
 * 调整图片缩放
 * @param canvas Canvas 元素
 * @param scale 缩放比例
 */
export function scaleImage(canvas: HTMLCanvasElement, scale: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const newWidth = canvas.width * scale
  const newHeight = canvas.height * scale

  // 创建临时 canvas
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  tempCtx.drawImage(canvas, 0, 0)

  // 清空原 canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制缩放后的图片
  ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight)
}

/**
 * 导出 canvas 为 Blob
 * @param canvas Canvas 元素
 * @param mimeType MIME 类型
 * @param quality 质量 (0-1)
 * @returns Promise<Blob>
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        mimeType,
        quality
      )
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 导出 canvas 为 Data URL
 * @param canvas Canvas 元素
 * @param mimeType MIME 类型
 * @param quality 质量 (0-1)
 * @returns Promise<string>
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/jpeg',
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const dataUrl = canvas.toDataURL(mimeType, quality)
      resolve(dataUrl)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 读取图片文件
 * @param file File 对象
 * @returns Promise<HTMLImageElement>
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
