import UserClientProfile from "../../user/[id]/UserClientProfile";

export function generateStaticParams() {
  return [{ id: 'preview' }]; // এটি Next.js বিল্ডকে এরর দেওয়া থেকে আটকাবে
}

export default function Page() {
  return <UserClientProfile />; 
}
export const dynamic = 'force-static'; 
