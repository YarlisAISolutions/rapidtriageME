// Helper function to safely send messages (devtools might not be open)
function safeSendRuntimeMessage(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      // Check for errors but don't throw
      if (chrome.runtime.lastError) {
        // This is expected if DevTools isn't open - silently ignore
        console.debug("Runtime message not delivered:", chrome.runtime.lastError.message);
      } else if (callback) {
        callback(response);
      }
    });
  } catch (e) {
    // Silently ignore - DevTools probably not open
    console.debug("Could not send runtime message:", e.message);
  }
}

// Store selected element data
let selectedElementData = null;

// Listen for messages from the devtools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle element selection messages
  if (message.type === 'ELEMENT_SELECTED') {
    // Store the selected element data
    selectedElementData = message.data;
    console.log('Element selected:', selectedElementData);
    
    // Notify any open popups
    chrome.runtime.sendMessage({
      type: 'ELEMENT_UPDATED',
      data: selectedElementData
    }).catch(() => {
      // Popup might not be open, ignore
    });
    
    sendResponse({success: true});
    return true;
  }
  
  if (message.type === 'DEVTOOLS_ELEMENT_SELECTED') {
    // Element selected via DevTools
    selectedElementData = message.data;
    console.log('DevTools element selected:', selectedElementData);
    
    // Notify any open popups
    chrome.runtime.sendMessage({
      type: 'ELEMENT_UPDATED',
      data: selectedElementData
    }).catch(() => {
      // Popup might not be open, ignore
    });
    
    sendResponse({success: true});
    return true;
  }
  
  if (message.type === 'GET_STORED_ELEMENT') {
    // Return stored element data
    sendResponse({
      success: true,
      data: selectedElementData
    });
    return true;
  }
  
  if (message.type === 'CLEAR_ELEMENT') {
    // Clear stored element
    selectedElementData = null;
    sendResponse({success: true});
    return true;
  }

  if (message.type === "GET_CURRENT_URL" && message.tabId) {
    getCurrentTabUrl(message.tabId)
      .then((url) => {
        sendResponse({ success: true, url: url });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }

  // Handle explicit request to update the server with the URL
  if (message.type === "UPDATE_SERVER_URL" && message.tabId && message.url) {
    console.log(
      `Background: Received request to update server with URL for tab ${message.tabId}: ${message.url}`
    );
    updateServerWithUrl(
      message.tabId,
      message.url,
      message.source || "explicit_update"
    )
      .then(() => {
        if (sendResponse) sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Background: Error updating server with URL:", error);
        if (sendResponse)
          sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }

  if (message.type === "CAPTURE_SCREENSHOT" && message.tabId) {
    // Screenshots MUST always use the local server since remote server can't access browser
    const localSettings = {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Try local server first (required for screenshot functionality)
    validateLocalServerForScreenshot(localSettings.serverHost, localSettings.serverPort)
      .then((isValid) => {
        if (!isValid) {
          // If local server is not available, try to send to remote server as fallback
          // Remote server will store the screenshot data even if it can't capture it
          console.warn(
            "Local browser tools server not available, attempting remote fallback"
          );
          
          // Capture screenshot and try to send to remote
          captureAndSendScreenshotRemote(message, sendResponse);
        } else {
          // Continue with normal local screenshot capture
          captureAndSendScreenshot(message, localSettings, sendResponse);
        }
      })
      .catch((error) => {
        console.error("Error validating server:", error);
        // Try remote fallback
        captureAndSendScreenshotRemote(message, sendResponse);
      });
    return true; // Required to use sendResponse asynchronously
  }
});

// Validate server identity (accepts both local and remote servers)
async function validateServerIdentity(host, port) {
  try {
    // Determine the URL based on host/port
    const isRemote = (host === 'rapidtriage.me' || host === 'www.rapidtriage.me');
    const protocol = isRemote ? 'https' : 'http';
    const portPart = isRemote ? '' : `:${port}`;
    const url = `${protocol}://${host}${portPart}/.identity`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!response.ok) {
      console.error(`Invalid server response: ${response.status}`);
      return false;
    }

    const identity = await response.json();

    // Accept both local and remote server signatures
    const validSignatures = [
      "mcp-browser-connector-24x7",  // Local browser tools server
      "rapidtriage-remote"            // Remote RapidTriage server
    ];

    if (validSignatures.includes(identity.signature)) {
      console.log(`Connected to ${identity.signature === "rapidtriage-remote" ? "remote" : "local"} server`);
      return true;
    }

    console.error("Invalid server signature:", identity.signature);
    return false;
  } catch (error) {
    console.error("Error validating server identity:", error);
    return false;
  }
}

// Validate local server specifically for screenshot functionality
async function validateLocalServerForScreenshot(host, port) {
  try {
    const response = await fetch(`http://${host}:${port}/.identity`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout for local
    });

    if (!response.ok) {
      console.error(`Local server not responding: ${response.status}`);
      return false;
    }

    const identity = await response.json();

    // Check for local browser tools server signature
    if (identity.signature === "mcp-browser-connector-24x7") {
      return true;
    }

    console.error("Local server has wrong signature:", identity.signature);
    return false;
  } catch (error) {
    console.error("Local server not available:", error.message);
    return false;
  }
}

// Capture screenshot and send to remote server as fallback
function captureAndSendScreenshotRemote(message, sendResponse) {
  // Get the inspected window's tab
  chrome.tabs.get(message.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab:", chrome.runtime.lastError);
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message,
      });
      return;
    }

    // Get all windows to find the one containing our tab
    chrome.windows.getAll({ populate: true }, (windows) => {
      const targetWindow = windows.find((w) =>
        w.tabs.some((t) => t.id === message.tabId)
      );

      if (!targetWindow) {
        console.error("Could not find window containing the inspected tab");
        sendResponse({
          success: false,
          error: "Could not find window containing the inspected tab",
        });
        return;
      }

      // Capture screenshot of the window containing our tab
      chrome.tabs.captureVisibleTab(
        targetWindow.id,
        { format: "png" },
        (dataUrl) => {
          // Ignore DevTools panel capture error if it occurs
          if (
            chrome.runtime.lastError &&
            !chrome.runtime.lastError.message.includes("devtools://")
          ) {
            console.error(
              "Error capturing screenshot:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }

          // Try to send to remote server
          const remoteUrl = `https://rapidtriage.me/api/screenshot`;
          console.log(`Sending screenshot to remote server: ${remoteUrl}`);

          fetch(remoteUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Extension-Id": chrome.runtime.id,
            },
            body: JSON.stringify({
              data: dataUrl,
              url: tab.url,
              title: tab.title,
              timestamp: new Date().toISOString(),
            }),
          })
            .then((response) => response.json())
            .then((result) => {
              console.log("Screenshot sent to remote server:", result);
              sendResponse({
                success: true,
                path: "remote-screenshot-" + Date.now() + ".png",
                title: tab.title || "Current Tab",
                remote: true,
              });
            })
            .catch((error) => {
              console.error("Error sending screenshot to remote:", error);
              // Still mark as success if we captured it
              sendResponse({
                success: true,
                path: "local-screenshot-" + Date.now() + ".png",
                title: tab.title || "Current Tab",
                error: "Could not upload to server, but screenshot was captured",
              });
            });
        }
      );
    });
  });
}

// Helper function to process the tab and run the audit
function processTabForAudit(tab, tabId) {
  const url = tab.url;

  if (!url) {
    console.error(`No URL available for tab ${tabId}`);
    return;
  }

  // Update our cache and the server with this URL
  tabUrls.set(tabId, url);
  updateServerWithUrl(tabId, url);
}

// Track URLs for each tab
const tabUrls = new Map();

// Function to get the current URL for a tab
async function getCurrentTabUrl(tabId) {
  try {
    console.log("Background: Getting URL for tab", tabId);

    // First check if we have it cached
    if (tabUrls.has(tabId)) {
      const cachedUrl = tabUrls.get(tabId);
      console.log("Background: Found cached URL:", cachedUrl);
      return cachedUrl;
    }

    // Otherwise get it from the tab
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        // Cache the URL
        tabUrls.set(tabId, tab.url);
        console.log("Background: Got URL from tab:", tab.url);
        return tab.url;
      } else {
        console.log("Background: Tab exists but no URL found");
      }
    } catch (tabError) {
      console.error("Background: Error getting tab:", tabError);
    }

    // If we can't get the tab directly, try querying for active tabs
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs && tabs.length > 0 && tabs[0].url) {
        const activeUrl = tabs[0].url;
        console.log("Background: Got URL from active tab:", activeUrl);
        // Cache this URL as well
        tabUrls.set(tabId, activeUrl);
        return activeUrl;
      }
    } catch (queryError) {
      console.error("Background: Error querying tabs:", queryError);
    }

    console.log("Background: Could not find URL for tab", tabId);
    return null;
  } catch (error) {
    console.error("Background: Error getting tab URL:", error);
    return null;
  }
}

// Listen for tab updates to detect page refreshes and URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Track URL changes
  if (changeInfo.url) {
    console.log(`URL changed in tab ${tabId} to ${changeInfo.url}`);
    tabUrls.set(tabId, changeInfo.url);

    // Send URL update to server if possible
    updateServerWithUrl(tabId, changeInfo.url, "tab_url_change");
  }

  // Check if this is a page refresh (status becoming "complete")
  if (changeInfo.status === "complete") {
    // Update URL in our cache
    if (tab.url) {
      tabUrls.set(tabId, tab.url);
      // Send URL update to server if possible
      updateServerWithUrl(tabId, tab.url, "page_complete");
    }

    retestConnectionOnRefresh(tabId);
  }
});

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log(`Tab activated: ${tabId}`);

  // Get the URL of the newly activated tab
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab info:", chrome.runtime.lastError);
      return;
    }

    if (tab && tab.url) {
      console.log(`Active tab changed to ${tab.url}`);

      // Update our cache
      tabUrls.set(tabId, tab.url);

      // Send URL update to server
      updateServerWithUrl(tabId, tab.url, "tab_activated");
    }
  });
});

// Function to update the server with the current URL
async function updateServerWithUrl(tabId, url, source = "background_update") {
  if (!url) {
    console.error("Cannot update server with empty URL");
    return;
  }

  console.log(`Updating server with URL for tab ${tabId}: ${url}`);

  // Get the saved settings
  chrome.storage.local.get(["browserConnectorSettings"], async (result) => {
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Maximum number of retry attempts
    const maxRetries = 3;
    let retryCount = 0;
    let success = false;

    while (retryCount < maxRetries && !success) {
      try {
        // Send the URL to the server
        const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/current-url`;
        console.log(
          `Attempt ${
            retryCount + 1
          }/${maxRetries} to update server with URL: ${url}`
        );

        const response = await fetch(serverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url,
            tabId: tabId,
            timestamp: Date.now(),
            source: source,
          }),
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log(
            `Successfully updated server with URL: ${url}`,
            responseData
          );
          success = true;
        } else {
          console.error(
            `Server returned error: ${response.status} ${response.statusText}`
          );
          retryCount++;
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error updating server with URL: ${error.message}`);
        retryCount++;
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!success) {
      console.error(
        `Failed to update server with URL after ${maxRetries} attempts`
      );
    }
  });
}

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrls.delete(tabId);
});

// Function to retest connection when a page is refreshed
async function retestConnectionOnRefresh(tabId) {
  console.log(`Page refreshed in tab ${tabId}, retesting connection...`);

  // Get the saved settings
  chrome.storage.local.get(["browserConnectorSettings"], async (result) => {
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Test the connection with the last known host and port
    const isConnected = await validateServerIdentity(
      settings.serverHost,
      settings.serverPort
    );

    // Notify all devtools instances about the connection status
    safeSendRuntimeMessage({
      type: "CONNECTION_STATUS_UPDATE",
      isConnected: isConnected,
      tabId: tabId,
    });

    // Always notify for page refresh, whether connected or not
    // This ensures any ongoing discovery is cancelled and restarted
    safeSendRuntimeMessage({
      type: "INITIATE_AUTO_DISCOVERY",
      reason: "page_refresh",
      tabId: tabId,
      forceRestart: true, // Add a flag to indicate this should force restart any ongoing processes
    });

    if (!isConnected) {
      console.log(
        "Connection test failed after page refresh, initiating auto-discovery..."
      );
    } else {
      console.log("Connection test successful after page refresh");
    }
  });
}

// Function to capture and send screenshot
function captureAndSendScreenshot(message, settings, sendResponse) {
  // Get the inspected window's tab
  chrome.tabs.get(message.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab:", chrome.runtime.lastError);
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message,
      });
      return;
    }

    // Get all windows to find the one containing our tab
    chrome.windows.getAll({ populate: true }, (windows) => {
      const targetWindow = windows.find((w) =>
        w.tabs.some((t) => t.id === message.tabId)
      );

      if (!targetWindow) {
        console.error("Could not find window containing the inspected tab");
        sendResponse({
          success: false,
          error: "Could not find window containing the inspected tab",
        });
        return;
      }

      // Capture screenshot of the window containing our tab
      chrome.tabs.captureVisibleTab(
        targetWindow.id,
        { format: "png" },
        (dataUrl) => {
          // Ignore DevTools panel capture error if it occurs
          if (
            chrome.runtime.lastError &&
            !chrome.runtime.lastError.message.includes("devtools://")
          ) {
            console.error(
              "Error capturing screenshot:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }

          // Send screenshot data to browser connector using configured settings
          const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/screenshot`;
          console.log(`Sending screenshot to ${serverUrl}`);

          fetch(serverUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: dataUrl,
              path: message.screenshotPath,
            }),
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.error) {
                console.error("Error from server:", result.error);
                sendResponse({ success: false, error: result.error });
              } else {
                console.log("Screenshot saved successfully:", result.path);
                // Send success response even if DevTools capture failed
                sendResponse({
                  success: true,
                  path: result.path,
                  title: tab.title || "Current Tab",
                });
              }
            })
            .catch((error) => {
              console.error("Error sending screenshot data:", error);
              sendResponse({
                success: false,
                error: error.message || "Failed to save screenshot",
              });
            });
        }
      );
    });
  });
}
