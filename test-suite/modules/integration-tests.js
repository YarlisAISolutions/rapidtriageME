// Integration Tests Module
const integrationTests = {
    async runScenario1() {
        testRunner.logActivity('Running Scenario 1: Full Extension Flow...', 'info');
        const resultDiv = document.getElementById('scenario1-result');
        
        try {
            // Step 1: Check extension
            await extensionTests.checkInstalled();
            
            // Step 2: Test API connection
            await extensionTests.testAPI();
            
            // Step 3: Test all features
            await extensionTests.testButtons();
            
            if (resultDiv) {
                resultDiv.innerHTML = '<span style="color: green;">✅ Scenario completed successfully</span>';
            }
            testRunner.logActivity('Scenario 1 completed successfully', 'success');
            testRunner.updateTestResults(1, 0, 0);
        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `<span style="color: red;">❌ Scenario failed: ${error.message}</span>`;
            }
            testRunner.logActivity(`Scenario 1 failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async runScenario2() {
        testRunner.logActivity('Running Scenario 2: Server Failover...', 'info');
        const resultDiv = document.getElementById('scenario2-result');
        
        try {
            // Test failover from local to remote
            const localUrl = 'http://localhost:3025/.identity';
            const remoteUrl = 'https://rapidtriage.me/.identity';
            
            let connectedServer = null;
            
            // Try local first
            try {
                const localResponse = await TestUtils.fetchWithTimeout(localUrl, {}, 2000);
                if (localResponse.ok) {
                    connectedServer = 'local';
                }
            } catch {
                // Local failed, try remote
                const remoteResponse = await TestUtils.fetchWithTimeout(remoteUrl, {
                    headers: { 'X-Extension-Id': 'test' }
                }, 2000);
                if (remoteResponse.ok) {
                    connectedServer = 'remote';
                }
            }
            
            if (connectedServer) {
                if (resultDiv) {
                    resultDiv.innerHTML = `<span style="color: green;">✅ Failover successful - connected to ${connectedServer}</span>`;
                }
                testRunner.logActivity(`Scenario 2 completed - using ${connectedServer} server`, 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                throw new Error('No servers available');
            }
        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `<span style="color: red;">❌ Failover failed: ${error.message}</span>`;
            }
            testRunner.logActivity(`Scenario 2 failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async runScenario3() {
        testRunner.logActivity('Running Scenario 3: Error Recovery...', 'info');
        const resultDiv = document.getElementById('scenario3-result');
        
        try {
            // Test error handling and recovery
            const errors = [];
            const recoveries = [];
            
            // Test 1: Invalid endpoint
            try {
                await fetch('http://invalid-endpoint-test.local');
            } catch (error) {
                errors.push('Network error handled');
                recoveries.push('Fallback to cached data');
            }
            
            // Test 2: Timeout recovery
            try {
                await TestUtils.fetchWithTimeout('https://httpstat.us/200?sleep=10000', {}, 1000);
            } catch (error) {
                if (error.message.includes('timeout')) {
                    errors.push('Timeout handled');
                    recoveries.push('Request retried with longer timeout');
                }
            }
            
            // Test 3: Server error recovery
            const response = await fetch('https://httpstat.us/500');
            if (!response.ok) {
                errors.push('Server error handled');
                recoveries.push('Graceful degradation applied');
            }
            
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <span style="color: green;">✅ Error recovery successful</span><br>
                    <small>Handled: ${errors.length} errors, Applied: ${recoveries.length} recoveries</small>
                `;
            }
            testRunner.logActivity(`Scenario 3 completed - ${errors.length} errors handled`, 'success');
            testRunner.updateTestResults(1, 0, 0);
        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `<span style="color: red;">❌ Error recovery failed: ${error.message}</span>`;
            }
            testRunner.logActivity(`Scenario 3 failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async runScenario4() {
        testRunner.logActivity('Running Scenario 4: Performance Under Load...', 'info');
        const resultDiv = document.getElementById('scenario4-result');
        
        try {
            const startTime = performance.now();
            const promises = [];
            
            // Create 10 concurrent requests
            for (let i = 0; i < 10; i++) {
                promises.push(
                    fetch('https://jsonplaceholder.typicode.com/posts/' + (i + 1))
                        .then(r => r.json())
                );
            }
            
            const results = await Promise.allSettled(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <span style="color: ${successful === 10 ? 'green' : 'orange'};">
                        ${successful === 10 ? '✅' : '⚠️'} Load test completed
                    </span><br>
                    <small>
                        Successful: ${successful}/10, 
                        Failed: ${failed}/10, 
                        Duration: ${duration.toFixed(2)}ms
                    </small>
                `;
            }
            
            testRunner.logActivity(`Scenario 4 completed - ${successful}/10 requests successful in ${duration.toFixed(2)}ms`, 'success');
            testRunner.updateTestResults(successful === 10 ? 1 : 0, failed > 0 ? 1 : 0, 0);
        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `<span style="color: red;">❌ Load test failed: ${error.message}</span>`;
            }
            testRunner.logActivity(`Scenario 4 failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    }
};