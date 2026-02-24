export async function runSpeedTest(): Promise<{
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
}> {
  // Measure ping
  const ping = await measurePing();
  
  // Measure download speed
  const downloadSpeed = await measureDownloadSpeed();
  
  // Measure upload speed
  const uploadSpeed = await measureUploadSpeed();
  
  // Calculate jitter
  const jitter = await measureJitter();

  return {
    downloadSpeed,
    uploadSpeed,
    ping,
    jitter,
  };
}

async function measurePing(): Promise<number> {
  const start = performance.now();
  try {
    await fetch('/api/ping', { method: 'HEAD' });
    const end = performance.now();
    return Math.round(end - start);
  } catch (error) {
    console.error('Ping measurement failed:', error);
    return 999;
  }
}

async function measureDownloadSpeed(): Promise<number> {
  const testSize = 1 * 1024 * 1024; // 1MB test payload
  const start = performance.now();
  
  try {
    const response = await fetch(`/api/speed-test/download?size=${testSize}&t=${Date.now()}`);
    await response.arrayBuffer();
    
    const end = performance.now();
    const duration = (end - start) / 1000;
    const speedMbps = (testSize * 8) / (duration * 1000000);
    
    return Math.round(speedMbps * 10) / 10;
  } catch (error) {
    console.error('Download speed measurement failed:', error);
    return 0;
  }
}

async function measureUploadSpeed(): Promise<number> {
  const testData = new Blob(['A'.repeat(1024 * 1024)]); // 1MB
  const start = performance.now();
  
  try {
    await fetch('/api/speed-test/upload', {
      method: 'POST',
      body: testData,
    });
    
    const end = performance.now();
    const duration = (end - start) / 1000; // Convert to seconds
    const speedMbps = (testData.size * 8) / (duration * 1000000); // Convert to Mbps
    
    return Math.round(speedMbps * 10) / 10;
  } catch (error) {
    console.error('Upload speed measurement failed:', error);
    return 0;
  }
}

async function measureJitter(): Promise<number> {
  try {
    const pings: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const ping = await measurePing();
      // Filter out error values (999)
      if (ping < 999) {
        pings.push(ping);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If we don't have enough valid pings, return 0
    if (pings.length < 2) {
      return 0;
    }
    
    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
    const jitter = Math.sqrt(pings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / pings.length);
    
    return Math.round(jitter * 10) / 10;
  } catch (error) {
    console.error('Jitter measurement failed:', error);
    return 0;
  }
}
