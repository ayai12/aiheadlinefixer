"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Wand2,
  Hash,
  Images,
  Mic2,
  Megaphone,
  Radar,
  Clapperboard,
  Handshake,
  LineChart,
  CalendarClock,
} from "lucide-react";

export function CreatorSuiteSidebar() {
  const pathname = usePathname();

  const tools = [
    {
      name: "Headline Fixer",
      href: "/headline-fixer",
      Icon: Wand2,
    },
    {
      name: "Hashtag Finder",
      href: "/hashtag-finder",
      Icon: Hash,
    },
    {
      name: "Carousel Maker",
      href: "/carousel-maker",
      Icon: Images,
    },
    {
      name: "Podcast Hooks",
      href: "/podcast-hooks",
      Icon: Mic2,
    },
    {
      name: "Engagement Booster",
      href: "/engagement-booster",
      Icon: Megaphone,
    },
    {
      name: "Trend Radar",
      href: "/trend-radar",
      Icon: Radar,
    },
    {
      name: "Caption & Hook Generator",
      href: "/caption-hook-generator",
      Icon: Clapperboard,
    },
    {
      name: "Brand Deal Pitch Builder",
      href: "/brand-pitch-builder",
      Icon: Handshake,
    },
    {
      name: "Analytics & Post Optimizer",
      href: "/analytics-optimizer",
      Icon: LineChart,
    },
    {
      name: "Content Calendar & Planner",
      href: "/content-calendar",
      Icon: CalendarClock,
    },
  ];

  return (
    <>
      <SidebarHeader className="px-3 py-2">
        <div className="text-sm font-semibold tracking-wide text-sidebar-foreground/90">
          Creator Suite
        </div>
        <div className="text-xs text-sidebar-foreground/60">
          Multi-tool platform for creators
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Creator Suite</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map(({ name, href, Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={!!active}>
                      <Link href={href} className="flex items-center gap-2">
                        <Icon className="text-sidebar-foreground" />
                        <span>{name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pro Plan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/pro" className="flex flex-col items-start">
                    <span>Creator Suite Bundle</span>
                    <span className="text-xs text-muted-foreground">
                      Headline Fixer + Hashtag Finder + Carousel Maker + Podcast Hooks + Engagement Booster + Trend Radar + Caption & Hook Generator + Brand Deal Pitch Builder + Analytics & Post Optimizer + Content Calendar & Planner
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
