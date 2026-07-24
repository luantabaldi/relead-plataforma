export interface NavItem {
  name: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    title: "Foundation",
    items: [
      { name: "Design Tokens", href: "/styleguide" },
    ]
  },
  {
    title: "Components",
    items: [
      { name: "Button", href: "/styleguide/components/button" },
      { name: "Card", href: "/styleguide/components/card" },
      { name: "Table", href: "/styleguide/components/table" },
      { name: "Tabs", href: "/styleguide/components/tabs" },
      { name: "Forms", href: "/styleguide/components/forms" },
      { name: "Overlays", href: "/styleguide/components/overlays" },
      { name: "Charts", href: "/styleguide/components/charts" },
    ]
  }
]
