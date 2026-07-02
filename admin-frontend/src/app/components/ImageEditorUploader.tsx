import { useRef, useState, type ChangeEvent } from 'react';

import { resolveAssetUrl, uploadMedia } from '../api';

type Props = {
  title?: string;
  coverUrl: string | null;
  images: string[];
  max?: number;
  disabled?: boolean;
  onCoverChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  tip?: string;
};

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageEditorUploader = ({
  title = '图片编辑',
  coverUrl,
  images,
  max = 8,
  disabled = false,
  onCoverChange,
  onImagesChange,
  tip
}: Props) => {
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allImages = [coverUrl, ...images].filter((item): item is string => Boolean(item));
  const total = allImages.length;
  const canAdd = total < max && !disabled && !uploading;

  const syncImages = (next: string[]) => {
    onCoverChange(next[0] ?? null);
    onImagesChange(next.slice(1, max));
  };

  const uploadFiles = async (files: File[], replaceIndex: number | null = null) => {
    if (!files.length || disabled) return;
    const validFiles = files.filter((file) => allowedMimeTypes.includes(file.type));
    if (!validFiles.length) {
      setError('图片格式不支持，请上传 jpg、jpeg、png 或 webp');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const uploaded = await uploadMedia(file);
        if (uploaded.type !== 'image') throw new Error('请上传图片文件');
        uploadedUrls.push(uploaded.url);
      }

      if (replaceIndex !== null) {
        const next = [...allImages];
        next[replaceIndex] = uploadedUrls[0];
        syncImages(next.slice(0, max));
        return;
      }

      syncImages([...allImages, ...uploadedUrls].slice(0, max));
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      setEditingIndex(null);
    }
  };

  const handleAdd = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    await uploadFiles(files.slice(0, Math.max(max - total, 0)));
  };

  const handleReplace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || editingIndex === null) return;
    await uploadFiles([file], editingIndex);
  };

  const removeAt = (index: number) => {
    const next = allImages.filter((_, itemIndex) => itemIndex !== index);
    syncImages(next);
  };

  return (
    <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
      <input ref={editInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleReplace(event)} />

      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-xl font-semibold text-[#2f2f2f]">{title}</h3>
        <span className="text-base text-[#8c8c8c]">{total}/{max}</span>
        {total ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => syncImages([])}
            className="rounded-lg px-2 py-1 text-sm text-[#6f6a61] transition hover:bg-[#f5f1ea] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            清空
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4">
        {canAdd ? (
          <label className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f4] text-5xl font-light text-[#b8b2a8] transition hover:bg-[#f0ebe3] hover:text-[#6f8b62]">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => void handleAdd(event)} />
            <span aria-hidden="true">+</span>
            <span className="sr-only">上传图片</span>
          </label>
        ) : null}

        {allImages.map((url, index) => {
          const src = resolveAssetUrl(url);
          return (
            <div key={`${url}-${index}`} className="group relative h-28 w-28 overflow-hidden rounded-2xl border border-[#e9e2d6] bg-[#f5f1ea]">
              {src ? <img src={src} alt={index === 0 ? '封面图' : `图片 ${index + 1}`} className="h-full w-full object-cover" /> : null}
              <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white">{index + 1}</span>
              {index === 0 ? <span className="absolute right-2 top-2 rounded-full bg-[#6f8b62] px-2 py-0.5 text-xs font-semibold text-white">封面</span> : null}
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full bg-black/55 text-lg leading-none text-white transition group-hover:flex"
              >
                ×
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => {
                  setEditingIndex(index);
                  editInputRef.current?.click();
                }}
                className="absolute inset-x-3 bottom-3 rounded-full bg-black/55 py-1 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100"
              >
                编辑
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-[#8c8c8c]">
        {uploading ? '上传中...' : (tip ?? (max === 1 ? '支持 jpg / jpeg / png / webp，建议使用正方形头像，仅上传 1 张。' : `支持 jpg / jpeg / png / webp，封面与图片使用相同尺寸，最多上传 ${max} 张。`))}
      </div>
      {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
    </div>
  );
};
