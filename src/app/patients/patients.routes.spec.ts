import { PATIENTS_ROUTES } from './patients.routes';

describe('PATIENTS_ROUTES', () => {
  it('should expose the feature root route', () => {
    const rootRoute = PATIENTS_ROUTES.find((route) => route.path === '');

    expect(rootRoute).toBeDefined();
    expect(rootRoute?.component).toBeDefined();
  });
});