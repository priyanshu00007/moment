import {
  ClerkProvider,
} from '@clerk/nextjs';
import './globals.css';
import { Toaster } from 'react-hot-toast';
export const metadata = {
  title: 'Momentum - Focus App',
  description: 'A modern productivity application to boost your focus and manage tasks efficiently.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased" suppressHydrationWarning={true} >
          <div className="min-h-screen bg-gray-50">
            {children}
            <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
