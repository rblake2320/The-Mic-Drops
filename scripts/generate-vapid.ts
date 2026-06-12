import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\n=== VAPID Keys Generated ===");
console.log(`VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log("============================\n");
console.log("Add both lines to your .env file, then restart the server.");
