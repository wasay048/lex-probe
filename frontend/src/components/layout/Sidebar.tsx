"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  FolderIcon as FolderIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
} from "@heroicons/react/24/solid";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: pathname === "/dashboard",
    },
    {
      name: "Search & Analysis",
      href: "/dashboard/search",
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      current: pathname.startsWith("/dashboard/search"),
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderIcon,
      iconSolid: FolderIconSolid,
      current: pathname.startsWith("/dashboard/projects"),
    },
    {
      name: "Reports",
      href: "/reports",
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      current: pathname.startsWith("/reports"),
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      current: pathname.startsWith("/dashboard/analytics"),
    },
  ];

  const adminNavigation = [
    {
      name: "Demo Requests",
      href: "/dashboard/admin/demo-requests",
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
      current: pathname.startsWith("/dashboard/admin/demo-requests"),
    },
    {
      name: "User Management",
      href: "/dashboard/admin/users",
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      current: pathname.startsWith("/dashboard/admin/users"),
    },
  ];

  const secondaryNavigation = [
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIconSolid,
      current: pathname.startsWith("/dashboard/settings"),
    },
    {
      name: "Help & Support",
      href: "/dashboard/help",
      icon: QuestionMarkCircleIcon,
      current: pathname.startsWith("/dashboard/help"),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area - visible on mobile when sidebar is open */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 md:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {/* Main navigation */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main
              </h3>
              <ul className="mt-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.current ? item.iconSolid : item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={clsx(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          item.current
                            ? "bg-teal-50 text-teal-700 border-r-2 border-teal-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon
                          className={clsx(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            item.current
                              ? "text-teal-600"
                              : "text-gray-400 group-hover:text-gray-500"
                          )}
                        />
                        {item.name}
                        {item.name === "Search & Analysis" && (
                          <SparklesIcon className="ml-auto h-4 w-4 text-amber-500" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Admin navigation - only show for admin users */}
            {isAdmin && (
              <div>
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
                <ul className="mt-3 space-y-1">
                  {adminNavigation.map((item) => {
                    const Icon = item.current ? item.iconSolid : item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={clsx(
                            "group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                            item.current
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <Icon
                            className={clsx(
                              "mr-3 h-5 w-5 flex-shrink-0",
                              item.current
                                ? "text-blue-600"
                                : "text-gray-400 group-hover:text-gray-500"
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Secondary navigation */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </h3>
              <ul className="mt-3 space-y-1">
                {secondaryNavigation.map((item) => {
                  const Icon = item.current
                    ? item.iconSolid || item.icon
                    : item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={clsx(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          item.current
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon
                          className={clsx(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            item.current
                              ? "text-gray-600"
                              : "text-gray-400 group-hover:text-gray-500"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-r from-teal-50 to-amber-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    Quick Analysis
                  </h4>
                  <p className="text-xs text-gray-600">
                    Start a new cartel detection search
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href="/dashboard/search/new"
                  onClick={onClose}
                  className="block w-full text-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-amber-500 rounded-md hover:from-teal-700 hover:to-amber-600 transition-all duration-200"
                >
                  New Search
                </Link>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500 text-center">
              <p>&copy; 2025 Lex Probe</p>
              <p>AI-Powered Legal Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
