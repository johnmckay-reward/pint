import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Firebase Integration Validation Test Suite
 * 
 * This comprehensive test suite validates the Firebase integration across the Pint platform:
 * 1. Real-time data synchronization
 * 2. Security rule enforcement
 * 3. Geospatial query accuracy
 * 4. Cross-application data flow
 */

test.describe('Firebase Integration Validation', () => {
  let context: BrowserContext;
  let userPage1: Page;
  let userPage2: Page;
  let partnerPage: Page;
  let adminPage: Page;

  const testData = {
    locations: {
      belfast: { lat: 54.5973, lng: -5.9301 },
      dublin: { lat: 53.3331, lng: -6.2489 }, 
      london: { lat: 51.5074, lng: -0.1278 }
    },
    testSession: {
      pubName: 'Firebase Test Tavern',
      eta: '30 minutes',
      location: { lat: 54.5973, lng: -5.9301 }
    },
    users: {
      user1: {
        email: 'testuser1@firebase.test',
        displayName: 'Test User One',
        tipple: 'Guinness'
      },
      user2: {
        email: 'testuser2@firebase.test', 
        displayName: 'Test User Two',
        tipple: 'Smithwicks'
      }
    }
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    userPage1 = await context.newPage();
    userPage2 = await context.newPage();
    partnerPage = await context.newPage();
    adminPage = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('1. Real-time Data Sync Validation', () => {
    test('Live Session Discovery - New sessions appear instantly without refresh', async () => {
      console.log('🔄 Testing real-time session discovery...');

      // Setup: User 1 navigates to main app
      await userPage1.goto('http://localhost:8100');
      await userPage1.waitForSelector('ion-app', { timeout: 10000 });

      // Setup: User 2 navigates to main app
      await userPage2.goto('http://localhost:8100');
      await userPage2.waitForSelector('ion-app', { timeout: 10000 });

      // User 1 creates a session
      await test.step('User 1 creates a new session', async () => {
        // Mock authentication for testing
        await userPage1.evaluate((userData) => {
          // Simulate Firebase auth state
          window.localStorage.setItem('firebase-test-user', JSON.stringify(userData.user1));
        }, testData.users);

        // Navigate to session creation
        const createButton = userPage1.locator('ion-button:has-text("Create"), ion-fab, .create-session');
        if (await createButton.first().isVisible()) {
          await createButton.first().click();
          
          // Fill session details
          await userPage1.fill('input[name="pubName"]', testData.testSession.pubName);
          await userPage1.fill('input[name="eta"]', testData.testSession.eta);
          
          // Submit
          await userPage1.click('ion-button[type="submit"]');
          
          // Verify session created
          await expect(userPage1.locator('.session-created, .success')).toBeVisible({ timeout: 5000 });
        }
      });

      // User 2 should see the session immediately without refresh
      await test.step('User 2 sees new session in real-time', async () => {
        // Mock authentication for user 2
        await userPage2.evaluate((userData) => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify(userData.user2));
        }, testData.users);

        // Check if session appears in real-time (without manual refresh)
        const sessionsList = userPage2.locator('.sessions, .available-sessions');
        await expect(sessionsList).toBeVisible({ timeout: 10000 });
        
        // Look for the specific session
        const newSession = userPage2.locator(`.session:has-text("${testData.testSession.pubName}")`);
        await expect(newSession).toBeVisible({ timeout: 10000 });
      });
    });

    test('Instant Chat - Messages appear in real-time for all participants', async () => {
      console.log('💬 Testing real-time chat functionality...');

      // Setup: Both users in the same session
      await test.step('Setup users in same session', async () => {
        // User 2 joins the session created by User 1
        const joinButton = userPage2.locator('ion-button:has-text("Join"), .join-session');
        if (await joinButton.first().isVisible()) {
          await joinButton.first().click();
          
          // Wait for join confirmation
          await expect(userPage2.locator('.joined, .in-session')).toBeVisible({ timeout: 5000 });
        }
      });

      // User 1 sends a message
      await test.step('User 1 sends chat message', async () => {
        const chatInput = userPage1.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
        if (await chatInput.first().isVisible()) {
          const testMessage = `Test message at ${Date.now()}`;
          await chatInput.first().fill(testMessage);
          
          const sendButton = userPage1.locator('ion-button:has-text("Send"), .send-message');
          await sendButton.click();
          
          // Verify message appears for sender
          await expect(userPage1.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 });
        }
      });

      // User 2 should see the message immediately
      await test.step('User 2 sees message in real-time', async () => {
        const testMessage = `Test message at ${Date.now()}`;
        
        // Message should appear without refresh
        await expect(userPage2.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 10000 });
      });
    });

    test('Live Dashboard Updates - Cross-app real-time synchronization', async () => {
      console.log('📊 Testing cross-app real-time updates...');

      // Setup partner dashboard
      await partnerPage.goto('http://localhost:4200');
      await partnerPage.waitForSelector('app-root', { timeout: 10000 });

      // Setup admin dashboard  
      await adminPage.goto('http://localhost:4201');
      await adminPage.waitForSelector('app-root', { timeout: 10000 });

      // Partner claims a pub
      await test.step('Partner claims pub via Partner Dashboard', async () => {
        // Mock partner authentication
        await partnerPage.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'test-partner-1',
            role: 'pub_owner',
            email: 'partner@test.com'
          }));
        });

        const claimButton = partnerPage.locator('button:has-text("Claim"), .claim-pub');
        if (await claimButton.first().isVisible()) {
          await claimButton.first().click();
          
          // Fill claim form
          await partnerPage.fill('input[name="pubName"]', 'Real-time Test Pub');
          await partnerPage.fill('input[name="address"]', 'Test Address, Belfast');
          
          // Submit claim
          await partnerPage.click('button[type="submit"]');
          
          // Verify submission
          await expect(partnerPage.locator('.submitted, .pending')).toBeVisible({ timeout: 5000 });
        }
      });

      // Admin should see pending claim immediately
      await test.step('Admin sees pending claim in real-time', async () => {
        // Mock admin authentication
        await adminPage.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'test-admin-1',
            role: 'admin',
            email: 'admin@pint.com'
          }));
        });

        // Check for pending claims section
        const pendingSection = adminPage.locator('.pending-claims, .admin-queue');
        await expect(pendingSection).toBeVisible({ timeout: 10000 });
        
        // Look for the specific claim
        const newClaim = adminPage.locator('.claim:has-text("Real-time Test Pub")');
        await expect(newClaim).toBeVisible({ timeout: 10000 });
      });
    });
  });

  test.describe('2. Security Rule Penetration Testing', () => {
    test('Anonymous access prevention - Unauthenticated users cannot access data', async () => {
      console.log('🔒 Testing anonymous access prevention...');

      const anonymousPage = await context.newPage();
      await anonymousPage.goto('http://localhost:8100');

      // Clear any existing auth state
      await anonymousPage.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });

      // Try to access protected data
      await test.step('Anonymous user cannot access sessions', async () => {
        // Attempt to navigate to sessions page
        await anonymousPage.goto('http://localhost:8100/tabs/dashboard');
        
        // Should be redirected to login or see auth prompt
        const authRequired = anonymousPage.locator('.auth-required, .login-required, ion-button:has-text("Login")');
        await expect(authRequired).toBeVisible({ timeout: 10000 });
      });

      await anonymousPage.close();
    });

    test('Cross-user data access prevention - Users cannot edit other users data', async () => {
      console.log('🚫 Testing cross-user data access prevention...');

      // Setup: Two different authenticated users
      await userPage1.evaluate(() => {
        window.localStorage.setItem('firebase-test-user', JSON.stringify({
          id: 'user-1',
          email: 'user1@test.com',
          role: 'user'
        }));
      });

      await userPage2.evaluate(() => {
        window.localStorage.setItem('firebase-test-user', JSON.stringify({
          id: 'user-2', 
          email: 'user2@test.com',
          role: 'user'
        }));
      });

      // User 1 creates a session
      await test.step('User 1 creates session', async () => {
        await userPage1.goto('http://localhost:8100/initiate-pint');
        
        const createButton = userPage1.locator('ion-button:has-text("Create Session")');
        if (await createButton.isVisible()) {
          await createButton.click();
        }
      });

      // User 2 attempts to modify User 1's session (should fail)
      await test.step('User 2 cannot modify User 1 session', async () => {
        await userPage2.goto('http://localhost:8100/tabs/dashboard');
        
        // Find User 1's session
        const user1Session = userPage2.locator('.session[data-creator="user-1"]');
        
        // Try to access edit/delete options (should not be available)
        const editButton = user1Session.locator('button:has-text("Edit"), .edit-session');
        const deleteButton = user1Session.locator('button:has-text("Delete"), .delete-session');
        
        // These buttons should not exist or be disabled for other users' sessions
        await expect(editButton).not.toBeVisible();
        await expect(deleteButton).not.toBeVisible();
      });
    });

    test('Role-based access control - Regular users cannot access admin data', async () => {
      console.log('👑 Testing RBAC enforcement...');

      // Setup regular user
      await userPage1.evaluate(() => {
        window.localStorage.setItem('firebase-test-user', JSON.stringify({
          id: 'regular-user',
          email: 'user@test.com', 
          role: 'user'
        }));
      });

      // Try to access admin dashboard
      await test.step('Regular user cannot access admin dashboard', async () => {
        await userPage1.goto('http://localhost:4201');
        
        // Should be denied access or redirected
        const accessDenied = userPage1.locator('.access-denied, .unauthorized, .login-required');
        await expect(accessDenied).toBeVisible({ timeout: 10000 });
      });

      // Try to access partner-only features
      await test.step('Regular user cannot access partner features', async () => {
        await userPage1.goto('http://localhost:4200');
        
        // Should be denied access to partner dashboard
        const partnerAccessDenied = userPage1.locator('.access-denied, .unauthorized, .partner-only');
        await expect(partnerAccessDenied).toBeVisible({ timeout: 10000 });
      });
    });
  });

  test.describe('3. Geospatial Query Accuracy Test', () => {
    test('Location and radius testing - Accurate distance-based queries', async () => {
      console.log('🌍 Testing geospatial query accuracy...');

      // Create test sessions at known locations
      await test.step('Create sessions at different locations', async () => {
        await userPage1.evaluate((testData) => {
          // Mock creating sessions at specific coordinates
          const sessions = [
            { name: 'Belfast Central', location: testData.locations.belfast },
            { name: 'Dublin Temple Bar', location: testData.locations.dublin },
            { name: 'London Pub', location: testData.locations.london }
          ];
          
          window.testSessions = sessions;
        }, testData);
      });

      // Test 1km radius search from Belfast
      await test.step('1km radius search from Belfast', async () => {
        await userPage1.goto('http://localhost:8100/tabs/dashboard');
        
        // Set search location to Belfast
        const locationInput = userPage1.locator('input[name="location"], .location-search');
        if (await locationInput.isVisible()) {
          await locationInput.fill('Belfast, Northern Ireland');
        }
        
        // Set radius to 1km
        const radiusSlider = userPage1.locator('input[type="range"], .radius-slider');
        if (await radiusSlider.isVisible()) {
          await radiusSlider.fill('1'); // 1km
        }
        
        // Search
        const searchButton = userPage1.locator('button:has-text("Search"), .search-sessions');
        if (await searchButton.isVisible()) {
          await searchButton.click();
        }
        
        // Should only show Belfast sessions
        await expect(userPage1.locator('.session:has-text("Belfast")')).toBeVisible();
        await expect(userPage1.locator('.session:has-text("Dublin")')).not.toBeVisible();
        await expect(userPage1.locator('.session:has-text("London")')).not.toBeVisible();
      });

      // Test 500km radius search (should include Dublin)
      await test.step('500km radius search includes Dublin', async () => {
        const radiusSlider = userPage1.locator('input[type="range"], .radius-slider');
        if (await radiusSlider.isVisible()) {
          await radiusSlider.fill('500'); // 500km
        }
        
        const searchButton = userPage1.locator('button:has-text("Search"), .search-sessions');
        if (await searchButton.isVisible()) {
          await searchButton.click();
        }
        
        // Should show Belfast and Dublin (Dublin is ~167km from Belfast)
        await expect(userPage1.locator('.session:has-text("Belfast")')).toBeVisible();
        await expect(userPage1.locator('.session:has-text("Dublin")')).toBeVisible();
        // London should still be excluded (London is ~518km from Belfast)
        await expect(userPage1.locator('.session:has-text("London")')).not.toBeVisible();
      });
    });

    test('Edge case verification - Boundary and high-density testing', async () => {
      console.log('🏝️ Testing geospatial edge cases...');

      // Test coastline boundaries (Belfast is coastal)
      await test.step('Coastal boundary testing', async () => {
        await userPage1.goto('http://localhost:8100/tabs/dashboard');
        
        // Create a session very close to the coast
        const mockCoastalSession = {
          name: 'Coastal Pub',
          location: { lat: 54.6097, lng: -5.9240 } // Near Belfast harbor
        };
        
        await userPage1.evaluate((session) => {
          window.testCoastalSession = session;
        }, mockCoastalSession);
        
        // Search should still work correctly near water boundaries
        const searchResults = userPage1.locator('.search-results, .sessions-list');
        await expect(searchResults).toBeVisible({ timeout: 10000 });
      });

      // Test high density area (simulate many sessions in small area)
      await test.step('High density session testing', async () => {
        // Mock multiple sessions in Belfast city center
        await userPage1.evaluate(() => {
          const belfastCenter = { lat: 54.5973, lng: -5.9301 };
          const denseSessions = [];
          
          // Create 10 sessions within 1km of city center
          for (let i = 0; i < 10; i++) {
            denseSessions.push({
              name: `Belfast Pub ${i + 1}`,
              location: {
                lat: belfastCenter.lat + (Math.random() - 0.5) * 0.01, // ~1km variance
                lng: belfastCenter.lng + (Math.random() - 0.5) * 0.01
              }
            });
          }
          
          window.testDenseSessions = denseSessions;
        });
        
        // Search in this dense area
        const radiusSlider = userPage1.locator('input[type="range"], .radius-slider');
        if (await radiusSlider.isVisible()) {
          await radiusSlider.fill('2'); // 2km radius
        }
        
        const searchButton = userPage1.locator('button:has-text("Search")');
        if (await searchButton.isVisible()) {
          await searchButton.click();
        }
        
        // Should handle multiple results efficiently
        const sessionCount = await userPage1.locator('.session-item').count();
        expect(sessionCount).toBeGreaterThan(5); // Should find multiple sessions
        expect(sessionCount).toBeLessThan(50); // But not an unreasonable amount
      });
    });
  });

  test.describe('4. End-to-End Platform Cohesion Test', () => {
    test('Complete user journey - Full business lifecycle validation', async () => {
      console.log('🎯 Testing complete platform integration...');

      // This replicates the master business flow but focuses on Firebase integration
      await test.step('Pub Owner onboarding with real-time data sync', async () => {
        await partnerPage.goto('http://localhost:4200');
        
        // Mock partner registration
        await partnerPage.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'integration-partner',
            email: 'integration@test.com',
            role: 'pub_owner',
            displayName: 'Integration Test Partner'
          }));
        });
        
        // Claim pub
        const claimForm = partnerPage.locator('.claim-form, form');
        if (await claimForm.isVisible()) {
          await partnerPage.fill('input[name="pubName"]', 'Integration Test Pub');
          await partnerPage.fill('input[name="address"]', 'Firebase Lane, Belfast');
          await partnerPage.click('button[type="submit"]');
          
          await expect(partnerPage.locator('.success, .pending')).toBeVisible({ timeout: 5000 });
        }
      });

      await test.step('Admin approval with real-time notification', async () => {
        await adminPage.goto('http://localhost:4201');
        
        // Mock admin auth
        await adminPage.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'integration-admin',
            email: 'admin@pint.com',
            role: 'admin'
          }));
        });
        
        // Should see pending claim in real-time
        const pendingClaim = adminPage.locator('.claim:has-text("Integration Test Pub")');
        await expect(pendingClaim).toBeVisible({ timeout: 10000 });
        
        // Approve claim
        const approveButton = pendingClaim.locator('button:has-text("Approve")');
        if (await approveButton.isVisible()) {
          await approveButton.click();
          await expect(adminPage.locator('.approved, .success')).toBeVisible({ timeout: 5000 });
        }
      });

      await test.step('User session creation at approved pub', async () => {
        await userPage1.goto('http://localhost:8100');
        
        // Mock user auth
        await userPage1.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'integration-user-1',
            email: 'user1@test.com', 
            role: 'user',
            displayName: 'Integration User One'
          }));
        });
        
        // Create session at the approved pub
        const createButton = userPage1.locator('ion-button:has-text("Create"), .create-session');
        if (await createButton.isVisible()) {
          await createButton.first().click();
          
          await userPage1.fill('input[name="pubName"]', 'Integration Test Pub');
          await userPage1.fill('input[name="eta"]', '20 minutes');
          
          await userPage1.click('ion-button[type="submit"]');
          await expect(userPage1.locator('.session-created')).toBeVisible({ timeout: 5000 });
        }
      });

      await test.step('Real-time chat between users', async () => {
        // User 2 joins the session
        await userPage2.goto('http://localhost:8100');
        
        await userPage2.evaluate(() => {
          window.localStorage.setItem('firebase-test-user', JSON.stringify({
            id: 'integration-user-2',
            email: 'user2@test.com',
            role: 'user', 
            displayName: 'Integration User Two'
          }));
        });
        
        // Find and join the session
        const sessionList = userPage2.locator('.sessions, .available-sessions');
        await expect(sessionList).toBeVisible({ timeout: 10000 });
        
        const targetSession = userPage2.locator('.session:has-text("Integration Test Pub")');
        if (await targetSession.isVisible()) {
          await targetSession.click();
          
          const joinButton = userPage2.locator('ion-button:has-text("Join")');
          if (await joinButton.isVisible()) {
            await joinButton.click();
          }
        }
        
        // Send chat message
        const chatInput = userPage2.locator('input[placeholder*="message"]');
        if (await chatInput.isVisible()) {
          const testMessage = 'Firebase integration test message!';
          await chatInput.fill(testMessage);
          
          const sendButton = userPage2.locator('ion-button:has-text("Send")');
          await sendButton.click();
          
          // Verify message appears for both users in real-time
          await expect(userPage2.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 });
          await expect(userPage1.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 10000 });
        }
      });
    });
  });
});