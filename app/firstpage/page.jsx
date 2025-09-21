"use client"
import { SignInButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

export default function WelcomeSignIn() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Starfield */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Multiple sets of stars with different animations */}
        <div className="starfield starfield1"></div>
        <div className="starfield starfield2"></div>
        <div className="starfield starfield3"></div>
      </div>

      <div className="relative z-10 text-center text-white px-6 max-w-md">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to Focus App
        </h1>
        <p className="text-2xl mb-8 drop-shadow-md">
          Please sign in to continue
        </p>
        <SignInButton mode="modal">
          <button className="inline-flex items-center space-x-3 bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-colors active:scale-95 transform">
            <LogIn className="w-6 h-6" />
            <span>Sign In</span>
          </button>
        </SignInButton>
      </div>

      {/* Styles */}
      <style jsx>{`
        .starfield {
          position: absolute;
          top: 0;
          left: 0;
          width: 200vw; 
          height: 200vh; 
          background: transparent;
          overflow: hidden;
          pointer-events: none;
        }
        .starfield::after {
          content: "";
          position: absolute;
          width: 3px;
          height: 3px;
          background: white;
          border-radius: 50%;
          box-shadow:
            10vw 15vh white,
            20vw 80vh white,
            35vw 25vh white,
            45vw 60vh white,
            70vw 40vh white,
            80vw 85vh white,
            95vw 60vh white,
            110vw 20vh white,
            130vw 10vh white,
            140vw 70vh white,
            160vw 50vh white,
            170vw 80vh white,
            190vw 20vh white;
          animation: twinkle 5s linear infinite alternate;
          opacity: 0.8;
          will-change: opacity;
        }
        .starfield1::after {
          animation-delay: 0s;
        }
        .starfield2::after {
          animation-delay: 2s;
          box-shadow:
            15vw 10vh white,
            30vw 75vh white,
            50vw 22vh white,
            60vw 55vh white,
            75vw 35vh white,
            85vw 90vh white,
            105vw 65vh white,
            120vw 25vh white,
            135vw 15vh white,
            155vw 75vh white,
            170vw 60vh white,
            180vw 85vh white,
            200vw 30vh white;
        }
        .starfield3::after {
          animation-delay: 4s;
          box-shadow:
            12vw 18vh white,
            25vw 77vh white,
            40vw 30vh white,
            55vw 65vh white,
            65vw 40vh white,
            90vw 88vh white,
            112vw 68vh white,
            125vw 22vh white,
            145vw 12vh white,
            165vw 72vh white,
            185vw 55vh white,
            195vw 78vh white,
            210vw 33vh white;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3 }
          50% { opacity: 1 }
        }
      `}</style>
    </div>
  );
}
