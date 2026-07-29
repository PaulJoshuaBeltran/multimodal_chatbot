import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import Image from 'next/image'
import { AspectRatio } from '../ui/aspect-ratio'
import { ImagePreviewDialogProps } from '@/src/types/props'

export default function ModelManager({
  attachment,
  imageRatio,
  open,
  onOpenChange
}: ImagePreviewDialogProps
) {
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
      className="max-w-2xl border-none p-2 sm:max-w-2xl"
      style={{ backgroundColor: 'var(--gray3)' }}
      >
      <DialogTitle className="sr-only">{attachment!.fileName}</DialogTitle>
      <AspectRatio ratio={imageRatio} className="overflow-hidden rounded-lg">
          <Image
            src={attachment!.url}
            alt={attachment!.fileName}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-contain"
          />
      </AspectRatio>
      </DialogContent>
  </Dialog>
)
}