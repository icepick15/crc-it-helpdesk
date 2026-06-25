import { FileText, Image, FileSpreadsheet, FileArchive, File, Download } from 'lucide-react';
import type { Attachment } from '@/lib/types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const SHEET_EXTS = new Set(['xls', 'xlsx', 'csv']);
const ARCHIVE_EXTS = new Set(['zip']);
const DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'txt']);

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return <Image className="h-4 w-4 text-blue-500 shrink-0" />;
  if (SHEET_EXTS.has(ext)) return <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />;
  if (ARCHIVE_EXTS.has(ext)) return <FileArchive className="h-4 w-4 text-amber-600 shrink-0" />;
  if (DOC_EXTS.has(ext)) return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

interface AttachmentListProps {
  attachments: Attachment[];
  showImages?: boolean;
}

export function AttachmentList({ attachments, showImages = true }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => IMAGE_EXTS.has(a.name.split('.').pop()?.toLowerCase() ?? ''));
  const files = attachments.filter((a) => !IMAGE_EXTS.has(a.name.split('.').pop()?.toLowerCase() ?? ''));

  return (
    <div className="space-y-3">
      {showImages && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center hover:ring-2 hover:ring-primary transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end">
                <span className="w-full truncate text-xs text-white bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  {img.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/40 hover:bg-muted transition text-sm group"
            >
              <FileIcon name={file.name} />
              <span className="flex-1 truncate font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
