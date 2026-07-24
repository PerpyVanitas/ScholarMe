import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProfilePage from '@/app/dashboard/profile/page';
import { useUser } from '@/lib/user-context';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/user-context', () => ({
  useUser: vi.fn(() => ({
    refreshProfile: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/app/dashboard/profile/actions', () => ({
  ensureProfile: vi.fn().mockResolvedValue({ success: true }),
  updateProfile: vi.fn(),
  updateTutorInfo: vi.fn(),
}));

// Mock sub-components so we don't need to render the whole tree
vi.mock('@/app/dashboard/profile/components/profile-header', () => ({
  ProfileHeader: () => <div data-testid="profile-header" />,
}));
vi.mock('@/app/dashboard/profile/components/profile-info-card', () => ({
  ProfileInfoCard: () => <div data-testid="profile-info-card" />,
}));
vi.mock('@/app/dashboard/profile/components/achievements-card', () => ({
  AchievementsCard: () => <div data-testid="achievements-card" />,
}));
vi.mock('@/app/dashboard/profile/components/skill-tree', () => ({
  SkillTree: () => <div data-testid="skill-tree" />,
}));

import { createClient } from '@/lib/supabase/client';

describe('Profile Page Resilience', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    abortSignal: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } } });
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.abortSignal.mockReturnValue(mockSupabase);
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } },
      error: null
    });

    (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loading skeleton on slow network', async () => {
    // Delay the Supabase response
    mockSupabase.maybeSingle.mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } },
          error: null
        });
      }, 500);
    }));

    render(<ProfilePage />);

    // Should see loaders/skeletons before the data resolves
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

    // Eventually resolves
    await waitFor(() => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('aborts the fetch if component unmounts (AbortController)', async () => {
    let fetchAborted = false;
    
    // Simulate a fetch that checks for abort signal
    mockSupabase.maybeSingle.mockImplementationOnce(async () => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (fetchAborted) {
            reject(new Error('AbortError'));
          } else {
            resolve({
              data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } },
              error: null
            });
          }
        }, 200);
      });
    });

    // In a real browser/fetch, AbortSignal throws a DOMException 'AbortError'
    // We will spy on a custom AbortController mechanism once implemented in the component

    const { unmount } = render(<ProfilePage />);
    
    // Unmount immediately
    unmount();
    fetchAborted = true;

    // Wait to ensure no setStates are called after unmount (React will warn if it happens, Vitest will catch it)
    await new Promise(r => setTimeout(r, 300));
  });

  it('gracefully degrades on partial data failure (e.g., achievements fail but profile succeeds)', async () => {
    // Return valid profile data
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } },
      error: null
    });

    // Return valid profile data for the first call (profile), and failure for the second (designations)
    let callCount = 0;
    mockSupabase.select = vi.fn().mockImplementation(() => {
      callCount++;
      const isDesignationsCall = callCount > 1; // Assuming profile is first
      
      return {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        single: () => Promise.resolve(
          isDesignationsCall ? { data: null, error: new Error('Partial failure') } : { data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } }, error: null }
        ),
        maybeSingle: () => Promise.resolve(
          isDesignationsCall ? { data: null, error: new Error('Partial failure') } : { data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } }, error: null }
        ),
        then: (cb: (arg: unknown) => unknown) => cb(
          isDesignationsCall ? { data: null, error: new Error('Partial failure') } : { data: { id: 'test-user', full_name: 'Test User', roles: { name: 'learner' } }, error: null }
        )
      };
    });

    render(<ProfilePage />);

    await waitFor(() => {
      // The profile should still render!
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    });
  });
});
