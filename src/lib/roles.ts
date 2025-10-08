// Helper functions to work with multi-role strings
// Separated from auth.ts to avoid importing server-only dependencies in client components

export function hasRole(rolesString: string, role: string): boolean {
  return rolesString.split(',').map(r => r.trim()).includes(role);
}

export function getRolesArray(rolesString: string): string[] {
  return rolesString.split(',').map(r => r.trim());
}
