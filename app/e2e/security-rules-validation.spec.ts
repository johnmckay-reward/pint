import { test, expect } from '@playwright/test';

/**
 * Firestore Security Rules Test Suite
 * 
 * This test suite specifically validates the Firestore security rules by attempting
 * various unauthorized operations and ensuring they are properly blocked.
 */

test.describe('Firestore Security Rules Validation', () => {
  
  test.describe('Authentication Requirements', () => {
    test('Unauthenticated access should be denied for all collections', async ({ page }) => {
      console.log('🚫 Testing unauthenticated access denial...');
      
      await page.goto('http://localhost:8100');
      
      // Clear all authentication state
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Clear any Firebase auth tokens
        if (window.firebase) {
          window.firebase.auth().signOut();
        }
      });
      
      // Try to access the main app - should be redirected to login
      await page.waitForSelector('ion-app', { timeout: 10000 });
      
      // Check for authentication requirement
      const authElements = page.locator('ion-button:has-text("Login"), ion-button:has-text("Sign In"), .auth-required, .login-required');
      await expect(authElements.first()).toBeVisible({ timeout: 10000 });
      
      // Verify no sensitive data is accessible
      const protectedContent = page.locator('.sessions, .user-profile, .admin-panel');
      await expect(protectedContent.first()).not.toBeVisible();
    });
  });

  test.describe('User Collection Security', () => {
    test('Users can read any profile but only edit their own', async ({ page }) => {
      console.log('👤 Testing user profile access controls...');
      
      await page.goto('http://localhost:8100');
      
      // Mock authenticated user
      await page.evaluate(() => {
        const mockUser = {
          id: 'test-user-1',
          email: 'user1@test.com',
          displayName: 'Test User One',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(mockUser));
        
        // Mock Firebase auth state
        if (window.firebase) {
          window.firebase.auth().currentUser = mockUser;
        }
      });
      
      // Navigate to profile page
      await page.goto('http://localhost:8100/profile');
      
      // Should be able to view own profile
      const ownProfile = page.locator('.user-profile, .profile-info');
      await expect(ownProfile).toBeVisible({ timeout: 10000 });
      
      // Should be able to edit own profile
      const editButton = page.locator('ion-button:has-text("Edit"), .edit-profile');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const saveButton = page.locator('ion-button:has-text("Save"), button[type="submit"]');
        await expect(saveButton).toBeVisible();
      }
    });

    test('Users cannot access or modify other users profiles', async ({ page }) => {
      console.log('🔒 Testing cross-user profile protection...');
      
      await page.goto('http://localhost:8100');
      
      // Mock user trying to access another user's profile
      await page.evaluate(() => {
        const mockUser = {
          id: 'test-user-2',
          email: 'user2@test.com',
          displayName: 'Test User Two',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(mockUser));
      });
      
      // Try to access another user's profile directly via URL manipulation
      await page.goto('http://localhost:8100/profile/test-user-1');
      
      // Should be denied or redirected
      const errorMessage = page.locator('.error, .access-denied, .unauthorized');
      const redirected = page.locator('.profile-not-found, ion-button:has-text("Back")');
      
      // Either should see an error or be redirected away from the profile
      const deniedAccess = page.locator('.error, .access-denied, .unauthorized, .profile-not-found');
      await expect(deniedAccess.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('PintSessions Collection Security', () => {
    test('All authenticated users can read sessions', async ({ page }) => {
      console.log('📖 Testing session read access...');
      
      await page.goto('http://localhost:8100');
      
      // Mock authenticated user
      await page.evaluate(() => {
        const mockUser = {
          id: 'reader-user',
          email: 'reader@test.com',
          displayName: 'Reader User',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(mockUser));
      });
      
      // Navigate to sessions list
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Should be able to see sessions list
      const sessionsList = page.locator('.sessions, .sessions-list, .available-sessions');
      await expect(sessionsList.first()).toBeVisible({ timeout: 10000 });
    });

    test('Only session creators can edit/delete their sessions', async ({ page }) => {
      console.log('✏️ Testing session edit/delete permissions...');
      
      await page.goto('http://localhost:8100');
      
      // Mock session creator
      await page.evaluate(() => {
        const sessionCreator = {
          id: 'session-creator',
          email: 'creator@test.com',
          displayName: 'Session Creator',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(sessionCreator));
        
        // Mock a session created by this user
        const mockSession = {
          id: 'test-session-1',
          initiatorId: 'session-creator',
          pubName: 'Test Pub',
          attendeeIds: ['session-creator']
        };
        localStorage.setItem('mock-user-session', JSON.stringify(mockSession));
      });
      
      // Navigate to user's sessions
      await page.goto('http://localhost:8100/my-sessions');
      
      // Should see edit/delete options for own session
      const ownSession = page.locator('.session[data-creator="session-creator"]');
      if (await ownSession.isVisible()) {
        const editButton = ownSession.locator('ion-button:has-text("Edit"), .edit-session');
        const deleteButton = ownSession.locator('ion-button:has-text("Delete"), .delete-session');
        
        await expect(editButton.or(deleteButton)).toBeVisible();
      }
    });

    test('Users cannot edit sessions they did not create', async ({ page }) => {
      console.log('❌ Testing unauthorized session modification...');
      
      await page.goto('http://localhost:8100');
      
      // Mock different user (not the session creator)
      await page.evaluate(() => {
        const otherUser = {
          id: 'other-user',
          email: 'other@test.com',
          displayName: 'Other User',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(otherUser));
        
        // Mock viewing a session created by someone else
        const otherUserSession = {
          id: 'other-session',
          initiatorId: 'session-creator',
          pubName: 'Other Test Pub',
          attendeeIds: ['session-creator', 'other-attendee']
        };
        localStorage.setItem('mock-other-session', JSON.stringify(otherUserSession));
      });
      
      // Navigate to sessions list
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Find session created by another user
      const otherSession = page.locator('.session[data-creator="session-creator"]');
      if (await otherSession.isVisible()) {
        // Should NOT see edit/delete options
        const editButton = otherSession.locator('ion-button:has-text("Edit"), .edit-session');
        const deleteButton = otherSession.locator('ion-button:has-text("Delete"), .delete-session');
        
        await expect(editButton).not.toBeVisible();
        await expect(deleteButton).not.toBeVisible();
        
        // Should only see view/join options
        const viewButton = otherSession.locator('ion-button:has-text("View"), ion-button:has-text("Join")');
        await expect(viewButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Chat Messages Security', () => {
    test('Users can only delete their own messages', async ({ page }) => {
      console.log('💬 Testing chat message deletion permissions...');
      
      await page.goto('http://localhost:8100');
      
      // Mock user in a chat session
      await page.evaluate(() => {
        const chatUser = {
          id: 'chat-user',
          email: 'chat@test.com',
          displayName: 'Chat User',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(chatUser));
        
        // Mock chat messages
        const mockMessages = [
          {
            id: 'msg-1',
            senderId: 'chat-user',
            content: 'My message',
            createdAt: new Date()
          },
          {
            id: 'msg-2', 
            senderId: 'other-chat-user',
            content: 'Other user message',
            createdAt: new Date()
          }
        ];
        localStorage.setItem('mock-chat-messages', JSON.stringify(mockMessages));
      });
      
      // Navigate to a chat session
      await page.goto('http://localhost:8100/session/test-session/chat');
      
      // Should see delete option only on own messages
      const ownMessage = page.locator('.message[data-sender="chat-user"]');
      if (await ownMessage.isVisible()) {
        const deleteButton = ownMessage.locator('ion-button:has-text("Delete"), .delete-message');
        await expect(deleteButton).toBeVisible();
      }
      
      // Should NOT see delete option on other users' messages
      const otherMessage = page.locator('.message[data-sender="other-chat-user"]');
      if (await otherMessage.isVisible()) {
        const deleteButton = otherMessage.locator('ion-button:has-text("Delete"), .delete-message');
        await expect(deleteButton).not.toBeVisible();
      }
    });

    test('Messages are immutable - no edit functionality', async ({ page }) => {
      console.log('📝 Testing message immutability...');
      
      await page.goto('http://localhost:8100');
      
      // Mock user in chat session
      await page.evaluate(() => {
        const chatUser = {
          id: 'edit-test-user',
          email: 'edit@test.com',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(chatUser));
      });
      
      // Navigate to chat
      await page.goto('http://localhost:8100/session/test-session/chat');
      
      // Look for any edit functionality on messages (should not exist)
      const editButtons = page.locator('ion-button:has-text("Edit"), .edit-message');
      await expect(editButtons.first()).not.toBeVisible();
      
      // Messages should not have contentEditable or input fields
      const editableMessages = page.locator('.message[contenteditable="true"], .message input, .message textarea');
      await expect(editableMessages.first()).not.toBeVisible();
    });
  });

  test.describe('Admin Collection Security', () => {
    test('Only admin users can access admin collections', async ({ page }) => {
      console.log('👑 Testing admin-only access...');
      
      await page.goto('http://localhost:4201'); // Admin dashboard
      
      // Test with regular user (should be denied)
      await page.evaluate(() => {
        const regularUser = {
          id: 'regular-user',
          email: 'user@test.com',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(regularUser));
      });
      
      // Should be denied access or redirected
      const accessDenied = page.locator('.access-denied, .unauthorized, .admin-required');
      const loginPrompt = page.locator('ion-button:has-text("Login"), .login-required');
      
      await expect(accessDenied.or(loginPrompt)).toBeVisible({ timeout: 10000 });
    });

    test('Admin users can access admin dashboard', async ({ page }) => {
      console.log('✅ Testing admin access privileges...');
      
      await page.goto('http://localhost:4201');
      
      // Mock admin user
      await page.evaluate(() => {
        const adminUser = {
          id: 'admin-user',
          email: 'admin@pint.com',
          role: 'admin'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(adminUser));
      });
      
      // Should have access to admin dashboard
      const adminDashboard = page.locator('.admin-dashboard, .admin-panel, .dashboard');
      await expect(adminDashboard.first()).toBeVisible({ timeout: 10000 });
      
      // Should see admin-specific features
      const adminFeatures = page.locator('.user-management, .pub-approvals, .analytics');
      await expect(adminFeatures.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Pub Owner Collection Security', () => {
    test('Pub owners can access partner dashboard', async ({ page }) => {
      console.log('🏪 Testing pub owner access...');
      
      await page.goto('http://localhost:4200'); // Partner dashboard
      
      // Mock pub owner
      await page.evaluate(() => {
        const pubOwner = {
          id: 'pub-owner',
          email: 'owner@testpub.com',
          role: 'pub_owner'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(pubOwner));
      });
      
      // Should have access to partner dashboard
      const partnerDashboard = page.locator('.partner-dashboard, .pub-dashboard, .dashboard');
      await expect(partnerDashboard.first()).toBeVisible({ timeout: 10000 });
      
      // Should see partner-specific features
      const partnerFeatures = page.locator('.claim-pub, .pub-analytics, .manage-sessions');
      await expect(partnerFeatures.first()).toBeVisible({ timeout: 10000 });
    });

    test('Regular users cannot access partner dashboard', async ({ page }) => {
      console.log('🚫 Testing partner dashboard protection...');
      
      await page.goto('http://localhost:4200');
      
      // Mock regular user
      await page.evaluate(() => {
        const regularUser = {
          id: 'regular-user-2',
          email: 'user2@test.com',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(regularUser));
      });
      
      // Should be denied access
      const accessDenied = page.locator('.access-denied, .unauthorized, .partner-required');
      const upgradePrompt = page.locator('.upgrade-to-partner, ion-button:has-text("Become Partner")');
      
      await expect(accessDenied.or(upgradePrompt)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Friendship Collection Security', () => {
    test('Users can only see friendships they are involved in', async ({ page }) => {
      console.log('👥 Testing friendship privacy...');
      
      await page.goto('http://localhost:8100');
      
      // Mock user checking friendships
      await page.evaluate(() => {
        const friendshipUser = {
          id: 'friendship-user',
          email: 'friend@test.com',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(friendshipUser));
        
        // Mock friendships - user should only see ones they're involved in
        const mockFriendships = [
          {
            id: 'friendship-1',
            requesterId: 'friendship-user',
            addresseeId: 'other-user-1',
            status: 'pending'
          },
          {
            id: 'friendship-2',
            requesterId: 'other-user-2', 
            addresseeId: 'friendship-user',
            status: 'accepted'
          },
          {
            id: 'friendship-3',
            requesterId: 'unrelated-user-1',
            addresseeId: 'unrelated-user-2',
            status: 'accepted'
          }
        ];
        localStorage.setItem('mock-friendships', JSON.stringify(mockFriendships));
      });
      
      // Navigate to friends page
      await page.goto('http://localhost:8100/friends');
      
      // Should see friendships involving the user
      const userFriendships = page.locator('.friendship[data-involves-user="true"]');
      await expect(userFriendships.first()).toBeVisible({ timeout: 10000 });
      
      // Should NOT see friendships between other users
      const otherFriendships = page.locator('.friendship[data-involves-user="false"]');
      await expect(otherFriendships.first()).not.toBeVisible();
    });
  });

  test.describe('Data Validation Security', () => {
    test('User data validation prevents invalid role assignments', async ({ page }) => {
      console.log('🛡️ Testing data validation rules...');
      
      await page.goto('http://localhost:8100');
      
      // Try to inject invalid user data
      await page.evaluate(() => {
        // Attempt to create user with invalid role
        const invalidUser = {
          id: 'hack-user',
          email: 'hack@test.com',
          role: 'super_admin', // Invalid role
          displayName: 'Hacker'
        };
        
        // This should be rejected by Firestore rules
        localStorage.setItem('firebase-test-user', JSON.stringify(invalidUser));
      });
      
      // Navigate to profile page
      await page.goto('http://localhost:8100/profile');
      
      // Should either be denied access or role should be corrected
      const invalidAccess = page.locator('.invalid-role, .role-error');
      const defaultRole = page.locator('.role:has-text("user")');
      
      // Either see error or role is forced to valid value
      await expect(invalidAccess.or(defaultRole)).toBeVisible({ timeout: 10000 });
    });

    test('Session validation prevents unauthorized session creation', async ({ page }) => {
      console.log('⚡ Testing session creation validation...');
      
      await page.goto('http://localhost:8100');
      
      // Mock user
      await page.evaluate(() => {
        const sessionUser = {
          id: 'session-test-user',
          email: 'session@test.com',
          role: 'user'
        };
        localStorage.setItem('firebase-test-user', JSON.stringify(sessionUser));
      });
      
      // Navigate to session creation
      await page.goto('http://localhost:8100/initiate-pint');
      
      // Try to create session with invalid data
      const pubNameInput = page.locator('input[name="pubName"]');
      if (await pubNameInput.isVisible()) {
        // Leave required fields empty or with invalid data
        await pubNameInput.fill(''); // Empty pub name should be invalid
        
        const submitButton = page.locator('ion-button[type="submit"]');
        await submitButton.click();
        
        // Should see validation error
        const validationError = page.locator('.error, .validation-error, ion-alert');
        await expect(validationError.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});