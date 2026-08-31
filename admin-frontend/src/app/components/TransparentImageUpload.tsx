import { useRef, useState, type ChangeEvent } from 'react';

import { resolveAssetUrl, uploadMedia } from '../api';

type TransparentImageUploadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  onError: (message: string | null) => void;
};

export const TransparentImageUpload = ({ value, onChange, onError }: TransparentImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMedia(file);
      onChange(result.url);
      onError(null);
    } catch {
      onError('透明实物图上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-[#2f2f2f]">透明实物图</h4>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#81796f]">
            用于首页时令果蔬、分类紧凑卡和菜谱食材清单，不用于详情页顶部主图。请上传 1:1
            透明背景 PNG/WebP，主体居中并保留 10%–12% 留白；未配置时自动使用详情封面图。
          </p>
        </div>
        <span className="shrink-0 text-xs text-[#B7AEA1]">选填</span>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/webp" className="hidden" onChange={handleUpload} />
      {value ? (
        <div className="flex items-center gap-4">
          <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-[#e9e2d6] bg-[#f7f3ed] [background-image:linear-gradient(45deg,#ebe6df_25%,transparent_25%),linear-gradient(-45deg,#ebe6df_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ebe6df_75%),linear-gradient(-45deg,transparent_75%,#ebe6df_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0px] [background-size:16px_16px]">
            <img src={resolveAssetUrl(value)} alt="透明实物图预览" className="h-full w-full object-contain p-3" />
            <div className="pointer-events-none absolute inset-[10%] rounded-xl border border-dashed border-[#7A8B6F]/70">
              <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#64745d]">
                主体安全视觉区
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="rounded-lg border border-[#d8d0c4] bg-white px-4 py-2 text-sm font-medium text-[#53634d] hover:bg-[#f7f4ee] disabled:opacity-60">
              {uploading ? '上传中…' : '更换图片'}
            </button>
            <button type="button" onClick={() => onChange(null)} className="rounded-lg px-4 py-2 text-sm text-[#9f5148] hover:bg-[#f9efec]">
              删除图片
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cfc6b8] bg-[#fdfbf7] text-[#6f8b62] hover:border-[#6f8b62] disabled:opacity-60">
          <span className="text-3xl font-light">+</span>
          <span className="text-xs">{uploading ? '上传中…' : '上传 PNG/WebP'}</span>
        </button>
      )}
    </div>
  );
};
