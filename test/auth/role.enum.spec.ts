import { Role } from '../../src/auth/enums/role.enum';

describe('Role Enum', () => {
  it('debe tener el valor ESTUDIANTE', () => {
    expect(Role.ESTUDIANTE).toBe('estudiante');
  });

  it('debe tener el valor TUTOR', () => {
    expect(Role.TUTOR).toBe('tutor');
  });

  it('debe tener el valor ADMIN', () => {
    expect(Role.ADMIN).toBe('admin');
  });

  it('debe tener exactamente 3 roles', () => {
    const roles = Object.values(Role);
    expect(roles).toHaveLength(3);
  });

  it('debe incluir todos los roles esperados', () => {
    const roles = Object.values(Role);
    expect(roles).toContain('estudiante');
    expect(roles).toContain('tutor');
    expect(roles).toContain('admin');
  });
});
