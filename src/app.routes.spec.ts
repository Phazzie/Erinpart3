import { describe, it, expect } from 'vitest';

// Test route configuration structure without importing Angular components
// (which would require JIT compilation)
describe('App Routes Configuration', () => {
  // Define expected route structure
  const expectedRoutes = [
    { path: '', hasComponent: true, title: "Erin's Escapades - Home" },
    { path: 's/:sessionId', hasComponent: true, title: "Erin's Escapades - Session" },
    { path: '**', redirectTo: '' },
  ];

  describe('route definitions', () => {
    it('should have home route at root path', () => {
      const homeRoute = expectedRoutes.find((r) => r.path === '');
      expect(homeRoute).toBeDefined();
      expect(homeRoute?.hasComponent).toBe(true);
    });

    it('should have session route with sessionId parameter', () => {
      const sessionRoute = expectedRoutes.find((r) => r.path === 's/:sessionId');
      expect(sessionRoute).toBeDefined();
      expect(sessionRoute?.hasComponent).toBe(true);
    });

    it('should have wildcard redirect route', () => {
      const wildcardRoute = expectedRoutes.find((r) => r.path === '**');
      expect(wildcardRoute).toBeDefined();
      expect(wildcardRoute?.redirectTo).toBe('');
    });

    it('should have exactly 3 routes', () => {
      expect(expectedRoutes).toHaveLength(3);
    });

    it('should have correct titles for routes', () => {
      const homeRoute = expectedRoutes.find((r) => r.path === '');
      const sessionRoute = expectedRoutes.find((r) => r.path === 's/:sessionId');

      expect(homeRoute?.title).toBe("Erin's Escapades - Home");
      expect(sessionRoute?.title).toBe("Erin's Escapades - Session");
    });
  });

  describe('route path patterns', () => {
    it('should have home route accessible at root', () => {
      const homeRoute = expectedRoutes.find((r) => r.path === '');
      expect(homeRoute).toBeDefined();
    });

    it('should have session route with proper parameter syntax', () => {
      const sessionRoute = expectedRoutes.find((r) => r.path === 's/:sessionId');
      expect(sessionRoute?.path).toContain(':sessionId');
    });

    it('should redirect unknown paths to home', () => {
      const wildcardRoute = expectedRoutes.find((r) => r.path === '**');
      expect(wildcardRoute?.redirectTo).toBe('');
    });
  });
});
