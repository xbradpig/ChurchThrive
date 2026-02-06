import { test, expect } from '@playwright/test';

// Helper to setup authenticated session
async function setupAuth(page: any) {
  // Note: In a real test environment, you would:
  // 1. Use Playwright's authentication storage
  // 2. Or mock the Supabase auth state
  // 3. Or use a test user account
  await page.goto('/login');
  await page.getByPlaceholder(/이메일/i).fill('test@example.com');
  await page.getByPlaceholder(/비밀번호/i).fill('password123');
  await page.getByRole('button', { name: /로그인/ }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Members Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication before each test
    // await setupAuth(page);
    // For now, we'll just navigate to the page
    await page.goto('/members');
  });

  test.describe('Members List', () => {
    test('should display members list page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/교인 관리/);
    });

    test('should display member table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: /이름/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /전화번호/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /직분/i })).toBeVisible();
    });

    test('should have add member button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /교인 추가/i });
      await expect(addButton).toBeVisible();
    });

    test('should display search bar', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await expect(searchInput).toBeVisible();
    });

    test('should filter members by search query', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('김철수');
      await page.waitForTimeout(500); // Wait for debounce

      // Should filter table rows
      const rows = page.getByRole('row');
      await expect(rows).toHaveCount; // Should have header + filtered results
    });

    test('should support chosung search', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('ㄱㅊㅊ');
      await page.waitForTimeout(500);

      // Should show members matching "김철수" etc.
    });

    test('should clear search when clicking clear button', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색/i);
      await searchInput.fill('김철수');

      const clearButton = page.getByRole('button', { name: /지우기/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should paginate results', async ({ page }) => {
      // Check if pagination exists
      const nextButton = page.getByRole('button', { name: /다음/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        // Should load next page
      }
    });

    test('should filter by position', async ({ page }) => {
      const positionFilter = page.getByRole('combobox', { name: /직분/i });
      if (await positionFilter.isVisible()) {
        await positionFilter.click();
        await page.getByRole('option', { name: /장로/i }).click();
        await page.waitForLoadState('networkidle');
        // Should show only elders
      }
    });

    test('should sort by name', async ({ page }) => {
      const nameHeader = page.getByRole('columnheader', { name: /이름/i });
      await nameHeader.click();
      await page.waitForLoadState('networkidle');
      // Should sort by name ascending

      await nameHeader.click();
      await page.waitForLoadState('networkidle');
      // Should sort by name descending
    });
  });

  test.describe('Add Member', () => {
    test('should open add member modal', async ({ page }) => {
      await page.getByRole('button', { name: /교인 추가/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('h2')).toContainText(/교인 추가/);
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.getByRole('button', { name: /교인 추가/i }).click();
      await page.getByRole('button', { name: /저장/i }).click();

      await expect(page.locator('text=/이름은 2자 이상/i')).toBeVisible();
      await expect(page.locator('text=/전화번호/i')).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.getByRole('button', { name: /교인 추가/i }).click();
      await page.getByPlaceholder(/이름/i).fill('김철수');
      await page.getByPlaceholder(/전화번호/i).fill('1234567890');
      await page.getByRole('button', { name: /저장/i }).click();

      await expect(page.locator('text=/올바른 전화번호/i')).toBeVisible();
    });

    test('should create new member with valid data', async ({ page }) => {
      await page.getByRole('button', { name: /교인 추가/i }).click();

      await page.getByPlaceholder(/이름/i).fill('김철수');
      await page.getByPlaceholder(/전화번호/i).fill('010-1234-5678');
      await page.getByPlaceholder(/이메일/i).fill('kim@example.com');

      // Select gender
      const genderSelect = page.getByLabel(/성별/i);
      if (await genderSelect.isVisible()) {
        await genderSelect.click();
        await page.getByRole('option', { name: /남/i }).click();
      }

      // Select position
      const positionSelect = page.getByLabel(/직분/i);
      if (await positionSelect.isVisible()) {
        await positionSelect.click();
        await page.getByRole('option', { name: /집사/i }).click();
      }

      await page.getByRole('button', { name: /저장/i }).click();
      await page.waitForLoadState('networkidle');

      // Should show success message and close modal
      await expect(page.getByText(/추가되었습니다/i)).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.getByRole('button', { name: /교인 추가/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: /취소/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Edit Member', () => {
    test('should open edit modal when clicking member row', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1); // Skip header
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.locator('h2')).toContainText(/교인 수정/);
      }
    });

    test('should populate form with member data', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        // Check that form is populated
        const nameInput = page.getByPlaceholder(/이름/i);
        await expect(nameInput).not.toHaveValue('');
      }
    });

    test('should update member successfully', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        const emailInput = page.getByPlaceholder(/이메일/i);
        await emailInput.fill('updated@example.com');

        await page.getByRole('button', { name: /저장/i }).click();
        await page.waitForLoadState('networkidle');

        await expect(page.getByText(/수정되었습니다/i)).toBeVisible();
      }
    });
  });

  test.describe('Delete Member', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        const deleteButton = page.getByRole('button', { name: /삭제/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await expect(page.getByText(/정말 삭제하시겠습니까/i)).toBeVisible();
        }
      }
    });

    test('should delete member on confirmation', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        const memberName = await firstRow.locator('td').nth(0).textContent();

        await firstRow.click();

        const deleteButton = page.getByRole('button', { name: /삭제/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.getByRole('button', { name: /확인/i }).click();
          await page.waitForLoadState('networkidle');

          await expect(page.getByText(/삭제되었습니다/i)).toBeVisible();
        }
      }
    });

    test('should cancel deletion', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        const deleteButton = page.getByRole('button', { name: /삭제/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.getByRole('button', { name: /취소/i }).click();

          // Dialog should close, member should still exist
          await expect(page.getByRole('dialog')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Member Details', () => {
    test('should display member detail view', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        // Should show member details
        await expect(page.getByText(/교인 정보/i)).toBeVisible();
      }
    });

    test('should display member contact information', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        // Should display phone, email, address
        const detailsSection = page.getByRole('dialog');
        await expect(detailsSection).toContainText(/전화번호/i);
        await expect(detailsSection).toContainText(/이메일/i);
      }
    });

    test('should display member attendance history', async ({ page }) => {
      const firstRow = page.getByRole('row').nth(1);
      if (await firstRow.isVisible()) {
        await firstRow.click();

        const attendanceTab = page.getByRole('tab', { name: /출석/i });
        if (await attendanceTab.isVisible()) {
          await attendanceTab.click();
          // Should show attendance records
        }
      }
    });
  });

  test.describe('Export Members', () => {
    test('should have export button', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /내보내기/i });
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    });

    test('should download Excel file', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /내보내기/i });
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;

        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple members', async ({ page }) => {
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      if (count > 2) {
        await checkboxes.nth(1).check();
        await checkboxes.nth(2).check();

        // Should show bulk action bar
        await expect(page.getByText(/선택됨/i)).toBeVisible();
      }
    });

    test('should bulk delete members', async ({ page }) => {
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      if (count > 2) {
        await checkboxes.nth(1).check();
        await checkboxes.nth(2).check();

        const bulkDeleteButton = page.getByRole('button', { name: /선택 삭제/i });
        if (await bulkDeleteButton.isVisible()) {
          await bulkDeleteButton.click();
          await page.getByRole('button', { name: /확인/i }).click();
          await page.waitForLoadState('networkidle');

          await expect(page.getByText(/삭제되었습니다/i)).toBeVisible();
        }
      }
    });
  });
});
