import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Real-time Data Synchronization Test Suite
 * 
 * This test suite validates Firestore's real-time synchronization capabilities
 * across multiple browser instances, simulating real-world multi-user scenarios.
 */

test.describe('Real-time Data Synchronization Validation', () => {
  let context: BrowserContext;
  let userPage1: Page;
  let userPage2: Page;
  let userPage3: Page;
  let partnerPage: Page;
  let adminPage: Page;

  const testUsers = {
    user1: {
      id: 'realtime-user-1',
      email: 'user1@realtime.test',
      displayName: 'Real-time User One',
      role: 'user'
    },
    user2: {
      id: 'realtime-user-2', 
      email: 'user2@realtime.test',
      displayName: 'Real-time User Two',
      role: 'user'
    },
    user3: {
      id: 'realtime-user-3',
      email: 'user3@realtime.test', 
      displayName: 'Real-time User Three',
      role: 'user'
    },
    partner: {
      id: 'realtime-partner',
      email: 'partner@realtime.test',
      displayName: 'Real-time Partner',
      role: 'pub_owner'
    },
    admin: {
      id: 'realtime-admin',
      email: 'admin@realtime.test',
      displayName: 'Real-time Admin',
      role: 'admin'
    }
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    userPage1 = await context.newPage();
    userPage2 = await context.newPage();
    userPage3 = await context.newPage();
    partnerPage = await context.newPage();
    adminPage = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Session Real-time Synchronization', () => {
    test('New sessions appear instantly on all connected clients', async () => {
      console.log('🔄 Testing real-time session creation sync...');

      // Setup all users on the dashboard
      await Promise.all([
        setupUserPage(userPage1, testUsers.user1),
        setupUserPage(userPage2, testUsers.user2),
        setupUserPage(userPage3, testUsers.user3)
      ]);

      // All users start on dashboard to monitor sessions
      await Promise.all([
        userPage1.goto('http://localhost:8100/tabs/dashboard'),
        userPage2.goto('http://localhost:8100/tabs/dashboard'),
        userPage3.goto('http://localhost:8100/tabs/dashboard')
      ]);

      // Wait for pages to load
      await Promise.all([
        userPage1.waitForSelector('ion-content', { timeout: 10000 }),
        userPage2.waitForSelector('ion-content', { timeout: 10000 }),
        userPage3.waitForSelector('ion-content', { timeout: 10000 })
      ]);

      // User 1 creates a new session
      await test.step('User 1 creates session', async () => {
        const createButton = userPage1.locator('ion-button:has-text("Create"), ion-fab, .create-session');
        
        if (await createButton.first().isVisible()) {
          await createButton.first().click();
          
          // Fill session details
          const sessionName = `Real-time Test Session ${Date.now()}`;
          await userPage1.fill('input[name="pubName"]', sessionName);
          await userPage1.fill('input[name="eta"]', '25 minutes');
          
          // Submit session
          await userPage1.click('ion-button[type="submit"]');
          
          // Verify session created for User 1
          await expect(userPage1.locator('.session-created, .success')).toBeVisible({ timeout: 5000 });
          
          // Store session name for verification in other clients
          await userPage1.evaluate((name) => {
            window.testSessionName = name;
          }, sessionName);
        }
      });

      // Verify session appears in real-time for other users (without refresh)
      await test.step('Other users see session in real-time', async () => {
        const sessionName = await userPage1.evaluate(() => window.testSessionName);
        
        // User 2 should see the new session appear automatically
        const user2Session = userPage2.locator(`.session:has-text("${sessionName}"), .session-item:has-text("${sessionName}")`);
        await expect(user2Session).toBeVisible({ timeout: 15000 });
        
        // User 3 should also see the session
        const user3Session = userPage3.locator(`.session:has-text("${sessionName}"), .session-item:has-text("${sessionName}")`);
        await expect(user3Session).toBeVisible({ timeout: 15000 });
      });
    });

    test('Session updates sync instantly across all participants', async () => {
      console.log('📝 Testing real-time session updates...');

      // User 2 joins the session created by User 1
      await test.step('User 2 joins session', async () => {
        const sessionName = await userPage1.evaluate(() => window.testSessionName || 'Real-time Test Session');
        
        const targetSession = userPage2.locator(`.session:has-text("${sessionName}")`);
        if (await targetSession.isVisible()) {
          await targetSession.click();
          
          // Join the session
          const joinButton = userPage2.locator('ion-button:has-text("Join"), .join-session');
          if (await joinButton.isVisible()) {
            await joinButton.click();
            
            // Verify join successful
            await expect(userPage2.locator('.joined, .in-session')).toBeVisible({ timeout: 5000 });
          }
        }
      });

      // Verify User 1 sees User 2 join in real-time
      await test.step('User 1 sees User 2 join in real-time', async () => {
        // Navigate User 1 to session details if not already there
        await userPage1.goto('http://localhost:8100/session/current'); // Or appropriate session detail route
        
        // Should see User 2 in attendees list
        const attendeesList = userPage1.locator('.attendees, .participants, .members');
        await expect(attendeesList).toBeVisible({ timeout: 10000 });
        
        const user2InList = userPage1.locator('.attendee:has-text("Real-time User Two"), .participant:has-text("Real-time User Two")');
        await expect(user2InList).toBeVisible({ timeout: 15000 });
      });

      // User 3 also joins the session
      await test.step('User 3 joins session', async () => {
        const sessionName = await userPage1.evaluate(() => window.testSessionName || 'Real-time Test Session');
        
        const targetSession = userPage3.locator(`.session:has-text("${sessionName}")`);
        if (await targetSession.isVisible()) {
          await targetSession.click();
          
          const joinButton = userPage3.locator('ion-button:has-text("Join")');
          if (await joinButton.isVisible()) {
            await joinButton.click();
          }
        }
      });

      // Verify all users see the complete attendee list in real-time
      await test.step('All users see complete attendee list', async () => {
        // Check User 1's view
        const user1AttendeesList = userPage1.locator('.attendees, .participants');
        const user1Attendees = user1AttendeesList.locator('.attendee, .participant');
        await expect(user1Attendees).toHaveCountGreaterThanOrEqual(3, { timeout: 15000 });
        
        // Check User 2's view
        await userPage2.goto('http://localhost:8100/session/current');
        const user2AttendeesList = userPage2.locator('.attendees, .participants');
        const user2Attendees = user2AttendeesList.locator('.attendee, .participant');
        await expect(user2Attendees).toHaveCountGreaterThanOrEqual(3, { timeout: 15000 });
      });
    });

    test('Session deletion syncs instantly across all clients', async () => {
      console.log('🗑️ Testing real-time session deletion sync...');

      // User 1 (session creator) deletes the session
      await test.step('User 1 deletes session', async () => {
        // Navigate to session management
        await userPage1.goto('http://localhost:8100/my-sessions');
        
        const deleteButton = userPage1.locator('ion-button:has-text("Delete"), .delete-session');
        if (await deleteButton.first().isVisible()) {
          await deleteButton.first().click();
          
          // Confirm deletion if confirmation dialog appears
          const confirmButton = userPage1.locator('ion-button:has-text("Confirm"), ion-button:has-text("Yes")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          // Verify deletion successful
          await expect(userPage1.locator('.session-deleted, .deleted')).toBeVisible({ timeout: 5000 });
        }
      });

      // Verify session disappears for all other users
      await test.step('Session disappears for other users in real-time', async () => {
        // Navigate other users back to dashboard
        await Promise.all([
          userPage2.goto('http://localhost:8100/tabs/dashboard'),
          userPage3.goto('http://localhost:8100/tabs/dashboard')
        ]);

        const sessionName = await userPage1.evaluate(() => window.testSessionName || 'Real-time Test Session');
        
        // Session should no longer be visible
        const user2DeletedSession = userPage2.locator(`.session:has-text("${sessionName}")`);
        await expect(user2DeletedSession).not.toBeVisible({ timeout: 15000 });
        
        const user3DeletedSession = userPage3.locator(`.session:has-text("${sessionName}")`);
        await expect(user3DeletedSession).not.toBeVisible({ timeout: 15000 });
      });
    });
  });

  test.describe('Chat Real-time Synchronization', () => {
    test('Chat messages appear instantly for all session participants', async () => {
      console.log('💬 Testing real-time chat synchronization...');

      // Create a new session for chat testing
      await test.step('Setup new session for chat test', async () => {
        await userPage1.goto('http://localhost:8100/initiate-pint');
        
        const createButton = userPage1.locator('ion-button:has-text("Create"), .create-session');
        if (await createButton.isVisible()) {
          await createButton.click();
          
          const chatSessionName = `Chat Test Session ${Date.now()}`;
          await userPage1.fill('input[name="pubName"]', chatSessionName);
          await userPage1.fill('input[name="eta"]', '30 minutes');
          
          await userPage1.click('ion-button[type="submit"]');
          
          // Store session name
          await userPage1.evaluate((name) => {
            window.chatSessionName = name;
          }, chatSessionName);
        }
      });

      // User 2 and 3 join the chat session
      await test.step('Users join chat session', async () => {
        const sessionName = await userPage1.evaluate(() => window.chatSessionName);
        
        // User 2 joins
        await userPage2.goto('http://localhost:8100/tabs/dashboard');
        const user2Session = userPage2.locator(`.session:has-text("${sessionName}")`);
        if (await user2Session.isVisible()) {
          await user2Session.click();
          const joinButton = userPage2.locator('ion-button:has-text("Join")');
          if (await joinButton.isVisible()) {
            await joinButton.click();
          }
        }

        // User 3 joins
        await userPage3.goto('http://localhost:8100/tabs/dashboard');
        const user3Session = userPage3.locator(`.session:has-text("${sessionName}")`);
        if (await user3Session.isVisible()) {
          await user3Session.click();
          const joinButton = userPage3.locator('ion-button:has-text("Join")');
          if (await joinButton.isVisible()) {
            await joinButton.click();
          }
        }
      });

      // Navigate all users to chat interface
      await test.step('Navigate to chat interface', async () => {
        await Promise.all([
          userPage1.goto('http://localhost:8100/session/current/chat'),
          userPage2.goto('http://localhost:8100/session/current/chat'),
          userPage3.goto('http://localhost:8100/session/current/chat')
        ]);
      });

      // User 1 sends a message
      await test.step('User 1 sends chat message', async () => {
        const chatInput = userPage1.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
        if (await chatInput.isVisible()) {
          const testMessage = `Hello everyone! ${Date.now()}`;
          await chatInput.fill(testMessage);
          
          const sendButton = userPage1.locator('ion-button:has-text("Send"), .send-message');
          await sendButton.click();
          
          // Verify message appears for sender
          await expect(userPage1.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 });
          
          // Store message for verification
          await userPage1.evaluate((msg) => {
            window.testChatMessage = msg;
          }, testMessage);
        }
      });

      // Verify message appears instantly for other users
      await test.step('Message appears for other users in real-time', async () => {
        const testMessage = await userPage1.evaluate(() => window.testChatMessage);
        
        // Should appear for User 2
        await expect(userPage2.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 10000 });
        
        // Should appear for User 3
        await expect(userPage3.locator(`.message:has-text("${testMessage}")`)).toBeVisible({ timeout: 10000 });
      });

      // Test rapid message exchange
      await test.step('Rapid message exchange test', async () => {
        const messages = [
          { user: userPage2, text: 'User 2 reply!', name: 'User Two' },
          { user: userPage3, text: 'User 3 here!', name: 'User Three' },
          { user: userPage1, text: 'Great to see everyone!', name: 'User One' }
        ];

        for (const { user, text, name } of messages) {
          const chatInput = user.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
          if (await chatInput.isVisible()) {
            await chatInput.fill(text);
            const sendButton = user.locator('ion-button:has-text("Send")');
            await sendButton.click();
            
            // Verify message appears for sender
            await expect(user.locator(`.message:has-text("${text}")`)).toBeVisible({ timeout: 5000 });
          }
          
          // Brief pause between messages
          await user.waitForTimeout(500);
        }

        // Verify all messages appear on all clients
        for (const { text } of messages) {
          await expect(userPage1.locator(`.message:has-text("${text}")`)).toBeVisible({ timeout: 10000 });
          await expect(userPage2.locator(`.message:has-text("${text}")`)).toBeVisible({ timeout: 10000 });
          await expect(userPage3.locator(`.message:has-text("${text}")`)).toBeVisible({ timeout: 10000 });
        }
      });
    });

    test('Message order consistency across all clients', async () => {
      console.log('📋 Testing message order consistency...');

      // Send messages rapidly from different users
      await test.step('Send rapid sequence of messages', async () => {
        const messageSequence = [
          { user: userPage1, text: 'Message 1', timestamp: Date.now() },
          { user: userPage2, text: 'Message 2', timestamp: Date.now() + 100 },
          { user: userPage3, text: 'Message 3', timestamp: Date.now() + 200 },
          { user: userPage1, text: 'Message 4', timestamp: Date.now() + 300 },
          { user: userPage2, text: 'Message 5', timestamp: Date.now() + 400 }
        ];

        // Send all messages rapidly
        for (const { user, text } of messageSequence) {
          const chatInput = user.locator('input[placeholder*="message"]');
          if (await chatInput.isVisible()) {
            await chatInput.fill(text);
            const sendButton = user.locator('ion-button:has-text("Send")');
            await sendButton.click();
          }
        }

        // Wait for all messages to sync
        await userPage1.waitForTimeout(3000);
      });

      // Verify message order is consistent across all clients
      await test.step('Verify consistent message order', async () => {
        const expectedOrder = ['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5'];
        
        for (const page of [userPage1, userPage2, userPage3]) {
          const messages = page.locator('.message .content, .message-text');
          const messageTexts = await messages.allTextContents();
          
          // Filter for our test messages and check order
          const testMessages = messageTexts.filter(text => 
            expectedOrder.some(expected => text.includes(expected))
          );
          
          expect(testMessages.length).toBe(expectedOrder.length);
          
          // Verify order is correct
          expectedOrder.forEach((expectedText, index) => {
            expect(testMessages[index]).toContain(expectedText);
          });
        }
      });
    });
  });

  test.describe('Cross-App Real-time Synchronization', () => {
    test('Partner dashboard updates reflect user app changes instantly', async () => {
      console.log('🔄 Testing cross-app synchronization...');

      // Setup partner dashboard
      await setupUserPage(partnerPage, testUsers.partner);
      await partnerPage.goto('http://localhost:4200');

      // Setup admin dashboard
      await setupUserPage(adminPage, testUsers.admin);
      await adminPage.goto('http://localhost:4201');

      // Partner claims a pub
      await test.step('Partner claims pub', async () => {
        const claimButton = partnerPage.locator('ion-button:has-text("Claim"), .claim-pub');
        if (await claimButton.isVisible()) {
          await claimButton.click();
          
          const pubName = `Real-time Test Pub ${Date.now()}`;
          await partnerPage.fill('input[name="pubName"]', pubName);
          await partnerPage.fill('input[name="address"]', 'Real-time Street, Belfast');
          
          await partnerPage.click('ion-button[type="submit"]');
          
          // Store pub name for verification
          await partnerPage.evaluate((name) => {
            window.testPubName = name;
          }, pubName);
        }
      });

      // Admin should see pending claim instantly
      await test.step('Admin sees pending claim in real-time', async () => {
        const pubName = await partnerPage.evaluate(() => window.testPubName);
        
        const pendingClaim = adminPage.locator(`.claim:has-text("${pubName}"), .pending-claim:has-text("${pubName}")`);
        await expect(pendingClaim).toBeVisible({ timeout: 15000 });
      });

      // Admin approves the claim
      await test.step('Admin approves claim', async () => {
        const pubName = await partnerPage.evaluate(() => window.testPubName);
        
        const claimItem = adminPage.locator(`.claim:has-text("${pubName}")`);
        if (await claimItem.isVisible()) {
          const approveButton = claimItem.locator('ion-button:has-text("Approve"), .approve-claim');
          if (await approveButton.isVisible()) {
            await approveButton.click();
          }
        }
      });

      // Partner should see approval status update instantly
      await test.step('Partner sees approval status in real-time', async () => {
        const approvedStatus = partnerPage.locator('.approved, .claim-approved, .status-approved');
        await expect(approvedStatus).toBeVisible({ timeout: 15000 });
      });

      // User creates session at the approved pub
      await test.step('User creates session at approved pub', async () => {
        await userPage1.goto('http://localhost:8100/initiate-pint');
        
        const pubName = await partnerPage.evaluate(() => window.testPubName);
        
        const createButton = userPage1.locator('ion-button:has-text("Create")');
        if (await createButton.isVisible()) {
          await createButton.click();
          
          await userPage1.fill('input[name="pubName"]', pubName);
          await userPage1.fill('input[name="eta"]', '40 minutes');
          
          await userPage1.click('ion-button[type="submit"]');
        }
      });

      // Partner should see session at their pub instantly
      await test.step('Partner sees session at their pub in real-time', async () => {
        await partnerPage.goto('http://localhost:4200/sessions'); // Navigate to sessions view
        
        const pubName = await partnerPage.evaluate(() => window.testPubName);
        const pubSession = partnerPage.locator(`.session:has-text("${pubName}"), .pub-session:has-text("${pubName}")`);
        
        await expect(pubSession).toBeVisible({ timeout: 15000 });
      });
    });

    test('User profile updates sync across all applications', async () => {
      console.log('👤 Testing profile update synchronization...');

      // User updates their profile
      await test.step('User updates profile', async () => {
        await userPage1.goto('http://localhost:8100/profile');
        
        const editButton = userPage1.locator('ion-button:has-text("Edit"), .edit-profile');
        if (await editButton.isVisible()) {
          await editButton.click();
          
          const newTipple = `Real-time IPA ${Date.now()}`;
          await userPage1.fill('input[name="tipple"], input[name="favouriteTipple"]', newTipple);
          
          const saveButton = userPage1.locator('ion-button:has-text("Save"), ion-button[type="submit"]');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
          
          // Store new tipple for verification
          await userPage1.evaluate((tipple) => {
            window.newTipple = tipple;
          }, newTipple);
        }
      });

      // Other users should see updated profile instantly
      await test.step('Other users see profile updates in real-time', async () => {
        const newTipple = await userPage1.evaluate(() => window.newTipple);
        
        // User 2 views User 1's profile
        await userPage2.goto('http://localhost:8100/profile/realtime-user-1');
        
        const tippleDisplay = userPage2.locator(`.tipple:has-text("${newTipple}"), .favourite-tipple:has-text("${newTipple}")`);
        await expect(tippleDisplay).toBeVisible({ timeout: 15000 });
      });

      // Admin should see updated user data
      await test.step('Admin sees updated user data', async () => {
        await adminPage.goto('http://localhost:4201/users');
        
        const newTipple = await userPage1.evaluate(() => window.newTipple);
        const userRow = adminPage.locator('.user-row:has-text("Real-time User One")');
        
        if (await userRow.isVisible()) {
          const tippleCell = userRow.locator(`.tipple:has-text("${newTipple}"), td:has-text("${newTipple}")`);
          await expect(tippleCell).toBeVisible({ timeout: 15000 });
        }
      });
    });
  });

  test.describe('Real-time Performance and Reliability', () => {
    test('Real-time updates maintain performance under load', async () => {
      console.log('⚡ Testing real-time performance under load...');

      // Create multiple rapid updates
      await test.step('Generate rapid updates', async () => {
        const updatePromises = [];
        
        // Create 10 rapid session updates
        for (let i = 0; i < 10; i++) {
          updatePromises.push(
            (async () => {
              await userPage1.goto('http://localhost:8100/initiate-pint');
              
              const createButton = userPage1.locator('ion-button:has-text("Create")');
              if (await createButton.isVisible()) {
                await createButton.click();
                
                await userPage1.fill('input[name="pubName"]', `Load Test Pub ${i}`);
                await userPage1.fill('input[name="eta"]', `${10 + i} minutes`);
                
                await userPage1.click('ion-button[type="submit"]');
              }
            })()
          );
          
          // Small delay between creates
          await userPage1.waitForTimeout(200);
        }
        
        await Promise.all(updatePromises);
      });

      // Verify all updates appear on other clients
      await test.step('Verify updates appear on other clients', async () => {
        await userPage2.goto('http://localhost:8100/tabs/dashboard');
        
        // Should see multiple Load Test Pub sessions
        const loadTestSessions = userPage2.locator('.session:has-text("Load Test Pub")');
        await expect(loadTestSessions.first()).toBeVisible({ timeout: 20000 });
        
        const sessionCount = await loadTestSessions.count();
        expect(sessionCount).toBeGreaterThanOrEqual(5); // Should see most/all of the created sessions
      });
    });

    test('Connection resilience - reconnection after network interruption', async () => {
      console.log('🌐 Testing connection resilience...');

      // Simulate network interruption
      await test.step('Simulate network interruption', async () => {
        // Temporarily disable network for User 2
        await userPage2.route('**/*', route => route.abort());
        
        // User 1 creates a session while User 2 is "offline"
        await userPage1.goto('http://localhost:8100/initiate-pint');
        
        const createButton = userPage1.locator('ion-button:has-text("Create")');
        if (await createButton.isVisible()) {
          await createButton.click();
          
          const offlineSessionName = `Offline Test Session ${Date.now()}`;
          await userPage1.fill('input[name="pubName"]', offlineSessionName);
          await userPage1.fill('input[name="eta"]', '15 minutes');
          
          await userPage1.click('ion-button[type="submit"]');
          
          // Store session name
          await userPage1.evaluate((name) => {
            window.offlineSessionName = name;
          }, offlineSessionName);
        }
      });

      // Restore network connection for User 2
      await test.step('Restore network and verify sync', async () => {
        // Re-enable network for User 2
        await userPage2.unroute('**/*');
        
        // Navigate to dashboard
        await userPage2.goto('http://localhost:8100/tabs/dashboard');
        
        // Should see the session created while offline
        const offlineSessionName = await userPage1.evaluate(() => window.offlineSessionName);
        const offlineSession = userPage2.locator(`.session:has-text("${offlineSessionName}")`);
        
        await expect(offlineSession).toBeVisible({ timeout: 20000 });
      });
    });
  });

  // Helper function to setup user pages
  async function setupUserPage(page: Page, user: any) {
    await page.goto('http://localhost:8100');
    
    await page.evaluate((userData) => {
      localStorage.setItem('firebase-test-user', JSON.stringify(userData));
    }, user);
    
    await page.waitForSelector('ion-app', { timeout: 10000 });
  }
});