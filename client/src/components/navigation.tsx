import React from 'react';
import { Link, useLocation } from 'wouter';

export default function Navigation() {
  const [location] = useLocation();
  
  // Helper to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  // Classes for the active and inactive states
  const activeClasses = "px-4 py-3 text-primary border-b-2 border-primary font-medium cursor-pointer";
  const inactiveClasses = "px-4 py-3 text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors duration-200 font-medium cursor-pointer";
  
  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex">
          <Link href="/">
            <div className={isActive('/') ? activeClasses : inactiveClasses}>Today</div>
          </Link>
          <Link href="/calendar">
            <div className={isActive('/calendar') ? activeClasses : inactiveClasses}>Calendar</div>
          </Link>
          <Link href="/stats">
            <div className={isActive('/stats') ? activeClasses : inactiveClasses}>Stats</div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
