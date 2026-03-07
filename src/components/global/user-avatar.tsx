import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";

export default function UserAvatar() {
  const { data } = useAuth();

  if (!data?.user.avatar) {
    return (
      <Image
        width={24}
        height={24}
        alt="User logo"
        className="rounded-full"
        src={`https://ui-avatars.com/api/?name=${data?.user.name}&background=7c79d4&color=fff`}
      />
    );
  }
}
