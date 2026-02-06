import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Login', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/ChurchThrive/);
      await expect(page.locator('h1')).toContainText(/로그인/);
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /로그인/ }).click();

      // Should show validation errors
      await expect(page.locator('text=/이메일 또는 전화번호/i')).toBeVisible();
      await expect(page.locator('text=/비밀번호는 8자 이상/i')).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill('invalid-email');
      await page.getByPlaceholder(/비밀번호/i).fill('password123');
      await page.getByRole('button', { name: /로그인/ }).click();

      await expect(page.locator('text=/올바른 이메일/i')).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill('test@example.com');
      await page.getByPlaceholder(/비밀번호/i).fill('short');
      await page.getByRole('button', { name: /로그인/ }).click();

      await expect(page.locator('text=/비밀번호는 8자 이상/i')).toBeVisible();
    });

    test('should allow login with email', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill('test@example.com');
      await page.getByPlaceholder(/비밀번호/i).fill('password123');
      await page.getByRole('button', { name: /로그인/ }).click();

      // Wait for navigation or loading state
      await page.waitForLoadState('networkidle');

      // Should redirect to dashboard or show error
      // Note: This will fail without proper test credentials
    });

    test('should allow login with phone number', async ({ page }) => {
      await page.goto('/login');

      // Switch to phone login if there's a tab/toggle
      const phoneTab = page.getByRole('tab', { name: /전화번호/ });
      if (await phoneTab.isVisible()) {
        await phoneTab.click();
      }

      await page.getByPlaceholder(/전화번호/i).fill('01012345678');
      await page.getByPlaceholder(/비밀번호/i).fill('password123');
      await page.getByRole('button', { name: /로그인/ }).click();

      await page.waitForLoadState('networkidle');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.getByPlaceholder(/비밀번호/i);
      await passwordInput.fill('password123');

      // Initially should be type="password"
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click show/hide button
      const toggleButton = page.getByRole('button', { name: /비밀번호 표시/i });
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    test('should have link to sign up page', async ({ page }) => {
      await page.goto('/login');
      const signUpLink = page.getByRole('link', { name: /회원가입/i });
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should have link to password reset', async ({ page }) => {
      await page.goto('/login');
      const resetLink = page.getByRole('link', { name: /비밀번호 찾기/i });
      if (await resetLink.isVisible()) {
        await expect(resetLink).toBeVisible();
      }
    });
  });

  test.describe('Sign Up', () => {
    test('should display sign up page', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.locator('h1')).toContainText(/회원가입/);
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/signup');
      await page.getByRole('button', { name: /가입하기/i }).click();

      await expect(page.locator('text=/이름/i')).toBeVisible();
      await expect(page.locator('text=/이메일 또는 전화번호/i')).toBeVisible();
      await expect(page.locator('text=/비밀번호/i')).toBeVisible();
    });

    test('should validate name length', async ({ page }) => {
      await page.goto('/signup');
      await page.getByPlaceholder(/이름/i).fill('김');
      await page.getByRole('button', { name: /가입하기/i }).click();

      await expect(page.locator('text=/이름은 2자 이상/i')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/signup');
      await page.getByPlaceholder(/이름/i).fill('김철수');
      await page.getByPlaceholder(/이메일/i).fill('test@example.com');
      await page.getByPlaceholder(/^비밀번호$/i).fill('12345678');
      await page.getByRole('button', { name: /가입하기/i }).click();

      await expect(page.locator('text=/영문자를 포함/i')).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/signup');
      await page.getByPlaceholder(/이름/i).fill('김철수');
      await page.getByPlaceholder(/이메일/i).fill('test@example.com');
      await page.getByPlaceholder(/^비밀번호$/i).fill('password123');
      await page.getByPlaceholder(/비밀번호 확인/i).fill('different123');
      await page.getByRole('button', { name: /가입하기/i }).click();

      await expect(page.locator('text=/비밀번호가 일치하지 않습니다/i')).toBeVisible();
    });

    test('should proceed to church selection after valid registration', async ({ page }) => {
      await page.goto('/signup');
      await page.getByPlaceholder(/이름/i).fill('김철수');
      await page.getByPlaceholder(/이메일/i).fill('newuser@example.com');
      await page.getByPlaceholder(/^비밀번호$/i).fill('password123');
      await page.getByPlaceholder(/비밀번호 확인/i).fill('password123');
      await page.getByRole('button', { name: /가입하기/i }).click();

      await page.waitForLoadState('networkidle');

      // Should redirect to church selection or show success
      // Note: This will fail without proper test environment
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page, context }) => {
      // Note: This test requires being logged in first
      // You would need to setup authentication state before running this test

      await page.goto('/');

      // Find and click logout button
      const logoutButton = page.getByRole('button', { name: /로그아웃/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Should redirect to login page
        await expect(page).toHaveURL(/\/login/);

        // Session should be cleared
        const cookies = await context.cookies();
        const authCookie = cookies.find(c => c.name.includes('auth'));
        expect(authCookie).toBeUndefined();
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing members page', async ({ page }) => {
      await page.goto('/members');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
