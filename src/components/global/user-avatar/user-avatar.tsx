"use client";

import Image from "next/image";

interface UserAvatarProps {
  name: string;
  size?: number;
  avatar?: string | null;
  className?: string;
}

export default function UserAvatar({
  name,
  avatar,
  className,
  size = 24,
}: UserAvatarProps) {
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c79d4&color=fff`;
  const isDataUrl = !!avatar?.startsWith("data:");

  if (avatar && isDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={avatar}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <Image
      alt={name}
      width={size}
      height={size}
      unoptimized={!!avatar}
      src={avatar || fallbackSrc}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover ${className ?? ""}`}
    />
  );
}
