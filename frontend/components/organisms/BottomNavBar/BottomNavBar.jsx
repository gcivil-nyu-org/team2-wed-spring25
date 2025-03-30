'use client';

import { useRouter, usePathname } from 'next/navigation';
import Icon from '@/components/atom/Icon/Icon';
import { useSidebar } from '@/components/ui/sidebar'; // ← Import this to trigger the drawer

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar(); // ← This is the new hook

  const isActive = (path) => pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 border-t border-gray-300 flex justify-around items-center z-50 shadow-md">
      <Icon
        src="/icons/house.svg"
        alt="home"
        size="md"
        selected={isActive('/users/home')}
        onClick={() => router.push('/users/home')}
      />

      <Icon
        src="/icons/map.svg"
        alt="map"
        size="md"
        selected={isActive('/users/map')}
        onClick={() => router.push('/users/map')}
      />

      <Icon
        src="/icons/speech.svg"
        alt="forum"
        size="md"
        selected={isActive('/users/forum')}
        onClick={() => router.push('/users/forum')}
      />

      <Icon
        src="/owl-logo.svg"
        alt="settings"
        size="md"
        tooltipText="User Settings"
        onClick={toggleSidebar}
      />
    </nav>
  );
}
