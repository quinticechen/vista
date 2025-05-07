
import * as React from "react";
import { Link, LinkProps, useMatch, useResolvedPath } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function NavLink({
  children,
  to,
  className,
  activeClassName = "bg-accent text-accent-foreground",
  ...props
}: NavLinkProps) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <Link
      to={to}
      className={cn(
        "block px-4 py-2 rounded-md hover:bg-accent/80 hover:text-accent-foreground transition-colors",
        match ? activeClassName : "",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
