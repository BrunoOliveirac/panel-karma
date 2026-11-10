"use client";

import Image from "next/image";

interface UserAvatarProps {
  name: string;
  size?: number;
  avatar?: string | null;
  className?: string;
}

/**
 * First letters used when a user has no photo.
 * Two words use the first letter of each; a single word uses its first two letters.
 */
function initialsFromName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "?";

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function UserAvatar({
  name,
  avatar,
  className,
  size = 24,
}: UserAvatarProps) {
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

  if (avatar) {
    return (
      <Image
        alt={name}
        src={avatar}
        width={size}
        height={size}
        unoptimized
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#7c79d4] font-medium leading-none text-white ${className ?? ""}`}
    >
      {initialsFromName(name)}
    </span>
  );
}
