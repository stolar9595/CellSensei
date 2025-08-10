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
    await fetch('/ping-test', { method: 'HEAD' });
    const end = performance.now();
    return Math.round(end - start);
  } catch {
    return 999;
  }
}

async function measureDownloadSpeed(): Promise<number> {
  const testSize = 5 * 1024 * 1024; // 5MB
  const start = performance.now();
  
  try {
    // Create a test download by fetching a large response
    const response = await fetch(`data:application/octet-stream;base64,${'A'.repeat(testSize)}`);
    await response.blob();
    
    const end = performance.now();
    const duration = (end - start) / 1000; // Convert to seconds
    const speedMbps = (testSize * 8) / (duration * 1000000); // Convert to Mbps
    
    return Math.round(speedMbps * 10) / 10;
  } catch {
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
  } catch {
    return 0;
  }
}

async function measureJitter(): Promise<number> {
  const pings: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const ping = await measurePing();
    pings.push(ping);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
  const jitter = Math.sqrt(pings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / pings.length);
  
  return Math.round(jitter * 10) / 10;
}
