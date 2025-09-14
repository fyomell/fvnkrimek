// config.js
const config = {
  // Domain Pterodactyl kamu, JANGAN PAKE "/" di akhir
  domain: "https://rofiksoleh.cloud-hosting.biz.id",

  // Apikey dari Pterodactyl (Application API)
  // Cara buat: Admin Area -> Application API -> Create New
  apiKey: "ptla_REyLUYSXyLS6BE0Up3YSyd3fTVS2mMQnjsO7cFU0uDZ",

  // Default ID untuk Egg, Nest, dan Location
  eggId: "15",    // Ganti dengan ID Egg yang kamu mau (misal: NodeJS)
  nestId: "5",     // Ganti dengan ID Nest dari Egg di atas
  locationId: "1" // Ganti dengan ID Location server
};
const telegramConfig = {
  // Ganti dengan token bot dari @BotFather
  botToken: "TOKEN_BOT_TELEGRAM_KAMU",

  // Ganti dengan Chat ID kamu dari @userinfobot
  chatId: "CHAT_ID_TELEGRAM_KAMU"
};

// Export kedua config
export { pterodactylConfig, telegramConfig };