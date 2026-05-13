import Image from "next/image";

interface UserAvatarProps {
  name: string;
  size?: number;
  avatar?: string;
}

export default function UserAvatar({ size, name, avatar }: UserAvatarProps) {
  if (!avatar) {
    return (
      <Image
        alt="User logo"
        width={size ?? 24}
        height={size ?? 24}
        className="rounded-full"
        src={`https://ui-avatars.com/api/?name=${name}&background=7c79d4&color=fff`}
      />
    );
  }
}
