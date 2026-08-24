import { usePostInteractionStore } from '../index';
import type { Post } from '@buzzfeed/api';

const makePost = (id: string, likeCount = 100, saveCount = 20): Post => ({
  id,
  author: { id: 'u1', name: 'Test', username: 'test', avatarUrl: '', isVerified: false },
  caption: 'Test caption',
  imageUrl: null,
  blurhash: null,
  location: { city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  likeCount,
  saveCount,
  commentCount: 5,
  createdAt: new Date().toISOString(),
  tags: [],
});

// Reset store before each test to avoid state leak between tests
beforeEach(() => {
  usePostInteractionStore.setState({ interactions: {} });
});

describe('hydrate', () => {
  it('seeds interaction state from post list', () => {
    const posts = [makePost('p1', 50, 10), makePost('p2', 80, 30)];
    usePostInteractionStore.getState().hydrate(posts);

    const state = usePostInteractionStore.getState().interactions;
    expect(state['p1']).toEqual({ liked: false, saved: false, likeCount: 50, saveCount: 10 });
    expect(state['p2']).toEqual({ liked: false, saved: false, likeCount: 80, saveCount: 30 });
  });

  it('does not overwrite existing interaction state on re-hydrate', () => {
    const post = makePost('p1', 50, 10);
    usePostInteractionStore.getState().hydrate([post]);
    usePostInteractionStore.getState().optimisticLike('p1');
    // Re-hydrating same post should NOT reset the liked flag
    usePostInteractionStore.getState().hydrate([post]);

    expect(usePostInteractionStore.getState().interactions['p1']?.liked).toBe(true);
  });
});

describe('optimisticLike / rollbackLike', () => {
  it('toggles liked and increments likeCount', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1', 100)]);
    usePostInteractionStore.getState().optimisticLike('p1');

    const s = usePostInteractionStore.getState().interactions['p1'];
    expect(s?.liked).toBe(true);
    expect(s?.likeCount).toBe(101);
  });

  it('rollback restores previous state', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1', 100)]);
    usePostInteractionStore.getState().optimisticLike('p1');
    usePostInteractionStore.getState().rollbackLike('p1');

    const s = usePostInteractionStore.getState().interactions['p1'];
    expect(s?.liked).toBe(false);
    expect(s?.likeCount).toBe(100);
  });

  it('unlike decrements likeCount', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1', 100)]);
    usePostInteractionStore.getState().optimisticLike('p1'); // like
    usePostInteractionStore.getState().optimisticLike('p1'); // unlike

    const s = usePostInteractionStore.getState().interactions['p1'];
    expect(s?.liked).toBe(false);
    expect(s?.likeCount).toBe(100);
  });
});

describe('optimisticSave / rollbackSave', () => {
  it('toggles saved', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1')]);
    usePostInteractionStore.getState().optimisticSave('p1');

    expect(usePostInteractionStore.getState().interactions['p1']?.saved).toBe(true);
  });

  it('rollback restores saved = false', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1')]);
    usePostInteractionStore.getState().optimisticSave('p1');
    usePostInteractionStore.getState().rollbackSave('p1');

    expect(usePostInteractionStore.getState().interactions['p1']?.saved).toBe(false);
  });
});

describe('getSavedIds', () => {
  it('returns only saved post IDs', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1'), makePost('p2'), makePost('p3')]);
    usePostInteractionStore.getState().optimisticSave('p1');
    usePostInteractionStore.getState().optimisticSave('p3');

    const ids = usePostInteractionStore.getState().getSavedIds();
    expect(ids).toContain('p1');
    expect(ids).toContain('p3');
    expect(ids).not.toContain('p2');
  });
});

describe('confirmLike', () => {
  it('sets server-reconciled likeCount', () => {
    usePostInteractionStore.getState().hydrate([makePost('p1', 100)]);
    usePostInteractionStore.getState().optimisticLike('p1');
    usePostInteractionStore.getState().confirmLike('p1', 102); // server says 102

    expect(usePostInteractionStore.getState().interactions['p1']?.likeCount).toBe(102);
  });
});
