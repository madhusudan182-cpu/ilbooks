import UserClientProfile from "./UserClientProfile";

export function generateStaticParams() {
  return [{ id: 'preview' }]; // 👈 এটিই Next.js বিল্ডকে ওই এরর দেওয়া থেকে আটকাবে
}

export default function Page() {
  return <UserClientProfile />;
}
export const dynamic = 'force-dynamic';

