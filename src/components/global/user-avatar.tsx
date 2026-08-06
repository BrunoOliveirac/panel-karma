"use client";

import Image from "next/image";

interface UserAvatarProps {
  name: string;
  size?: number;
  avatar?: string | null;
  className?: string;
}

export default function UserAvatar({
  size = 24,
  name,
  avatar,
  className,
}: UserAvatarProps) {
  const dimension = size;
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c79d4&color=fff`;
  const isDataUrl = !!avatar?.startsWith("data:");

  if (avatar && isDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={avatar}
        width={dimension}
        height={dimension}
        className={`rounded-full object-cover ${className ?? ""}`}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <Image
      alt={name}
      width={dimension}
      height={dimension}
      unoptimized={!!avatar}
      src={avatar || fallbackSrc}
      className={`rounded-full object-cover ${className ?? ""}`}
    />
  );
}
