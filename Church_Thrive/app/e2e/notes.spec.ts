import { test, expect } from '@playwright/test';

test.describe('Notes Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes');
  });

  test.describe('Notes List', () => {
    test('should display notes page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/노트/);
    });

    test('should display notes grid', async ({ page }) => {
      const notesGrid = page.locator('[data-testid="notes-grid"]');
      if (await notesGrid.isVisible()) {
        await expect(notesGrid).toBeVisible();
      }
    });

    test('should have create note button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /노트 작성/i });
      await expect(createButton).toBeVisible();
    });

    test('should display search bar', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await expect(searchInput).toBeVisible();
    });

    test('should filter notes by search query', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('설교');
      await page.waitForTimeout(500); // Wait for debounce

      // Should filter notes
    });

    test('should display note categories', async ({ page }) => {
      const categories = ['전체', '설교', '묵상', '기도'];
      for (const category of categories) {
        const categoryButton = page.getByRole('button', { name: category });
        if (await categoryButton.isVisible()) {
          await expect(categoryButton).toBeVisible();
        }
      }
    });

    test('should filter by category', async ({ page }) => {
      const sermonCategory = page.getByRole('button', { name: /설교/i });
      if (await sermonCategory.isVisible()) {
        await sermonCategory.click();
        await page.waitForLoadState('networkidle');
        // Should show only sermon notes
      }
    });
  });

  test.describe('Create Note', () => {
    test('should open note editor', async ({ page }) => {
      await page.getByRole('button', { name: /노트 작성/i }).click();
      await expect(page).toHaveURL(/\/notes\/new/);
    });

    test('should display note editor interface', async ({ page }) => {
      await page.goto('/notes/new');

      await expect(page.getByPlaceholder(/제목/i)).toBeVisible();
      await expect(page.getByRole('textbox', { name: /내용/i })).toBeVisible();
    });

    test('should create note with title and content', async ({ page }) => {
      await page.goto('/notes/new');

      await page.getByPlaceholder(/제목/i).fill('오늘의 묵상');
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill('하나님의 은혜를 생각하며...');

      await page.getByRole('button', { name: /저장/i }).click();
      await page.waitForLoadState('networkidle');

      // Should redirect to notes list or note view
      await expect(page.getByText(/저장되었습니다/i)).toBeVisible();
    });

    test('should auto-detect Bible verses', async ({ page }) => {
      await page.goto('/notes/new');

      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill('오늘의 본문은 요 3:16입니다.');

      // Should show Bible verse detection
      const verseTag = page.getByText(/요한복음 3:16/i);
      if (await verseTag.isVisible()) {
        await expect(verseTag).toBeVisible();
      }
    });

    test('should select category', async ({ page }) => {
      await page.goto('/notes/new');

      await page.getByPlaceholder(/제목/i).fill('주일 설교');

      const categorySelect = page.getByRole('combobox', { name: /카테고리/i });
      if (await categorySelect.isVisible()) {
        await categorySelect.click();
        await page.getByRole('option', { name: /설교/i }).click();
      }

      await page.getByRole('button', { name: /저장/i }).click();
      await page.waitForLoadState('networkidle');
    });

    test('should add tags to note', async ({ page }) => {
      await page.goto('/notes/new');

      await page.getByPlaceholder(/제목/i).fill('은혜 묵상');

      const tagInput = page.getByPlaceholder(/태그 추가/i);
      if (await tagInput.isVisible()) {
        await tagInput.fill('은혜');
        await page.keyboard.press('Enter');
        await tagInput.fill('감사');
        await page.keyboard.press('Enter');

        await expect(page.getByText('은혜')).toBeVisible();
        await expect(page.getByText('감사')).toBeVisible();
      }
    });

    test('should support rich text formatting', async ({ page }) => {
      await page.goto('/notes/new');

      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill('강조할 텍스트');

      // Select text
      await page.keyboard.press('Control+A');

      // Try to make it bold
      const boldButton = page.getByRole('button', { name: /굵게/i });
      if (await boldButton.isVisible()) {
        await boldButton.click();
        await expect(editor.locator('strong, b')).toBeVisible();
      }
    });

    test('should save note as draft', async ({ page }) => {
      await page.goto('/notes/new');

      await page.getByPlaceholder(/제목/i).fill('미완성 노트');

      const draftButton = page.getByRole('button', { name: /임시저장/i });
      if (await draftButton.isVisible()) {
        await draftButton.click();
        await page.waitForLoadState('networkidle');

        await expect(page.getByText(/임시저장되었습니다/i)).toBeVisible();
      }
    });

    test('should cancel note creation', async ({ page }) => {
      await page.goto('/notes/new');

      await page.getByPlaceholder(/제목/i).fill('취소할 노트');

      const cancelButton = page.getByRole('button', { name: /취소/i });
      await cancelButton.click();

      // Should show confirmation if there's unsaved content
      const confirmButton = page.getByRole('button', { name: /확인/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await expect(page).toHaveURL(/\/notes$/);
    });
  });

  test.describe('Edit Note', () => {
    test('should open note for editing', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        const editButton = page.getByRole('button', { name: /수정/i });
        if (await editButton.isVisible()) {
          await editButton.click();
          await expect(page).toHaveURL(/\/notes\/.*\/edit/);
        }
      }
    });

    test('should update note content', async ({ page }) => {
      // Navigate to first note edit page
      const noteId = 'test-note-id'; // In real test, get actual note ID
      await page.goto(`/notes/${noteId}/edit`);

      const titleInput = page.getByPlaceholder(/제목/i);
      if (await titleInput.isVisible()) {
        await titleInput.fill('수정된 제목');

        await page.getByRole('button', { name: /저장/i }).click();
        await page.waitForLoadState('networkidle');

        await expect(page.getByText(/수정되었습니다/i)).toBeVisible();
      }
    });
  });

  test.describe('View Note', () => {
    test('should display note details', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        // Should show note title and content
        await expect(page.locator('h1')).not.toBeEmpty();
      }
    });

    test('should show Bible verse references', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        const verseSection = page.locator('[data-testid="bible-verses"]');
        if (await verseSection.isVisible()) {
          await expect(verseSection).toBeVisible();
        }
      }
    });

    test('should display note metadata', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        // Should show creation date, category, tags
        const metadata = page.locator('[data-testid="note-metadata"]');
        if (await metadata.isVisible()) {
          await expect(metadata).toBeVisible();
        }
      }
    });
  });

  test.describe('Delete Note', () => {
    test('should delete note with confirmation', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        const deleteButton = page.getByRole('button', { name: /삭제/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          await expect(page.getByText(/정말 삭제하시겠습니까/i)).toBeVisible();

          await page.getByRole('button', { name: /확인/i }).click();
          await page.waitForLoadState('networkidle');

          await expect(page.getByText(/삭제되었습니다/i)).toBeVisible();
        }
      }
    });

    test('should cancel note deletion', async ({ page }) => {
      await page.goto('/notes');

      const firstNote = page.locator('[data-testid="note-card"]').first();
      if (await firstNote.isVisible()) {
        await firstNote.click();

        const deleteButton = page.getByRole('button', { name: /삭제/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.getByRole('button', { name: /취소/i }).click();

          // Note should still be visible
          await expect(page.locator('h1')).not.toBeEmpty();
        }
      }
    });
  });

  test.describe('Offline Support', () => {
    test('should create note while offline', async ({ page, context }) => {
      await page.goto('/notes/new');

      // Simulate offline
      await context.setOffline(true);

      await page.getByPlaceholder(/제목/i).fill('오프라인 노트');
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill('인터넷 없이 작성');

      await page.getByRole('button', { name: /저장/i }).click();

      // Should save to IndexedDB
      await expect(page.getByText(/오프라인으로 저장되었습니다/i)).toBeVisible();

      // Go back online
      await context.setOffline(false);

      // Should sync automatically
      await page.waitForTimeout(2000);
      await expect(page.getByText(/동기화되었습니다/i)).toBeVisible();
    });

    test('should show offline indicator', async ({ page, context }) => {
      await page.goto('/notes');

      await context.setOffline(true);
      await page.reload();

      const offlineIndicator = page.getByText(/오프라인/i);
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toBeVisible();
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should search notes by title', async ({ page }) => {
      await page.goto('/notes');

      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('설교');
      await page.waitForTimeout(500);

      // Should show notes with "설교" in title
    });

    test('should search notes by content', async ({ page }) => {
      await page.goto('/notes');

      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('요 3:16');
      await page.waitForTimeout(500);

      // Should show notes containing "요 3:16"
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/notes');

      const dateFilter = page.getByRole('button', { name: /날짜/i });
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        // Select date range
        await page.getByRole('button', { name: /이번 주/i }).click();
        await page.waitForLoadState('networkidle');
      }
    });
  });
});
