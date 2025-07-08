// djb2 is a hash function created by Daniel J. Bernstein, which is known for 
// its simplicity and speed. It generates a hash value from a string by iterating
// through each character, performing bitwise operations and multiplications to
// produce a unique hash value. The result is often used for quick lookups in
// hash tables or to create unique identifiers from strings.

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return hash >>> 0; // unsigned 32‑bit
}


export const ProfileAvatarIcon = ({imageUrl, id}: {
    imageUrl?: string;
    id?: string; // uuid
}) => {

    // id = id?.trim() || "";

    console.log("ProfileAvatarIcon", {imageUrl, id});
    const hashedId = djb2(id ?? "") % 6;

    if (!imageUrl && !id) {
        return <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <img src="/avatars/null.png" alt="Default Avatar" className="w-8 h-8 rounded-full" />
        </div>
    }

    return (
        <div className="w-10 h-10 rounded-full border-sky-950 border-2 overflow-hidden">
            <img
                src={imageUrl ?? `/avatars/${hashedId}.png`}
                alt="Avatar"
                className="w-full h-full object-cover"
            />
        </div>
    );
}