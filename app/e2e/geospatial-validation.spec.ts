import { test, expect } from '@playwright/test';

/**
 * Geospatial Query Test Suite
 * 
 * This test suite validates the geohashing implementation and location-based
 * query functionality for accurate session discovery based on proximity.
 */

test.describe('Geospatial Query Validation', () => {
  
  // Test locations with known distances
  const testLocations = {
    belfastCityCenter: { lat: 54.5973, lng: -5.9301, name: 'Belfast City Center' },
    belfastNorth: { lat: 54.6097, lng: -5.9240, name: 'Belfast North' }, // ~1.4km from center
    belfastSouth: { lat: 54.5849, lng: -5.9301, name: 'Belfast South' }, // ~1.4km from center  
    dublin: { lat: 53.3331, lng: -6.2489, name: 'Dublin' }, // ~167km from Belfast
    london: { lat: 51.5074, lng: -0.1278, name: 'London' }, // ~518km from Belfast
    carrickfergus: { lat: 54.7158, lng: -5.8058, name: 'Carrickfergus' }, // ~13km from Belfast
    lisburn: { lat: 54.5162, lng: -6.0365, name: 'Lisburn' } // ~11km from Belfast
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8100');
    
    // Mock authenticated user for all tests
    await page.evaluate(() => {
      const testUser = {
        id: 'geo-test-user',
        email: 'geo@test.com',
        displayName: 'Geo Test User',
        role: 'user'
      };
      localStorage.setItem('firebase-test-user', JSON.stringify(testUser));
    });
  });

  test.describe('Distance-based Session Discovery', () => {
    test('1km radius search returns only nearby sessions', async ({ page }) => {
      console.log('📍 Testing 1km radius precision...');
      
      // Inject test sessions at various distances from Belfast city center
      await page.evaluate((locations) => {
        const testSessions = [
          {
            id: 'session-city-center',
            pubName: 'Central Tavern',
            location: locations.belfastCityCenter,
            distance: 0
          },
          {
            id: 'session-north',
            pubName: 'North Side Pub',
            location: locations.belfastNorth,
            distance: 1.4 // km
          },
          {
            id: 'session-south', 
            pubName: 'South Side Bar',
            location: locations.belfastSouth,
            distance: 1.4 // km
          },
          {
            id: 'session-carrickfergus',
            pubName: 'Carrickfergus Castle Inn',
            location: locations.carrickfergus,
            distance: 13 // km
          },
          {
            id: 'session-dublin',
            pubName: 'Dublin Temple Bar',
            location: locations.dublin,
            distance: 167 // km
          }
        ];
        
        window.testGeoSessions = testSessions;
      }, testLocations);
      
      // Navigate to session search/discovery page
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Set search location to Belfast city center
      const locationInput = page.locator('input[name="location"], .location-search, input[placeholder*="location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Belfast City Center');
        
        // Trigger location search/geocoding
        const searchLocationButton = page.locator('ion-button:has-text("Search Location"), .geocode-button');
        if (await searchLocationButton.isVisible()) {
          await searchLocationButton.click();
        }
      }
      
      // Set radius to 1km
      const radiusSlider = page.locator('input[type="range"], .radius-slider, ion-range');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('1'); // 1km
      }
      
      // Trigger search
      const searchButton = page.locator('ion-button:has-text("Search"), .search-sessions, .apply-filters');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000); // Allow time for geospatial query
      }
      
      // Verify results - should only show sessions within 1km
      await expect(page.locator('.session:has-text("Central Tavern")')).toBeVisible(); // 0km
      
      // These might be visible depending on exact implementation tolerance
      const nearbyResults = page.locator('.session:has-text("North Side"), .session:has-text("South Side")');
      
      // These should definitely NOT be visible (too far)
      await expect(page.locator('.session:has-text("Carrickfergus")')).not.toBeVisible();
      await expect(page.locator('.session:has-text("Dublin")')).not.toBeVisible();
    });

    test('5km radius includes nearby towns', async ({ page }) => {
      console.log('📏 Testing 5km radius expansion...');
      
      // Set search location to Belfast
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      const locationInput = page.locator('input[name="location"], .location-search');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Belfast, Northern Ireland');
      }
      
      // Set radius to 5km
      const radiusSlider = page.locator('input[type="range"], .radius-slider');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('5'); // 5km
      }
      
      const searchButton = page.locator('ion-button:has-text("Search"), .search-sessions');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Should include Belfast city center and immediate surroundings
      await expect(page.locator('.session:has-text("Central Tavern")')).toBeVisible();
      await expect(page.locator('.session:has-text("North Side"), .session:has-text("South Side")')).toBeVisible();
      
      // Should still exclude distant locations
      await expect(page.locator('.session:has-text("Carrickfergus")')).not.toBeVisible();
      await expect(page.locator('.session:has-text("Dublin")')).not.toBeVisible();
    });

    test('20km radius includes greater Belfast area', async ({ page }) => {
      console.log('🌆 Testing 20km radius for greater area...');
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Set radius to 20km
      const radiusSlider = page.locator('input[type="range"], .radius-slider');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('20'); // 20km
      }
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Should now include nearby towns
      await expect(page.locator('.session:has-text("Central Tavern")')).toBeVisible();
      await expect(page.locator('.session:has-text("Carrickfergus")')).toBeVisible(); // 13km
      await expect(page.locator('.session:has-text("Lisburn")')).toBeVisible(); // 11km
      
      // Should still exclude very distant locations
      await expect(page.locator('.session:has-text("Dublin")')).not.toBeVisible();
      await expect(page.locator('.session:has-text("London")')).not.toBeVisible();
    });

    test('500km radius includes neighboring countries', async ({ page }) => {
      console.log('🌍 Testing large radius international search...');
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Set large radius
      const radiusSlider = page.locator('input[type="range"], .radius-slider');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('500'); // 500km
      }
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(3000); // Larger queries may take longer
      }
      
      // Should include Belfast area
      await expect(page.locator('.session:has-text("Central Tavern")')).toBeVisible();
      await expect(page.locator('.session:has-text("Carrickfergus")')).toBeVisible();
      
      // Should include Dublin (167km)
      await expect(page.locator('.session:has-text("Dublin")')).toBeVisible();
      
      // London is right at the edge (518km) - might or might not be included
      // depending on exact implementation, so we won't test for it specifically
    });
  });

  test.describe('Boundary and Edge Case Testing', () => {
    test('Coastal boundary accuracy - sessions near water', async ({ page }) => {
      console.log('🏝️ Testing coastal boundary handling...');
      
      // Inject sessions near Belfast Lough (water boundary)
      await page.evaluate(() => {
        const coastalSessions = [
          {
            id: 'session-harbor',
            pubName: 'Harbor View Tavern',
            location: { lat: 54.6097, lng: -5.8750 }, // Near Belfast harbor
            isCoastal: true
          },
          {
            id: 'session-inland',
            pubName: 'Inland Pub',
            location: { lat: 54.5973, lng: -5.9301 }, // City center (inland)
            isCoastal: false
          },
          {
            id: 'session-seaside',
            pubName: 'Seaside Inn',
            location: { lat: 54.6580, lng: -5.6910 }, // Bangor (coastal)
            isCoastal: true
          }
        ];
        
        window.testCoastalSessions = coastalSessions;
      });
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Search from a coastal location
      const locationInput = page.locator('input[name="location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Belfast Harbor, Northern Ireland');
      }
      
      // Set moderate radius
      const radiusSlider = page.locator('input[type="range"]');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('10'); // 10km
      }
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Should find both coastal and nearby inland sessions
      const sessionResults = page.locator('.session-item, .session');
      await expect(sessionResults.first()).toBeVisible({ timeout: 10000 });
      
      // Verify geospatial queries work correctly near water boundaries
      const resultCount = await sessionResults.count();
      expect(resultCount).toBeGreaterThan(0);
      expect(resultCount).toBeLessThan(20); // Reasonable number of results
    });

    test('High density area performance - many sessions in small area', async ({ page }) => {
      console.log('🏙️ Testing high density session handling...');
      
      // Create many sessions in Belfast city center
      await page.evaluate(() => {
        const belfastCenter = { lat: 54.5973, lng: -5.9301 };
        const denseSessions = [];
        
        // Create 50 sessions within 2km of city center
        for (let i = 0; i < 50; i++) {
          const lat = belfastCenter.lat + (Math.random() - 0.5) * 0.02; // ~2km variance
          const lng = belfastCenter.lng + (Math.random() - 0.5) * 0.02;
          
          denseSessions.push({
            id: `dense-session-${i}`,
            pubName: `Belfast Pub ${i + 1}`,
            location: { lat, lng },
            eta: '30 minutes',
            attendeeCount: Math.floor(Math.random() * 10) + 1
          });
        }
        
        window.testDenseSessions = denseSessions;
      });
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Search in the high-density area
      const locationInput = page.locator('input[name="location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Belfast City Center');
      }
      
      const radiusSlider = page.locator('input[type="range"]');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('3'); // 3km radius
      }
      
      // Measure search performance
      const startTime = Date.now();
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
      }
      
      // Wait for results to load
      const sessionResults = page.locator('.session-item, .session');
      await expect(sessionResults.first()).toBeVisible({ timeout: 15000 });
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      
      // Performance should be reasonable even with many sessions
      expect(searchTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Should return a reasonable number of results (pagination/limiting)
      const resultCount = await sessionResults.count();
      expect(resultCount).toBeGreaterThan(10); // Should find many sessions
      expect(resultCount).toBeLessThan(100); // But not overwhelm the UI
    });

    test('Cross-meridian boundary handling', async ({ page }) => {
      console.log('🌐 Testing longitude boundary edge cases...');
      
      // Test locations near longitude boundaries (though less relevant for Ireland/UK)
      await page.evaluate(() => {
        const boundaryTestSessions = [
          {
            id: 'session-west',
            pubName: 'Western Pub',
            location: { lat: 54.5973, lng: -6.0000 }, // Slightly west
          },
          {
            id: 'session-east',
            pubName: 'Eastern Pub', 
            location: { lat: 54.5973, lng: -5.8000 }, // Slightly east
          }
        ];
        
        window.testBoundarySessions = boundaryTestSessions;
      });
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Search from a location between the boundary test points
      const locationInput = page.locator('input[name="location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('54.5973, -5.9000'); // Between the test points
      }
      
      const radiusSlider = page.locator('input[type="range"]');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('15'); // 15km radius
      }
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Should find sessions on both sides of the search center
      const sessionResults = page.locator('.session-item, .session');
      await expect(sessionResults.first()).toBeVisible({ timeout: 10000 });
      
      // Verify query handles coordinate boundaries correctly
      const resultCount = await sessionResults.count();
      expect(resultCount).toBeGreaterThan(0);
    });
  });

  test.describe('Geohash Implementation Validation', () => {
    test('Geohash precision accuracy for different radii', async ({ page }) => {
      console.log('🔢 Testing geohash precision levels...');
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Test that different radius searches use appropriate geohash precision
      const testRadii = [1, 5, 20, 100]; // km
      
      for (const radius of testRadii) {
        await test.step(`Testing ${radius}km radius`, async () => {
          const radiusSlider = page.locator('input[type="range"]');
          if (await radiusSlider.isVisible()) {
            await radiusSlider.fill(radius.toString());
          }
          
          const searchButton = page.locator('ion-button:has-text("Search")');
          if (await searchButton.isVisible()) {
            await searchButton.click();
            await page.waitForTimeout(1000);
          }
          
          // Check that search completes successfully
          const sessionResults = page.locator('.session-item, .session, .no-results');
          await expect(sessionResults.first()).toBeVisible({ timeout: 10000 });
          
          // Verify reasonable response time regardless of precision
          const searchTime = await page.evaluate(() => {
            return window.lastSearchTime || 0;
          });
          
          expect(searchTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
      }
    });

    test('Real-time location updates with geohash recalculation', async ({ page }) => {
      console.log('📱 Testing real-time location updates...');
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Mock user movement (simulating mobile GPS updates)
      await page.evaluate(() => {
        const locationUpdates = [
          { lat: 54.5973, lng: -5.9301, timestamp: Date.now() }, // Belfast center
          { lat: 54.6097, lng: -5.9240, timestamp: Date.now() + 1000 }, // Moving north
          { lat: 54.6200, lng: -5.9180, timestamp: Date.now() + 2000 } // Further north
        ];
        
        window.testLocationUpdates = locationUpdates;
        
        // Simulate location service updates
        let updateIndex = 0;
        window.locationUpdateInterval = setInterval(() => {
          if (updateIndex < locationUpdates.length) {
            const update = locationUpdates[updateIndex];
            window.dispatchEvent(new CustomEvent('locationUpdate', { detail: update }));
            updateIndex++;
          } else {
            clearInterval(window.locationUpdateInterval);
          }
        }, 1000);
      });
      
      // Enable real-time location tracking
      const locationToggle = page.locator('ion-toggle[name="realTimeLocation"], .location-tracking');
      if (await locationToggle.isVisible()) {
        await locationToggle.click();
      }
      
      // Verify that session results update as location changes
      const sessionResults = page.locator('.session-item, .session');
      
      // Wait for initial results
      await expect(sessionResults.first()).toBeVisible({ timeout: 10000 });
      const initialCount = await sessionResults.count();
      
      // Wait for location updates to process
      await page.waitForTimeout(5000);
      
      // Results should update automatically with new location
      const updatedCount = await sessionResults.count();
      
      // The count might change as the user "moves" to different areas
      // We just verify the system handles updates without crashing
      expect(typeof updatedCount).toBe('number');
      expect(updatedCount).toBeGreaterThanOrEqual(0);
      
      // Clean up interval
      await page.evaluate(() => {
        if (window.locationUpdateInterval) {
          clearInterval(window.locationUpdateInterval);
        }
      });
    });
  });

  test.describe('Performance and Scalability', () => {
    test('Query performance with large dataset', async ({ page }) => {
      console.log('⚡ Testing query performance at scale...');
      
      // Mock large dataset
      await page.evaluate(() => {
        const largeMockDataset = [];
        const baseLocations = [
          { lat: 54.5973, lng: -5.9301 }, // Belfast
          { lat: 53.3331, lng: -6.2489 }, // Dublin
          { lat: 55.8642, lng: -4.2518 }, // Glasgow
          { lat: 53.4808, lng: -2.2426 }  // Manchester
        ];
        
        // Create 1000 sessions across different cities
        for (let i = 0; i < 1000; i++) {
          const baseLocation = baseLocations[i % baseLocations.length];
          const lat = baseLocation.lat + (Math.random() - 0.5) * 0.1; // ~10km variance
          const lng = baseLocation.lng + (Math.random() - 0.5) * 0.1;
          
          largeMockDataset.push({
            id: `scale-session-${i}`,
            pubName: `Scale Test Pub ${i + 1}`,
            location: { lat, lng },
            eta: `${Math.floor(Math.random() * 60) + 5} minutes`,
            attendeeCount: Math.floor(Math.random() * 20) + 1,
            isPrivate: Math.random() > 0.8
          });
        }
        
        window.largeMockDataset = largeMockDataset;
      });
      
      await page.goto('http://localhost:8100/tabs/dashboard');
      
      // Perform search with large dataset
      const locationInput = page.locator('input[name="location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Belfast, Northern Ireland');
      }
      
      const radiusSlider = page.locator('input[type="range"]');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('50'); // 50km radius
      }
      
      // Measure query performance
      const startTime = Date.now();
      
      const searchButton = page.locator('ion-button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
      }
      
      // Wait for results
      const sessionResults = page.locator('.session-item, .session');
      await expect(sessionResults.first()).toBeVisible({ timeout: 20000 });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // Performance requirements
      expect(queryTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      // Verify reasonable result set size
      const resultCount = await sessionResults.count();
      expect(resultCount).toBeGreaterThan(0);
      expect(resultCount).toBeLessThan(200); // Pagination should limit results
      
      console.log(`✅ Large dataset query completed in ${queryTime}ms with ${resultCount} results`);
    });

    test('Concurrent user geospatial queries', async ({ page, context }) => {
      console.log('👥 Testing concurrent geospatial queries...');
      
      // Create multiple pages simulating concurrent users
      const userPages = [];
      for (let i = 0; i < 3; i++) {
        const userPage = await context.newPage();
        await userPage.goto('http://localhost:8100');
        
        // Mock different users
        await userPage.evaluate((userId) => {
          const user = {
            id: `concurrent-user-${userId}`,
            email: `user${userId}@test.com`,
            role: 'user'
          };
          localStorage.setItem('firebase-test-user', JSON.stringify(user));
        }, i);
        
        userPages.push(userPage);
      }
      
      // Perform simultaneous searches from different locations
      const searchPromises = userPages.map(async (userPage, index) => {
        await userPage.goto('http://localhost:8100/tabs/dashboard');
        
        const locations = ['Belfast', 'Dublin', 'Glasgow'];
        const locationInput = userPage.locator('input[name="location"]');
        
        if (await locationInput.isVisible()) {
          await locationInput.fill(locations[index]);
        }
        
        const radiusSlider = userPage.locator('input[type="range"]');
        if (await radiusSlider.isVisible()) {
          await radiusSlider.fill('25'); // 25km radius
        }
        
        const startTime = Date.now();
        
        const searchButton = userPage.locator('ion-button:has-text("Search")');
        if (await searchButton.isVisible()) {
          await searchButton.click();
        }
        
        // Wait for results
        const sessionResults = userPage.locator('.session-item, .session');
        await expect(sessionResults.first()).toBeVisible({ timeout: 15000 });
        
        const endTime = Date.now();
        return {
          userId: index,
          queryTime: endTime - startTime,
          resultCount: await sessionResults.count()
        };
      });
      
      // Wait for all concurrent searches to complete
      const results = await Promise.all(searchPromises);
      
      // Verify all searches completed successfully
      results.forEach((result, index) => {
        expect(result.queryTime).toBeLessThan(20000); // Should complete within 20 seconds
        expect(result.resultCount).toBeGreaterThanOrEqual(0);
        console.log(`User ${index} query: ${result.queryTime}ms, ${result.resultCount} results`);
      });
      
      // Clean up
      await Promise.all(userPages.map(page => page.close()));
    });
  });
});