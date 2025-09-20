import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
      <div className="max-w-md w-full">
        <SignIn />
      </div>
    </div>
  );
}
