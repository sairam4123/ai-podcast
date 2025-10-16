// djb2 is a hash function created by Daniel J. Bernstein, which is known for
// its simplicity and speed. It generates a hash value from a string by iterating
// through each character, performing bitwise operations and multiplications to
// produce a unique hash value. The result is often used for quick lookups in
// hash tables or to create unique identifiers from strings.

import { cn } from "../lib/cn";

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash >>> 0; // ensure unsigned 32-bit
  }
  return hash;
}

const backgroundColors = {
  0: "bg-sky-500",
  1: "bg-red-500",
  2: "bg-green-500",
  3: "bg-yellow-500",
  4: "bg-orange-500",
  5: "bg-red-500",
} as const;

export const ProfileAvatarIcon = ({
  imageUrl,
  id,
  imageClassName,
  className,
}: {
  imageUrl?: string;
  id?: string; // uuid
  className?: string;
  imageClassName?: string;
  addBackground?: boolean; // if true, adds a background color
}) => {
  // id = id?.trim() || "";

  console.log("ProfileAvatarIcon", { imageUrl, id });
  const hashedId = djb2(id ?? "") % 6;

  console.log("Hashed ID:", hashedId);

  if (!imageUrl && !id) {
    return (
      <div
        className={cn(
          "w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center",
          className
        )}
      >
        <img
          src="/avatars/null.png"
          alt="Default Avatar"
          className="w-8 h-8 rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full border-sky-50 border-2 overflow-hidden",
        backgroundColors[hashedId as keyof typeof backgroundColors] ?? "",
        className
      )}
    >
      <img
        src={imageUrl ?? `/avatars/${hashedId}.png`}
        alt="Avatar"
        className={`w-full h-full object-cover ${imageClassName}`}
      />
    </div>
  );
};
