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
    // Set z-index to 1000 to override everything
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white z-[1000] border-t border-gray-300 flex justify-around items-center shadow-md">

      <Icon
        src="/icons/forum.svg"
        alt="forum"
        size="md"
        tooltipText="Forum"
        selected={isActive('/users/forum')}
        onClick={() => router.push('/users/forum')}
      />

      <Icon
        src="/icons/map.svg"
        alt="map"
        size="md"
        tooltipText="Map"
        selected={isActive('/users/map')}
        onClick={() => router.push('/users/map')}
      />

      <Icon
        src="/icons/settings.svg"
        alt="settings"
        size="md"
        tooltipText="User Settings"
        onClick={toggleSidebar}
      />
    </nav>
  );
}
