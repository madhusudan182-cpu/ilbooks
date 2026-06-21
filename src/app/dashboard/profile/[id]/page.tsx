import { getFirestore, doc, getDoc } from "firebase/firestore";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function OtherUserProfile({ params }: ProfilePageProps) {
  // ১. ফায়ারবেস ডেটাবেজ ইনিশিয়েট করা (কোনো লোকাল ফাইল পাথের ঝামেলা ছাড়া)
  const firestore = getFirestore(); 

  // ২. Next.js 15 অনুযায়ী params অবশই await করতে হবে
  const resolvedParams = await params;
  const targetUserId = resolvedParams.id;

  // ৩. ফায়ারবেস থেকে নির্দিষ্ট ইউজারের ডেটা আনা
  const userDocRef = doc(firestore, "users", targetUserId); 
  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    return (
      <div className="p-10 text-center text-red-500">
        ইউজার খুঁজে পাওয়া যায়নি!
      </div>
    );
  }

  const userData = userSnapshot.data();

  return (
    <div className="p-6 max-w-2xl mx-auto text-white">
      <div className="flex flex-col items-center gap-4">
        <img 
          src={userData.avatarUrl || userData.image || "/default-avatar.png"} 
          alt="Avatar" 
          className="w-24 h-24 rounded-full object-cover border-2 border-orange-500" 
        />
        <h1 className="text-2xl font-bold">{userData.name || userData.username || "Unknown User"}</h1>
        <p className="text-gray-400">ID: {targetUserId}</p>
        <p className="text-sm text-gray-300">{userData.bio || "No bio available"}</p>
      </div>
    </div>
  );
}
