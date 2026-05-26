import { useRef, useState } from 'react';

import { resolveAssetUrl, uploadMedia } from '../api';
import { Button } from './Button';

export type MediaItem = {
  url: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
};

type AcceptType = 'image' | 'video' | 'mixed';

type Props = {
  label: string;
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  accept?: AcceptType;
  multiple?: boolean;
  maxItems?: number;
  primaryUrl?: string | null;
  onSetPrimary?: (url: string) => void;
  readOnly?: boolean;
  helperText?: string;
};

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
const imageMaxSize = 5 * 1024 * 1024;
const videoMaxSize = 50 * 1024 * 1024;

const getAcceptAttr = (accept: AcceptType) => {
  if (accept === 'image') return 'image/jpeg,image/png,image/webp';
  if (accept === 'video') return 'video/mp4,video/quicktime,video/webm';
  return 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';
};

const getFileMediaType = (file: File, accept: AcceptType): MediaItem['type'] | null => {
  if ((accept === 'image' || accept === 'mixed') && imageTypes.includes(file.type)) return 'image';
  if ((accept === 'video' || accept === 'mixed') && videoTypes.includes(file.type)) return 'video';
  return null;
};

export const MediaUploader = ({
  label,
  value,
  onChange,
  accept = 'image',
  multiple = false,
  maxItems = multiple ? 9 : 1,
  primaryUrl,
  onSetPrimary,
  readOnly = false,
  helperText
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || readOnly) return;
    setError(null);
    setUploading(true);
    try {
      const nextItems: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const mediaType = getFileMediaType(file, accept);
        if (!mediaType) throw new Error(accept === 'video' ? '视频格式不支持' : accept === 'image' ? '图片格式不支持' : '文件格式不支持');
        if (mediaType === 'image' && file.size > imageMaxSize) throw new Error('图片不能超过 5MB');
        if (mediaType === 'video' && file.size > videoMaxSize) throw new Error('视频不能超过 50MB');
        const uploaded = await uploadMedia(file);
        nextItems.push({ url: uploaded.url, type: uploaded.type, name: uploaded.name, size: uploaded.size });
      }
      const merged = multiple ? [...value, ...nextItems].slice(0, maxItems) : nextItems.slice(0, 1);
      onChange(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => onChange(value.filter((_, currentIndex) => currentIndex !== index));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...value];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[#2f2f2f]">{label}</div>
          {helperText ? <div className="mt-1 text-xs text-[#8c8c8c]">{helperText}</div> : null}
        </div>
        {!readOnly ? (
          <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? '上传中...' : value.length ? '继续上传' : '点击上传'}
          </Button>
        ) : null}
      </div>

      <input ref={inputRef} className="hidden" type="file" accept={getAcceptAttr(accept)} multiple={multiple} onChange={(event) => void handleFiles(event.target.files)} />

      {error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

      {value.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#e9e2d6] bg-[#f5f1ea] p-6 text-center text-sm text-[#8c8c8c]">
          暂无媒体文件，请上传图片或视频
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => {
            const assetUrl = resolveAssetUrl(item.url);
            return (
              <div key={`${item.url}-${index}`} className="rounded-2xl border border-[#e9e2d6] bg-[#f5f1ea] p-3">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white">
                  {item.type === 'video' ? (
                    <video className="h-full w-full object-cover" src={assetUrl ?? undefined} controls />
                  ) : (
                    <img
                      className="h-full w-full object-cover"
                      src={assetUrl ?? undefined}
                      alt={item.name ?? '上传图片'}
                      onError={(event) => {
                        event.currentTarget.replaceWith(Object.assign(document.createElement('div'), { className: 'flex h-full items-center justify-center text-xs text-red-700', textContent: '图片加载失败' }));
                      }}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#8c8c8c]">
                  <span>{item.type === 'video' ? '视频' : primaryUrl === item.url ? '主封面' : '图片'}</span>
                  {!readOnly ? (
                    <div className="flex gap-2">
                      {onSetPrimary && item.type === 'image' ? (
                        <button type="button" className="text-[#7a8b6f]" onClick={() => onSetPrimary(item.url)}>
                          设主图
                        </button>
                      ) : null}
                      {multiple ? (
                        <>
                          <button type="button" onClick={() => move(index, -1)}>
                            上移
                          </button>
                          <button type="button" onClick={() => move(index, 1)}>
                            下移
                          </button>
                        </>
                      ) : null}
                      <button type="button" className="text-[#c27b48]" onClick={() => removeAt(index)}>
                        删除
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
