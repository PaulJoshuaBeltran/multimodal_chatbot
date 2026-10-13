// src/components/dialogs/ImagePreviewDialog.tsx
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import Image from 'next/image'
import { ImagePreviewDialogProps } from '@/src/types/sidebar_dialog'

const MARGIN = '2rem'

export default function ImagePreviewDialog({
  attachment,
  imageRatio, // width / height
  open,
  onOpenChange,
}: ImagePreviewDialogProps) {
  if (!attachment) return null

  const ratio = imageRatio || 1

  const imageWidth = `min(calc(90vw - 2 * ${MARGIN}), calc((90dvh - 2 * ${MARGIN}) * ${ratio}))`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
          !h-auto !max-w-none !max-h-none
          overflow-hidden border-none
        "
        style={{
          backgroundColor: 'var(--gray3)',
          paddingTop: MARGIN,
          width: `calc(${imageWidth} + 2 * ${MARGIN})`,
        }}
      >
        <DialogTitle className="sr-only">{attachment.fileName}</DialogTitle>

        <div
          className="relative mx-auto"
          style={{ width: imageWidth, aspectRatio: ratio }}
        >
          <Image
            src={attachment.url}
            alt={attachment.fileName}
            fill
            sizes="90vw"
            className="object-contain"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}