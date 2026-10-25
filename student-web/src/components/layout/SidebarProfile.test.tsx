import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const signOut = vi.fn(() => Promise.resolve());

vi.mock('@/hooks/queries', () => ({
  useProfile: () => ({ data: { fullName: 'Susanta Lohar', email: 'student@example.com', avatarUrl: null } }),
  useIsPro: () => true,
}));
vi.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { email: 'student@example.com' }, signOut }),
}));

import { SidebarProfile } from './AppShell';

function renderCard(compact = false) {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<SidebarProfile compact={compact} />} />
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/profile" element={<p>profile page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  signOut.mockClear();
});

describe('SidebarProfile', () => {
  it('shows name and email on the expanded card and opens the account menu', () => {
    renderCard();
    expect(screen.getByText('Susanta Lohar')).toBeTruthy();
    expect(screen.getByText('student@example.com')).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    const menu = screen.getByRole('menu');
    expect(menu.textContent).toContain('Pro');
    expect(screen.getByRole('menuitem', { name: /My Profile/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /Settings/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /Sign Out/ })).toBeTruthy();
  });

  it('shows only the avatar in the icon rail, with the name as a tooltip', () => {
    renderCard(true);
    const button = screen.getByRole('button', { name: 'Account menu' });
    expect(button.getAttribute('title')).toBe('Susanta Lohar (student@example.com)');
    expect(screen.queryByText('student@example.com')).toBeNull();
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('closes on Escape and on an outside click', () => {
    renderCard();
    const button = screen.getByRole('button', { name: 'Account menu' });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(button);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('navigates to the profile and signs out to the login page', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /My Profile/ }));
    expect(screen.getByText('profile page')).toBeTruthy();

    cleanup();
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Sign Out/ }));
    await waitFor(() => expect(screen.getByText('login page')).toBeTruthy());
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
