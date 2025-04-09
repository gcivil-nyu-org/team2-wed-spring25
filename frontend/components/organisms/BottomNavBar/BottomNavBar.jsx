'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import {
  LayoutList,
  MapPinned,
  Settings,
} from 'lucide-react';

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const isActive = (path) => pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[52px] bg-black text-white z-[1002] border-t border-gray-800 flex justify-around items-center shadow-md">
      
      {/* Forum */}
      <button
        onClick={() => router.push('/users/forum')}
        aria-label="Forum"
        className="flex items-center justify-center"
      >
        <div
          className={`rounded-full p-2 transition-all duration-200 ${
            isActive('/users/forum')
              ? 'bg-white/10 text-white scale-110'
              : 'text-gray-400'
          }`}
        >
          <LayoutList className="w-6 h-6" />
        </div>
      </button>

      {/* Map */}
      <button
        onClick={() => router.push('/users/map')}
        aria-label="Map"
        className="flex items-center justify-center"
      >
        <div
          className={`rounded-full p-2 transition-all duration-200 ${
            isActive('/users/map')
              ? 'bg-white/10 text-white scale-110'
              : 'text-gray-400'
          }`}
        >
          <MapPinned className="w-6 h-6" />
        </div>
      </button>

      {/* Settings */}
      <button
        onClick={toggleSidebar}
        aria-label="Settings"
        className="flex items-center justify-center"
      >
        <div
          className={`rounded-full p-2 transition-all duration-200 ${
            isActive('/users/settings')
              ? 'bg-white/10 text-white scale-110'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-6 h-6" />
        </div>
      </button>
    </nav>
  );
}
