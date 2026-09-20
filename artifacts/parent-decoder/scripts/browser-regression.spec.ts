import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

const routes = [
  '/',
  '/discover',
  '/dictionary',
  '/library',
  '/library/everyday-slang',
  '/decoder',
  '/feedback',
  '/privacy',
  '/approach',
  '/conversation-starters',
  '/saved',
  '/editorial-review',
  '/term/rizz',
  '/terms/ghosting',
  '/unknown-route',
];

async function addRuntimeGuards(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const externalRequests: string[] = [];
  const appOrigin = new URL('http://127.0.0.1:4174').origin;

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (request.resourceType() !== 'websocket') {
      failedRequests.push(`${request.method()} ${request.url()} · ${request.failure()?.errorText ?? 'unknown error'}`);
    }
  });
  page.on('request', (request) => {
    if (['document', 'script', 'stylesheet', 'font', 'image', 'xhr', 'fetch'].includes(request.resourceType())) {
      const url = request.url();
      if (!url.startsWith(appOrigin) && !url.startsWith('data:')) externalRequests.push(url);
    }
  });

  return () => ({ consoleErrors, failedRequests, externalRequests });
}

async function settle(page: Page) {
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page).toHaveTitle(/Parent Decoder/);
  await page.evaluate(() => {
    document.getAnimations().forEach((animation) => animation.finish());
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.body, `body overflow: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.document, `document overflow: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function assertLandmarksAndHeadings(page: Page) {
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((elements) =>
    elements.map((element) => Number(element.tagName.slice(1))),
  );
  expect(headingLevels.filter((level) => level === 1)).toHaveLength(1);
  for (let index = 1; index < headingLevels.length; index += 1) {
    expect(headingLevels[index] - headingLevels[index - 1], `heading skipped from ${headingLevels[index - 1]} to ${headingLevels[index]}`).toBeLessThanOrEqual(1);
  }
}

async function decode(page: Page, message: string) {
  await page.goto('/decoder');
  await page.getByTestId('textarea-decoder-message').fill(message);
  const decodeButton = page.getByTestId('button-decode-message');
  await decodeButton.scrollIntoViewIfNeeded();
  await decodeButton.click({ force: true });
  await expect(page.locator('section[aria-live="polite"]').last()).toBeVisible();
  await page.waitForTimeout(800);
}

test('all main and compatibility routes are shareable and stay within the viewport', async ({ page }) => {
  const runtime = await addRuntimeGuards(page);
  for (const route of routes) {
    await page.goto(route);
    await settle(page);
    await assertLandmarksAndHeadings(page);
    await assertNoHorizontalOverflow(page);
  }
  const issues = runtime();
  expect(issues.consoleErrors, issues.consoleErrors.join('\n')).toEqual([]);
  expect(issues.failedRequests, issues.failedRequests.join('\n')).toEqual([]);
  expect(issues.externalRequests, issues.externalRequests.join('\n')).toEqual([]);
});

test('representative pages pass the accessibility scan', async ({ page }) => {
  const runtime = await addRuntimeGuards(page);
  for (const route of ['/', '/dictionary', '/decoder', '/feedback', '/saved', '/conversation-starters', '/privacy', '/term/rizz']) {
    await page.goto(route);
    await settle(page);
    await page.addScriptTag({ path: axePath });
    const result = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (element: Document, options: object) => Promise<{ violations: unknown[] }> } }).axe;
      return axe.run(document, { resultTypes: ['violations'] });
    });
    expect(result.violations, `${route} accessibility violations`).toEqual([]);
  }
  const issues = runtime();
  expect(issues.consoleErrors).toEqual([]);
  expect(issues.failedRequests).toEqual([]);
});

test('decoder handles exact, alias, punctuation, apostrophe, typo, multiple, and nested matches', async ({ page }) => {
  test.setTimeout(45_000);
  await decode(page, 'rizz');
  await expect(page.getByTestId('card-decoder-match-rizz-0')).toBeVisible();
  await expect(page.getByTestId('link-decoder-match-rizz-0')).toHaveAttribute('href', '/term/rizz');

  await decode(page, 'be right back');
  await expect(page.getByTestId('card-decoder-match-brb-0')).toContainText('Canonical phrase: BRB');
  await expect(page.getByTestId('link-decoder-match-brb-0')).toHaveAttribute('href', '/term/brb');

  await decode(page, 'COOKED!');
  await expect(page.getByTestId('card-decoder-match-cooked-0')).toBeVisible();

  await decode(page, 'It’s giving a good vibe');
  await expect(page.getByTestId('card-decoder-match-its-giving-0')).toBeVisible();
  await expect(page.getByTestId('card-decoder-match-vibe-1')).toBeVisible();

  await decode(page, 'I am cokked');
  await expect(page.getByTestId('card-decoder-match-cooked-0')).toContainText('Close spelling match');

  await decode(page, 'no cap, she ate that exam. Iykyk!');
  await expect(page.getByRole('heading', { name: '3 local matches to unpack' })).toBeVisible();
  for (const [index, slug] of ['no-cap', 'ate', 'iykyk'].entries()) {
    await expect(page.getByTestId(`card-decoder-match-${slug}-${index}`)).toBeVisible();
    await expect(page.getByTestId(`link-decoder-match-${slug}-${index}`)).toHaveAttribute('href', `/term/${slug}`);
    const expectedRecord = slug === 'no-cap' ? 'no(?:\\+|%20)cap' : slug === 'ate' ? 'ate' : 'IYKYK';
    await expect(page.getByTestId(`link-feedback-${slug}-${index}`)).toHaveAttribute('href', new RegExp(`record=${expectedRecord}`));
  }
  await expect(page.getByTestId('card-decoder-match-no-cap-0')).toContainText('Honestly; I am not exaggerating.');
  await expect(page.getByTestId('card-decoder-match-ate-1')).toContainText('Did something impressively well.');
  await expect(page.getByTestId('card-decoder-match-ate-1')).toContainText('Performance or school');
  await expect(page.getByTestId('card-decoder-match-iykyk-2')).toContainText('A shared reference understood by a particular group.');
  await expect(page.getByTestId('text-overall-confidence')).toHaveText('Medium confidence · BLUE context');
  await expect(page.getByTestId('text-context-driver')).toHaveText('The overall level is driven by IYKYK.');
  await expect(page.getByTestId('shared-conversation')).toHaveCount(1);
  await expect(page.getByTestId('shared-conversation')).toContainText('Could you tell me what each phrase means in this context?');
  await expect(page.getByTestId('shared-caution')).toHaveCount(1);
  await expect(page.getByTestId('details-combined-context')).toHaveCount(0);
  await expect(page.getByTestId('combined-context-detail-content')).toHaveCount(0);
  for (const oldHeading of ['What it probably means', 'Other possible meanings', 'Risk and context', 'What would make this more concerning', 'What would make this probably harmless', 'What you should not assume', 'What you could say']) {
    await expect(page.getByRole('heading', { name: oldHeading, exact: true })).toHaveCount(0);
  }

  await decode(page, 'rizz rizz');
  await expect(page.getByTestId('card-decoder-match-rizz-0')).toBeVisible();
  await expect(page.getByTestId('card-decoder-match-rizz-1')).toBeVisible();

  await decode(page, 'That’s so cooked.');
  await expect(page.getByTestId('card-decoder-match-cooked-0')).toBeVisible();
  await expect(page.getByTestId('card-decoder-match-thats-so-cooked-0')).toHaveCount(0);
  await page.goto('/dictionary');
  await page.getByTestId('select-lexical-class').selectOption('guides');
  await page.getByTestId('input-dictionary-search').fill('That’s so cooked');
  await expect(page.getByTestId('card-term-thats-so-cooked')).toBeVisible();

  await decode(page, 'We need to lock in for the last round');
  await expect(page.getByTestId('card-decoder-match-lock-in-0')).toBeVisible();
});

test('unknown decoder and library searches keep uncertainty explicit', async ({ page }) => {
  await decode(page, 'qzvplm nowhere');
  await expect(page.getByText('No local match found')).toBeVisible();
  await expect(page.getByTestId('link-no-match-dictionary')).toBeVisible();

  await page.goto('/dictionary');
  await page.getByTestId('input-dictionary-search').fill('cokked');
  await expect(page.getByTestId('text-result-count')).toContainText('1 entry');
  await expect(page.getByText('Close spelling match for “cokked”')).toBeVisible();
  await expect(page.getByTestId('card-term-cooked')).toBeVisible();

  await page.goto('/library/everyday-slang');
  await expect(page.getByTestId('select-category')).toHaveValue('Everyday slang');
  await expect(page.getByTestId('text-result-count')).toContainText('entries');
  await page.getByTestId('select-risk').selectOption('GREEN');
  await expect(page.getByTestId('text-result-count')).toContainText('entries');
});

test('one unified input supports lookup, auto-detect, explicit switching, and limits', async ({ page }) => {
  await page.goto('/');
  const input = page.getByTestId('input-home-search');
  const submit = page.getByTestId('button-home-search');
  await expect(page.getByTestId('button-input-mode-auto')).toHaveAttribute('aria-pressed', 'true');
  await expect(submit).toBeDisabled();

  await input.fill('rizz');
  await expect(page.getByTestId('text-input-detection')).toContainText('search the dictionary');
  await expect(submit).toContainText('Look up term');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/term\/rizz$/);

  await page.goto('/');
  await input.fill('No cap, she ate that presentation. IYKYK.');
  await expect(submit).toContainText('Decode message');
  await expect(page.getByTestId('text-input-detection')).toContainText('decode it locally');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/decoder\?q=/);
  await expect(page.getByTestId('textarea-decoder-message')).toHaveValue('No cap, she ate that presentation. IYKYK.');
  await expect(page.getByTestId('button-decode-message')).toContainText('Decode message');
  await page.getByTestId('button-decode-message').click();
  await expect(page.getByRole('heading', { name: '3 local matches to unpack' })).toBeVisible();

  await page.getByTestId('textarea-decoder-message').fill('no cap');
  await page.getByTestId('button-input-mode-lookup').click();
  await expect(page.getByTestId('button-decode-message')).toContainText('Look up term');
  await page.getByTestId('textarea-decoder-message').press('Enter');
  await expect(page).toHaveURL(/\/dictionary\?q=/);
  await expect(page.getByTestId('card-term-no-cap')).toBeVisible();

  await page.goto('/dictionary');
  const dictionaryInput = page.getByTestId('input-dictionary-search');
  await dictionaryInput.fill('cooked');
  await expect(page.getByTestId('card-term-cooked')).toBeVisible();
  await page.getByTestId('button-input-mode-decode').click();
  await dictionaryInput.press('Enter');
  await expect(page).toHaveURL(/\/decoder\?q=cooked$/);

  await page.goto('/');
  await page.getByTestId('input-home-search').fill('x'.repeat(700));
  await expect(page.getByTestId('input-home-search')).toHaveValue('x'.repeat(600));
  await expect(page.getByTestId('text-home-search-count')).toContainText('600 / 600 characters');
  await assertNoHorizontalOverflow(page);
  const isMobile = await page.evaluate(() => window.innerWidth < 600);
  if (isMobile) {
    for (const modeButton of await page.locator('[data-testid^="button-input-mode-"]').all()) {
      const box = await modeButton.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
    }
  }
});

test('term URLs refresh, close, Back, and Forward consistently', async ({ page }) => {
  await page.goto('/dictionary');
  await page.getByTestId('card-term-rizz').click();
  await expect(page).toHaveURL(/\/term\/rizz$/);
  await expect(page.locator('h1')).toHaveText('rizz');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('rizz');

  await page.getByTestId('button-close-term').click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/term\/rizz$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/dictionary$/);

  await page.goto('/terms/ghosting');
  await expect(page.locator('h1')).toHaveText('ghosting');
});

test('saved prompts persist, reuse, remove, and clear without leaving the browser', async ({ page }) => {
  await page.goto('/decoder');
  await page.getByTestId('textarea-decoder-message').fill('No cap, what does this mean?');
  await page.getByTestId('button-save-prompt').click();
  await page.getByTestId('textarea-decoder-message').fill('We need to lock in');
  await page.getByTestId('button-save-prompt').click();

  await page.goto('/saved');
  await expect(page.getByText('2 saved prompts')).toBeVisible();
  await page.reload();
  await expect(page.getByText('2 saved prompts')).toBeVisible();

  await page.locator('[data-testid^="button-reuse-"]').first().click();
  await expect(page).toHaveURL(/\/decoder$/);
  await expect(page.getByTestId('textarea-decoder-message')).toHaveValue(/No cap|lock in/);

  await page.goto('/saved');
  await page.locator('[data-testid^="button-remove-"]').first().click();
  await expect(page.getByText('1 saved prompt')).toBeVisible();
  await page.getByTestId('button-clear-saved').click();
  await expect(page.getByText('Nothing saved yet.')).toBeVisible();
});

test('keyboard navigation, route focus, Escape, reduced motion, and mobile targets work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeFocused();
  const search = page.getByTestId('input-home-search');
  await search.focus();
  await expect.poll(() => search.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const motion = await page.locator('.rise-in').first().evaluate((element) => getComputedStyle(element).animationDuration);
  expect(motion).toMatch(/0\.01ms|0s|1e-05s/);

  const isMobile = await page.evaluate(() => window.innerWidth < 600);
  if (!isMobile) return;

  const menuButton = page.getByTestId('button-mobile-menu');
  await expect(menuButton).toHaveCSS('min-width', '44px');
  await menuButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  for (const link of await page.locator('#mobile-navigation a').all()) {
    const box = await link.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).toHaveCount(0);
  await expect(menuButton).toBeFocused();

  await menuButton.press('Enter');
  await page.getByTestId('link-mobile-dictionary').click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('#mobile-navigation')).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeFocused();
});

test('reporting stays calmly unavailable when no public recipient is configured', async ({ page }) => {
  await page.addInitScript(() => {
    window.PARENT_DECODER_CONFIG = { reportingRecipient: '' };
  });
  await page.goto('/term/rizz');
  await settle(page);
  await expect(page.getByTestId('report-unavailable')).toBeVisible();
  await expect(page.getByText('Reporting is not configured yet.')).toBeVisible();
  await expect(page.getByText(/No report was created, sent, stored, or discarded/)).toBeVisible();
  await expect(page.getByTestId('button-submit-report')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test('reporting validates privacy, prepares an inspectable email, and keeps a copy fallback', async ({ page }) => {
  await page.addInitScript(() => {
    window.PARENT_DECODER_CONFIG = { reportingRecipient: 'pilot@example.test' };
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const composerLink = target.closest<HTMLAnchorElement>('a[href^="mailto:"]');
      if (!composerLink) return;
      event.preventDefault();
      (window as typeof window & { __capturedReportMailto?: string }).__capturedReportMailto = composerLink.href;
    }, true);
  });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/decoder');
  await page.getByTestId('textarea-decoder-message').fill('PRIVATE DECODER INPUT');
  await page.evaluate(() => {
    localStorage.setItem('private-test-marker', 'PRIVATE STORAGE CONTENT');
    sessionStorage.setItem('private-history-marker', 'PRIVATE HISTORY CONTENT');
  });
  await page.goto('/term/rizz');
  await settle(page);

  await expect(page.getByTestId('input-report-entry')).toHaveValue('rizz');
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByText('Choose what kind of issue you want to report.')).toBeVisible();
  await expect(page.getByTestId('select-report-issue')).toBeFocused();

  await page.getByTestId('select-report-issue').selectOption('accessibility-problem');
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByText('Confirm that you removed private and identifying information.')).toBeVisible();
  await expect(page.getByTestId('checkbox-report-privacy')).toBeFocused();

  await page.getByTestId('checkbox-report-privacy').press('Space');
  await expect(page.getByTestId('textarea-report-details')).toHaveAttribute('maxlength', '500');
  await page.getByTestId('textarea-report-details').evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    valueSetter?.call(textarea, 'x'.repeat(501));
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByText('Keep the explanation to 500 characters or fewer.')).toBeVisible();
  await expect(page.getByTestId('textarea-report-details')).toBeFocused();

  await page.getByTestId('textarea-report-details').fill('The focus guidance could be clearer.');
  await page.getByTestId('button-submit-report').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('report-prepared-status')).toBeVisible();
  await expect(page.getByText('Parent Decoder has not sent the email.')).toBeVisible();
  await expect(page.getByText(/Review the draft and choose Send there/)).toBeVisible();
  await expect(page.getByTestId('text-report-recipient')).toHaveText('pilot@example.test');
  await expect(page.getByTestId('textarea-report-copy')).toContainText('Issue category: Accessibility problem');
  await expect(page.getByTestId('textarea-report-copy')).toContainText('Term: rizz');

  const mailto = await page.evaluate(() => (window as typeof window & { __capturedReportMailto?: string }).__capturedReportMailto);
  expect(mailto).toBeTruthy();
  const draftUrl = new URL(mailto!);
  expect(draftUrl.pathname).toBe('pilot@example.test');
  expect(draftUrl.searchParams.get('subject')).toContain('Parent Decoder');
  expect(draftUrl.searchParams.get('subject')).toContain('rizz');
  const body = draftUrl.searchParams.get('body') ?? '';
  expect(body).toContain('Issue category: Accessibility problem');
  expect(body).toContain('Public page URL:');
  expect(body).toContain('Term: rizz');
  expect(body).toContain('The focus guidance could be clearer.');
  expect(body).not.toContain('PRIVATE DECODER INPUT');
  expect(body).not.toContain('PRIVATE STORAGE CONTENT');
  expect(body).not.toContain('PRIVATE HISTORY CONTENT');

  await page.getByTestId('button-copy-report').click();
  await expect(page.getByTestId('button-copy-report')).toContainText('Copied report');
  await assertNoHorizontalOverflow(page);
  const isMobile = await page.evaluate(() => window.innerWidth < 600);
  if (isMobile) {
    for (const testId of ['button-submit-report', 'button-copy-report']) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  }

  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (element: Document, options: object) => Promise<{ violations: unknown[] }> } }).axe;
    return axe.run(document, { resultTypes: ['violations'] });
  });
  expect(result.violations, 'configured report form accessibility violations').toEqual([]);
});

test('Feedback is discoverable from every required surface and preserves public-only context', async ({ page }) => {
  await page.addInitScript(() => {
    window.PARENT_DECODER_CONFIG = { reportingRecipient: 'pilot@example.test' };
  });

  await page.goto('/');
  const isMobile = await page.evaluate(() => window.innerWidth < 600);
  if (isMobile) {
    await page.getByTestId('button-mobile-menu').click();
    await page.getByTestId('link-mobile-feedback').click();
  } else {
    await expect(page.getByTestId('link-nav-feedback')).toBeVisible();
    await page.getByTestId('link-nav-feedback').click();
  }
  await expect(page).toHaveURL(/\/feedback$/);
  await expect(page.locator('h1')).toContainText('Help us keep the context clear');
  await expect(page.getByTestId('input-report-entry')).toHaveValue('Parent Decoder');
  await page.reload();
  await expect(page.getByTestId('input-report-entry')).toHaveValue('Parent Decoder');

  await page.goto('/');
  await page.getByTestId('link-footer-feedback').click();
  await expect(page).toHaveURL(/\/feedback$/);

  await page.goto('/privacy');
  await page.getByTestId('link-privacy-feedback').click();
  await expect(page).toHaveURL(/\/feedback$/);
  await page.goto('/approach');
  await page.getByTestId('link-privacy-feedback').click();
  await expect(page).toHaveURL(/\/feedback$/);

  await decode(page, 'no cap, she ate that exam. Iykyk!');
  await page.getByTestId('link-decoder-feedback').click();
  await expect(page).toHaveURL(/\/feedback\?/);
  await expect(page.getByTestId('input-report-entry')).toHaveValue('Parent Decoder');
  await expect(page.locator('body')).not.toContainText('no cap, she ate that exam. Iykyk!');
  await page.goBack();
  await expect(page).toHaveURL(/\/decoder$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/feedback\?/);

  await page.goto('/decoder');
  await page.getByTestId('textarea-decoder-message').fill('no cap, she ate that exam. Iykyk!');
  await page.getByTestId('button-decode-message').click();
  await expect(page.getByRole('heading', { name: '3 local matches to unpack' })).toBeVisible();
  const phraseLinks = page.locator('[data-testid^="link-feedback-"]');
  await expect(phraseLinks).toHaveCount(3);
  await expect(phraseLinks.nth(0)).toHaveAttribute('href', /record=no(?:\+|%20)cap/);
  await expect(phraseLinks.nth(1)).toHaveAttribute('href', /record=ate/);
  await expect(phraseLinks.nth(2)).toHaveAttribute('href', /record=IYKYK/);
  await phraseLinks.nth(1).click();
  await expect(page).toHaveURL(/\/feedback\?/);
  await expect(page.getByTestId('input-report-entry')).toHaveValue('ate');
  await expect(page.getByText('This feedback is about')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('no cap, she ate that exam. Iykyk!');

  await page.goto('/term/rizz');
  await expect(page.getByTestId('report-form')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Report an issue' })).toBeVisible();
  await page.goto('/term/thats-so-cooked');
  await expect(page.getByTestId('report-form')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Report an issue' })).toBeVisible();
});

test('Feedback general and term drafts keep private input out and preserve keyboard focus', async ({ page }) => {
  await page.addInitScript(() => {
    window.PARENT_DECODER_CONFIG = { reportingRecipient: 'pilot@example.test' };
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const composerLink = target.closest<HTMLAnchorElement>('a[href^="mailto:"]');
      if (!composerLink) return;
      event.preventDefault();
      (window as typeof window & { __capturedReportMailto?: string }).__capturedReportMailto = composerLink.href;
    }, true);
  });

  await page.goto('/feedback');
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByTestId('select-report-issue')).toBeFocused();
  await page.getByTestId('select-report-issue').selectOption('other');
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByTestId('checkbox-report-privacy')).toBeFocused();
  await page.getByTestId('checkbox-report-privacy').press('Space');
  await page.getByTestId('textarea-report-details').fill('The feedback page is clear.');
  await page.getByTestId('button-submit-report').press('Enter');
  await expect(page.getByTestId('report-prepared-status')).toBeVisible();
  await expect(page.getByText('Parent Decoder has not sent the email.')).toBeVisible();
  await expect(page.getByTestId('textarea-report-copy')).toContainText('Feedback scope: Parent Decoder');

  await page.goto('/decoder');
  await page.getByTestId('textarea-decoder-message').fill('PRIVATE DECODER INPUT');
  await page.getByTestId('button-decode-message').click();
  await expect(page.getByTestId('card-decoder-match-rizz-0')).toHaveCount(0);
  await page.goto('/feedback?recordType=term&record=rizz&from=%2Fdecoder');
  await expect(page.getByTestId('input-report-entry')).toHaveValue('rizz');
  await page.getByTestId('select-report-issue').selectOption('missing-context');
  await page.getByTestId('checkbox-report-privacy').check();
  await page.getByTestId('textarea-report-details').fill('Only the public term should travel.');
  await page.getByTestId('button-submit-report').click();
  await expect(page.getByTestId('report-prepared-status')).toBeVisible();
  const mailto = await page.evaluate(() => (window as typeof window & { __capturedReportMailto?: string }).__capturedReportMailto);
  const body = new URL(mailto!).searchParams.get('body') ?? '';
  expect(body).toContain('Term: rizz');
  expect(body).not.toContain('PRIVATE DECODER INPUT');
  expect(body).not.toContain('saved');
  expect(body).not.toContain('storage');
  expect(body).not.toContain('history');
  await assertNoHorizontalOverflow(page);
});

test('all Feedback entry points share one unavailable state when recipient is missing', async ({ page }) => {
  await page.addInitScript(() => {
    window.PARENT_DECODER_CONFIG = { reportingRecipient: 'not-an-email' };
  });

  for (const route of ['/feedback', '/term/rizz', '/terms/ghosting']) {
    await page.goto(route);
    await expect(page.getByTestId('report-unavailable')).toBeVisible();
    await expect(page.getByText('Reporting is not configured yet.')).toBeVisible();
    await expect(page.getByTestId('button-submit-report')).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  }

  await page.goto('/decoder');
  await decode(page, 'rizz');
  await page.getByTestId('link-decoder-feedback').click();
  await expect(page.getByTestId('report-unavailable')).toBeVisible();
  await page.goto('/decoder');
  await decode(page, 'rizz');
  await page.getByTestId('link-feedback-rizz-0').click();
  await expect(page.getByTestId('report-unavailable')).toBeVisible();
});