import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './ProtectedRoute';

const auth = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const openStudentPanel = vi.hoisted(() => vi.fn());

vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.current }));
vi.mock('@/lib/studentPanel', () => ({ openStudentPanel }));

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <p>Admin console</p>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute', () => {
  beforeEach(() => openStudentPanel.mockClear());

  it('shows the console to an admin', () => {
    auth.current = { user: { id: 'a' }, isAdmin: true, loading: false, hasPermission: () => true };
    renderAdmin();
    expect(screen.getByText('Admin console')).toBeInTheDocument();
    expect(openStudentPanel).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to the login page', () => {
    auth.current = { user: null, isAdmin: false, loading: false, hasPermission: () => false };
    renderAdmin();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  // Google sign-in returns to /admin, so a student arriving here must reach the panel
  it('sends a signed-in student to the student panel', () => {
    auth.current = {
      user: { id: 's' },
      isAdmin: false,
      loading: false,
      hasPermission: () => false,
    };
    renderAdmin();
    expect(openStudentPanel).toHaveBeenCalledWith('home');
    expect(screen.queryByText('Admin console')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
