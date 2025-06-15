
import { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  // Public routes don't require any authentication checks
  // All users can access these routes freely
  return <>{children}</>;
};

export default PublicRoute;
