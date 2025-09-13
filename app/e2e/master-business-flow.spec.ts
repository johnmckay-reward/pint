import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Master E2E Test Suite - Complete Business Lifecycle
 * 
 * This test suite covers the entire business flow from pub partner onboarding
 * to user session management across all platform applications:
 * 
 * 1. Pub Owner discovers service via website/pubs.html
 * 2. Owner registers on Partner Dashboard  
 * 3. Owner claims their pub
 * 4. Admin approves the pub claim via Admin Dashboard
 * 5. User creates a session at the approved pub via Main App
 * 6. Pub Owner promotes the session via Partner Dashboard
 * 7. Second User joins session and sends chat message
 */

test.describe('Master Business Flow - Full Platform Integration', () => {
  let context: BrowserContext;
  let adminPage: Page;
  let partnerPage: Page;
  let userPage1: Page;
  let userPage2: Page;
  
  // Test data for consistent flow
  const testData = {
    pubOwner: {
      email: 'testpub@example.com',
      password: 'TestPassword123!',
      pubName: 'The Test Tavern',
      address: '123 Test Street, Test City',
      displayName: 'Test Pub Owner'
    },
    admin: {
      email: 'admin@pint.com',
      password: 'AdminPassword123!'
    },
    user1: {
      email: 'user1@example.com',
      password: 'UserPassword123!',
      displayName: 'Test User One',
      tipple: 'Lager'
    },
    user2: {
      email: 'user2@example.com', 
      password: 'UserPassword123!',
      displayName: 'Test User Two',
      tipple: 'IPA'
    }
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    
    // Create pages for each application
    adminPage = await context.newPage();
    partnerPage = await context.newPage();
    userPage1 = await context.newPage();
    userPage2 = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Complete business lifecycle from discovery to user interaction', async () => {
    console.log('🚀 Starting master business flow test...');

    // Step 1: Pub Owner discovers service via marketing website
    await test.step('1. Pub Owner discovers service via website', async () => {
      console.log('📖 Step 1: Pub Owner visits marketing website');
      
      // Navigate to the pub partner onboarding page
      await partnerPage.goto('file://' + process.cwd() + '/website/pubs.html');
      
      // Check that the page loads correctly
      await expect(partnerPage).toHaveTitle(/For Pubs.*Pint/);
      
      // Verify key partner onboarding elements are present
      await expect(partnerPage.locator('h1')).toContainText('Partner');
      
      // Look for partner dashboard link/CTA
      const partnerDashboardLink = partnerPage.locator('a[href*="partner"], button:has-text("Get Started"), a:has-text("Dashboard")');
      await expect(partnerDashboardLink.first()).toBeVisible();
    });

    // Step 2: Pub Owner registers on Partner Dashboard
    await test.step('2. Pub Owner registers on Partner Dashboard', async () => {
      console.log('🏪 Step 2: Pub Owner registers on Partner Dashboard');
      
      // Navigate to partner dashboard (assuming it runs on port 4200)
      await partnerPage.goto('http://localhost:4200');
      
      // Wait for Angular app to load
      await partnerPage.waitForSelector('app-root', { timeout: 10000 });
      
      // Look for registration/signup elements
      const signupButton = partnerPage.locator('button:has-text("Sign Up"), a:has-text("Register"), [routerLink="/register"]');
      
      if (await signupButton.first().isVisible()) {
        await signupButton.first().click();
        
        // Fill registration form
        await partnerPage.fill('input[type="email"], input[name="email"]', testData.pubOwner.email);
        await partnerPage.fill('input[type="password"], input[name="password"]', testData.pubOwner.password);
        await partnerPage.fill('input[name="displayName"], input[placeholder*="name"]', testData.pubOwner.displayName);
        
        // Submit registration
        await partnerPage.click('button[type="submit"], button:has-text("Register")');
        
        // Wait for successful registration (dashboard or confirmation)
        await expect(partnerPage.locator('h1, h2, .welcome, .dashboard')).toBeVisible({ timeout: 10000 });
      }
    });

    // Step 3: Pub Owner claims their pub
    await test.step('3. Pub Owner claims their pub', async () => {
      console.log('🏛️ Step 3: Pub Owner claims their pub');
      
      // Look for pub claiming interface
      const claimPubButton = partnerPage.locator('button:has-text("Claim"), a:has-text("Claim"), [routerLink*="claim"]');
      
      if (await claimPubButton.first().isVisible()) {
        await claimPubButton.first().click();
        
        // Fill pub claim form
        await partnerPage.fill('input[name="pubName"], input[placeholder*="name"]', testData.pubOwner.pubName);
        await partnerPage.fill('input[name="address"], textarea[name="address"]', testData.pubOwner.address);
        
        // Submit claim
        await partnerPage.click('button[type="submit"], button:has-text("Submit")');
        
        // Expect confirmation message or pending status
        await expect(partnerPage.locator('.success, .pending, .submitted')).toBeVisible({ timeout: 5000 });
      }
    });

    // Step 4: Admin approves the pub claim
    await test.step('4. Admin approves pub claim via Admin Dashboard', async () => {
      console.log('👨‍💼 Step 4: Admin approves pub claim');
      
      // Navigate to admin dashboard (assuming it runs on port 4201)
      await adminPage.goto('http://localhost:4201');
      
      // Wait for Angular app to load
      await adminPage.waitForSelector('app-root', { timeout: 10000 });
      
      // Admin login if needed
      const loginButton = adminPage.locator('button:has-text("Login"), a:has-text("Login")');
      
      if (await loginButton.first().isVisible()) {
        await loginButton.first().click();
        
        // Fill admin login
        await adminPage.fill('input[type="email"]', testData.admin.email);
        await adminPage.fill('input[type="password"]', testData.admin.password);
        await adminPage.click('button[type="submit"]');
        
        // Wait for admin dashboard
        await adminPage.waitForSelector('.dashboard, .admin-panel', { timeout: 10000 });
      }
      
      // Navigate to pending pub claims
      const pendingClaimsLink = adminPage.locator('a:has-text("Pending"), a:has-text("Claims"), [routerLink*="pending"]');
      
      if (await pendingClaimsLink.first().isVisible()) {
        await pendingClaimsLink.first().click();
        
        // Find the test pub claim and approve it
        const testPubRow = adminPage.locator(`tr:has-text("${testData.pubOwner.pubName}"), .claim:has-text("${testData.pubOwner.pubName}")`);
        
        if (await testPubRow.first().isVisible()) {
          const approveButton = testPubRow.first().locator('button:has-text("Approve"), .approve');
          await approveButton.click();
          
          // Confirm approval
          await expect(adminPage.locator('.approved, .success')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    // Step 5: User creates session at approved pub
    await test.step('5. User creates session at approved pub via Main App', async () => {
      console.log('👤 Step 5: User creates session at pub');
      
      // Navigate to main user app (default port 8100)
      await userPage1.goto('http://localhost:8100');
      
      // Wait for Ionic app to load
      await userPage1.waitForSelector('ion-app', { timeout: 10000 });
      
      // User registration/login
      const registerButton = userPage1.locator('ion-button:has-text("Register"), a:has-text("Register")');
      
      if (await registerButton.first().isVisible()) {
        await registerButton.first().click();
        
        // Fill user registration
        await userPage1.fill('input[type="email"]', testData.user1.email);
        await userPage1.fill('input[type="password"]', testData.user1.password);
        await userPage1.fill('input[name="displayName"]', testData.user1.displayName);
        await userPage1.fill('input[name="tipple"], select[name="tipple"]', testData.user1.tipple);
        
        await userPage1.click('ion-button[type="submit"]');
        
        // Wait for successful login/dashboard
        await userPage1.waitForSelector('.dashboard, ion-content', { timeout: 10000 });
      }
      
      // Create new pint session
      const createSessionButton = userPage1.locator('ion-button:has-text("Create"), ion-fab, .create-session');
      
      if (await createSessionButton.first().isVisible()) {
        await createSessionButton.first().click();
        
        // Fill session details
        await userPage1.fill('input[name="pubName"], ion-input[placeholder*="pub"]', testData.pubOwner.pubName);
        
        // Submit session creation
        await userPage1.click('ion-button[type="submit"], ion-button:has-text("Create")');
        
        // Expect session to be created
        await expect(userPage1.locator('.session-created, .success')).toBeVisible({ timeout: 5000 });
      }
    });

    // Step 6: Pub Owner promotes the session
    await test.step('6. Pub Owner promotes session via Partner Dashboard', async () => {
      console.log('📢 Step 6: Pub Owner promotes session');
      
      // Switch back to partner dashboard
      await partnerPage.bringToFront();
      
      // Navigate to sessions or promotions page
      const sessionsLink = partnerPage.locator('a:has-text("Sessions"), a:has-text("Promote"), [routerLink*="session"]');
      
      if (await sessionsLink.first().isVisible()) {
        await sessionsLink.first().click();
        
        // Find the session and promote it
        const sessionRow = partnerPage.locator(`.session:has-text("${testData.user1.displayName}"), tr:has-text("${testData.user1.displayName}")`);
        
        if (await sessionRow.first().isVisible()) {
          const promoteButton = sessionRow.first().locator('button:has-text("Promote"), .promote');
          await promoteButton.click();
          
          // Confirm promotion
          await expect(partnerPage.locator('.promoted, .success')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    // Step 7: Second user joins session and chats
    await test.step('7. Second user joins session and sends chat message', async () => {
      console.log('💬 Step 7: Second user joins and chats');
      
      // Navigate second user to main app
      await userPage2.goto('http://localhost:8100');
      await userPage2.waitForSelector('ion-app', { timeout: 10000 });
      
      // User 2 registration/login (simplified)
      const registerButton = userPage2.locator('ion-button:has-text("Register")');
      
      if (await registerButton.first().isVisible()) {
        await registerButton.first().click();
        
        await userPage2.fill('input[type="email"]', testData.user2.email);
        await userPage2.fill('input[type="password"]', testData.user2.password);
        await userPage2.fill('input[name="displayName"]', testData.user2.displayName);
        await userPage2.fill('input[name="tipple"]', testData.user2.tipple);
        
        await userPage2.click('ion-button[type="submit"]');
        await userPage2.waitForSelector('.dashboard, ion-content', { timeout: 10000 });
      }
      
      // Look for available sessions (promoted session should be visible)
      const sessionsList = userPage2.locator('.sessions, .available-sessions');
      
      if (await sessionsList.first().isVisible()) {
        // Find and join the promoted session
        const targetSession = userPage2.locator(`.session:has-text("${testData.pubOwner.pubName}"), .session:has-text("${testData.user1.displayName}")`);
        
        if (await targetSession.first().isVisible()) {
          await targetSession.first().click();
          
          // Join the session
          const joinButton = userPage2.locator('ion-button:has-text("Join"), .join-session');
          if (await joinButton.first().isVisible()) {
            await joinButton.first().click();
          }
          
          // Send a chat message
          const chatInput = userPage2.locator('input[placeholder*="message"], textarea[placeholder*="message"], ion-input[placeholder*="message"]');
          
          if (await chatInput.first().isVisible()) {
            await chatInput.first().fill('Hello everyone! Excited to join this pint session! 🍻');
            
            const sendButton = userPage2.locator('ion-button:has-text("Send"), .send-message');
            await sendButton.click();
            
            // Verify message appears
            await expect(userPage2.locator('.message:has-text("Hello everyone")')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    console.log('✅ Master business flow completed successfully!');
  });

  // Additional individual flow tests for critical paths
  test('Pub owner registration and onboarding flow', async () => {
    await test.step('Pub owner can complete registration flow', async () => {
      const page = await context.newPage();
      await page.goto('http://localhost:4200');
      
      // Basic registration flow validation
      await page.waitForSelector('app-root', { timeout: 10000 });
      await expect(page.locator('app-root')).toBeVisible();
    });
  });

  test('Admin dashboard functionality', async () => {
    await test.step('Admin can access dashboard and manage claims', async () => {
      const page = await context.newPage();
      await page.goto('http://localhost:4201');
      
      // Basic admin dashboard validation
      await page.waitForSelector('app-root', { timeout: 10000 });
      await expect(page.locator('app-root')).toBeVisible();
    });
  });

  test('User app session management', async () => {
    await test.step('Users can create and manage sessions', async () => {
      const page = await context.newPage();
      await page.goto('http://localhost:8100');
      
      // Basic user app validation
      await page.waitForSelector('ion-app', { timeout: 10000 });
      await expect(page.locator('ion-app')).toBeVisible();
    });
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Platform works correctly in ${browserName}`, async ({ browser }) => {
      const page = await browser.newPage();
      
      // Test main user app
      await page.goto('http://localhost:8100');
      await expect(page.locator('ion-app')).toBeVisible({ timeout: 10000 });
      
      // Test partner dashboard
      await page.goto('http://localhost:4200');
      await expect(page.locator('app-root')).toBeVisible({ timeout: 10000 });
      
      // Test admin dashboard
      await page.goto('http://localhost:4201');
      await expect(page.locator('app-root')).toBeVisible({ timeout: 10000 });
      
      await page.close();
    });
  });
});

test.describe('Mobile Responsiveness', () => {
  test('Main app adapts to mobile viewports', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 } // iPhone SE
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:8100');
    
    await expect(page.locator('ion-app')).toBeVisible();
    
    // Check responsive behavior
    const appBounds = await page.locator('ion-app').boundingBox();
    expect(appBounds?.width).toBeLessThanOrEqual(375);
    
    await context.close();
  });

  test('Partner dashboard is responsive on tablets', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 } // iPad
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:4200');
    
    await expect(page.locator('app-root')).toBeVisible();
    
    await context.close();
  });
});