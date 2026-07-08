import {
  FileText, Image, FileSpreadsheet, FileArchive,
  File, Video, ExternalLink, Download,
} from 'lucide-react';
import type { Attachment } from '@/lib/types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ext(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

// Files the browser can render inline (opens as a viewable page)
const VIEWABLE = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'mp4']);

function FileTypeIcon({ name }: { name: string }) {
  const e = ext(name);
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(e))
    return <Image className="h-4 w-4 text-blue-500 shrink-0" />;
  if (e === 'mp4')
    return <Video className="h-4 w-4 text-purple-500 shrink-0" />;
  if (['xls', 'xlsx', 'csv'].includes(e))
    return <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />;
  if (e === 'zip')
    return <FileArchive className="h-4 w-4 text-amber-600 shrink-0" />;
  if (['pdf', 'doc', 'docx', 'txt'].includes(e))
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

interface AttachmentListProps {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {attachments.map((file) => {
        const isViewable = VIEWABLE.has(ext(file.name));
        return (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-muted/40 hover:bg-muted transition text-sm group"
          >
            <FileTypeIcon name={file.name} />
            <span className="flex-1 truncate font-medium text-xs">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {formatFileSize(file.size)}
            </span>
            {isViewable ? (
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
            ) : (
              <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
            )}
          </a>
        );
      })}
    </div>
  );
}
