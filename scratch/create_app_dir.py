import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

src_app = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/app'

# layout.tsx
layout_tsx = """import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '../context/ThemeContext'
import './globals.css'
import '../App.css'

export const metadata = {
  title: 'ThinkRoom AI',
  description: 'AI Workspace and Chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
"""
create_file(os.path.join(src_app, 'layout.tsx'), layout_tsx)

# page.tsx (Landing)
page_tsx = """"use client";

import { useRouter } from 'next/navigation';
import LandingPage from '../LandingPage';

export default function Home() {
  const router = useRouter();
  
  return (
    <LandingPage 
      onEnterChat={() => router.push('/chat')}
      onEnterResources={() => router.push('/resources')}
    />
  );
}
"""
create_file(os.path.join(src_app, 'page.tsx'), page_tsx)

# chat/page.tsx
chat_page = """"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ChatPage from '../components/ChatPage'; // Need to separate ChatPage from App.jsx

export default function Chat() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in'); // Or home page if sign-in is managed there
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <ChatPage />;
}
"""
create_file(os.path.join(src_app, 'chat/page.tsx'), chat_page)

# resources/page.tsx
resources_page = """"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ResourceBoard from '../ResourceBoard';

export default function Resources() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <ResourceBoard onBack={() => router.push('/')} />;
}
"""
create_file(os.path.join(src_app, 'resources/page.tsx'), resources_page)

# loading.tsx
loading_tsx = """export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-xl font-semibold text-slate-400">Loading...</div>
    </div>
  );
}
"""
create_file(os.path.join(src_app, 'loading.tsx'), loading_tsx)

# error.tsx
error_tsx = """"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
      <p className="text-slate-400">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
"""
create_file(os.path.join(src_app, 'error.tsx'), error_tsx)

# not-found.tsx
not_found_tsx = """import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-3xl font-bold text-slate-200">Not Found</h2>
      <p className="text-slate-400">Could not find requested resource</p>
      <Link href="/" className="rounded bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700">
        Return Home
      </Link>
    </div>
  )
}
"""
create_file(os.path.join(src_app, 'not-found.tsx'), not_found_tsx)

# globals.css
globals_css = """@import "tailwindcss";

/* Preserve existing global styles if any from App.css will be imported in layout */
"""
create_file(os.path.join(src_app, 'globals.css'), globals_css)

print("Created Next.js app directory structure")
