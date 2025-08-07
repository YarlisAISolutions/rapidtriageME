const fs = require('fs');

// Simple PNG generator for solid color icons
function createPNG(width, height) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type (RGBA)
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    
    // Create image data with gradient effect
    const imageData = [];
    for (let y = 0; y < height; y++) {
        imageData.push(0); // filter type
        for (let x = 0; x < width; x++) {
            // Create gradient from purple to blue
            const t = (x + y) / (width + height);
            const r = Math.floor(102 + (118 - 102) * t); // #667eea to #764ba2
            const g = Math.floor(126 + (75 - 126) * t);
            const b = Math.floor(234 + (162 - 234) * t);
            const a = 255;
            
            // Add some visual interest with a circle in the center
            const cx = width / 2;
            const cy = height / 2;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const maxDist = Math.min(width, height) / 2.5;
            
            if (dist < maxDist) {
                // Inside circle - make it lighter
                imageData.push(Math.min(255, r + 30));
                imageData.push(Math.min(255, g + 30));
                imageData.push(Math.min(255, b + 30));
                imageData.push(a);
            } else {
                imageData.push(r);
                imageData.push(g);
                imageData.push(b);
                imageData.push(a);
            }
        }
    }
    
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(imageData));
    
    // Helper to create chunk
    function createChunk(type, data) {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const typeBuffer = Buffer.from(type);
        const crc = Buffer.alloc(4);
        
        // Simple CRC calculation (not fully accurate but works for basic PNGs)
        let crcValue = 0xffffffff;
        for (let byte of [...typeBuffer, ...data]) {
            crcValue = crcValue ^ byte;
            for (let i = 0; i < 8; i++) {
                if (crcValue & 1) {
                    crcValue = (crcValue >>> 1) ^ 0xedb88320;
                } else {
                    crcValue = crcValue >>> 1;
                }
            }
        }
        crc.writeUInt32BE(crcValue ^ 0xffffffff);
        
        return Buffer.concat([length, typeBuffer, data, crc]);
    }
    
    // Build PNG
    const ihdrChunk = createChunk('IHDR', ihdr);
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const icon16 = createPNG(16, 16);
const icon48 = createPNG(48, 48);
const icon128 = createPNG(128, 128);

fs.writeFileSync('icon16.png', icon16);
fs.writeFileSync('icon48.png', icon48);
fs.writeFileSync('icon128.png', icon128);

console.log('✅ Icons generated successfully!');
console.log('- icon16.png (16x16)');
console.log('- icon48.png (48x48)');
console.log('- icon128.png (128x128)');