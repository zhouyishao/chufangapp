import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { uploadImage } from '../api';
import { Button } from './Button';
import { ImagePreview } from './ImagePreview';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

type Props = {
  label?: string;
  value: string | null;
  helperText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (url: string | null) => void;
};

export const UploadImage = ({ label = '封面图片上传', value, helperText, disabled = false, readOnly = false, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const openPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!allowedMimeTypes.includes(file.type)) {
      setError('图片格式不支持，请上传 jpg、jpeg、png 或 webp');
      return;
    }

    if (file.size > maxImageSize) {
      setError('图片不能超过 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl((previous) => {
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
      return previewUrl;
    });

    try {
      const result = await uploadImage(file);
      onChange(result.url);
      setLocalPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 text-xs text-[#8c8c8c]">{label}</div>
      <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFileChange(event)} />
        {value || localPreviewUrl ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <ImagePreview src={localPreviewUrl ?? value} alt={label} className="h-32 w-full rounded-2xl md:w-48" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="text-sm font-medium text-[#2f2f2f]">{uploading ? '正在上传图片' : '已上传图片'}</div>
              <div className="break-all text-xs text-[#8c8c8c]">{value ?? '本地预览，上传完成后保存地址'}</div>
              {readOnly ? null : (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" disabled={disabled || uploading} onClick={openPicker}>
                    {uploading ? '上传中...' : '重新上传'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled || uploading}
                    onClick={() => {
                      setError(null);
                      setLocalPreviewUrl((previous) => {
                        if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
                        return null;
                      });
                      onChange(null);
                    }}
                  >
                    删除图片
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {readOnly ? (
              <ImagePreview src={null} alt={label} className="min-h-40 w-full rounded-2xl" />
            ) : (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={openPicker}
                className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8cebe] bg-[#f5f1ea] px-4 py-8 text-center transition hover:border-[#7a8b6f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-sm font-medium text-[#2f2f2f]">{uploading ? '上传中...' : '点击上传图片'}</span>
                <span className="mt-2 text-xs text-[#8c8c8c]">支持 jpg / jpeg / png / webp，单张不超过 5MB</span>
              </button>
            )}
          </div>
        )}
        {helperText ? <div className="mt-3 text-xs text-[#8c8c8c]">{helperText}</div> : null}
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </div>
    </div>
  );
};
