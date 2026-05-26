import { useEffect, useState } from 'react';

import { resolveAssetUrl } from '../api';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  emptyText?: string;
};

export const ImagePreview = ({ src, alt, className = 'h-12 w-16 rounded-2xl', emptyText = '暂无图片' }: Props) => {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  const fallbackClassName = [
    className,
    'flex items-center justify-center border border-[#e9e2d6] bg-[#f5f1ea] px-2 text-center text-[11px] leading-4 text-[#8c8c8c]'
  ].join(' ');

  if (!resolvedSrc) {
    return <div className={fallbackClassName}>{emptyText}</div>;
  }

  if (failed) {
    return <div className={fallbackClassName}>图片加载失败</div>;
  }

  return <img src={resolvedSrc} alt={alt} className={[className, 'border border-[#e9e2d6] object-cover'].join(' ')} onError={() => setFailed(true)} />;
};
