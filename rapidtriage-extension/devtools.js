// Create RapidTriage DevTools panel
console.log('[RapidTriage] DevTools script starting...');
console.log('[RapidTriage] Chrome version:', navigator.userAgent);

// Add a small delay for Chrome 138+ compatibility
function createPanelSafely() {
    // Create the main panel immediately
    chrome.devtools.panels.create(
        "RapidTriage",
        null, // no icon for now
        "panel.html",
        function(panel) {
            if (chrome.runtime.lastError) {
                console.error('[RapidTriage] Panel creation error:', chrome.runtime.lastError);

                // Retry once after a delay if creation failed
                setTimeout(() => {
                    console.log('[RapidTriage] Retrying panel creation...');
                    chrome.devtools.panels.create(
                        "RapidTriage",
                        null,
                        "panel.html",
                        function(retryPanel) {
                            if (chrome.runtime.lastError) {
                                console.error('[RapidTriage] Panel creation retry failed:', chrome.runtime.lastError);
                            } else {
                                console.log('[RapidTriage] Panel created successfully on retry!');
                                window.rapidTriagePanel = retryPanel;
                            }
                        }
                    );
                }, 1000);
            } else {
                console.log('[RapidTriage] Panel created successfully!');

                // Store panel reference if needed
                window.rapidTriagePanel = panel;

                // Add panel event listeners for better debugging
                panel.onShown.addListener(() => {
                    console.log('[RapidTriage] Panel shown');
                });

                panel.onHidden.addListener(() => {
                    console.log('[RapidTriage] Panel hidden');
                });
            }
        }
    );
}

// For Chrome 138+, add a slight delay to avoid race conditions
if (navigator.userAgent.includes('Chrome/1')) {
    const chromeVersion = parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)[1]);
    if (chromeVersion >= 138) {
        console.log(`[RapidTriage] Detected Chrome ${chromeVersion}, using delayed initialization`);
        setTimeout(createPanelSafely, 200);
    } else {
        createPanelSafely();
    }
} else {
    createPanelSafely();
}

// Also create a sidebar in Elements panel for quick access
chrome.devtools.panels.elements.createSidebarPane(
    "RapidTriage",
    function(sidebar) {
        if (chrome.runtime.lastError) {
            console.error('[RapidTriage] Sidebar error:', chrome.runtime.lastError);
        } else {
            console.log('[RapidTriage] Elements sidebar created!');
            sidebar.setPage("panel.html");
        }
    }
);

console.log('[RapidTriage] DevTools script completed');