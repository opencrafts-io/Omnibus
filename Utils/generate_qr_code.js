export function generateGoQrUrl(url, size = 200, color = "111827") {
    // encodeURIComponent ensures special characters in your link/data don't break the URL
    const encodedData = encodeURIComponent(url);
    
    // GoQR API parameters: size, data payload, foreground color, and format
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&color=${color}&format=png`;
}