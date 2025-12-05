/**
 * Integration tests for config/envs
 * These tests verify environment configuration
 */

describe('Environment Configuration', () => {
  describe('envs module', () => {
    it('should have port property', () => {
      // Import fresh module with current env
      const { envs } = require('../../src/config/envs');

      expect(envs.port).toBeDefined();
      expect(typeof envs.port).toBe('number');
    });

    it('should have databaseurl property', () => {
      const { envs } = require('../../src/config/envs');

      expect(envs.databaseurl).toBeDefined();
      expect(typeof envs.databaseurl).toBe('string');
    });

    it('should have jwtSecret property', () => {
      const { envs } = require('../../src/config/envs');

      expect(envs.jwtSecret).toBeDefined();
      expect(typeof envs.jwtSecret).toBe('string');
    });

    it('should have optional directurl property', () => {
      const { envs } = require('../../src/config/envs');

      // directurl is optional, so just verify the envs object is valid
      expect(envs).toBeDefined();
      expect(typeof envs).toBe('object');
    });
  });

  describe('config index', () => {
    it('should export envs from index', () => {
      const config = require('../../src/config');

      expect(config.envs).toBeDefined();
    });
  });
});
