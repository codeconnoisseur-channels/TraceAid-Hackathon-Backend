const axios = require("axios");

// Assume environment variables are available via process.env
const KORA_API_BASE = process.env.KORA_API_BASE || "https://api.korapay.com/merchant/api/v1";
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY.trim();

console.log("KORA_API_BASE:", KORA_API_BASE);
console.log("KORA_SECRET_KEY:", KORA_SECRET_KEY);

let KORA_BANK_LIST = [];
let banksInitialized = false;

exports.fetchAndCacheKoraBanks = async () => {


  console.log("KORA_SECRET_KEY:", KORA_SECRET_KEY);

  if (banksInitialized) return;

  if (!KORA_SECRET_KEY) {
    console.error("❌ CRITICAL ERROR: KORA_SECRET_KEY is not defined. Cannot fetch bank list.");
    return;
  }

  // --- FIX APPLIED HERE: Using /misc/banks?country=NGN ---
  const bankListUrl = `${KORA_API_BASE}/misc/banks?country=NGN`;
  console.log(`Initializing Kora Bank List from: ${bankListUrl}`);

  try {
    const response = await axios.get(bankListUrl, {
      headers: { Authorization: `Bearer ${KORA_SECRET_KEY}` },
    });

    console.log("KORA_SECRET_KEY length:", KORA_SECRET_KEY.length);

    console.log(`Kora Bank List API Response Status: ${response.status}`);

    // Assuming Korapay returns data in response.data.data
    if (response.data && response.data.data && Array.isArray(response.data.data)) {


        console.log("KORA_SECRET_KEY:", KORA_SECRET_KEY);
      KORA_BANK_LIST = response.data.data;
      banksInitialized = true;
      console.log(`✅ Successfully cached ${KORA_BANK_LIST.length} bank codes from Kora.`);
    } else {
      console.error("Kora Bank List API returned unexpected format.");
    }
  } catch (error) {
    const status = error.response ? `Status Code ${error.response.status}` : "Network Error";
    console.error(`❌ CRITICAL ERROR: Failed to fetch Kora Bank list. ${status}.`);
    console.error("Static bank lookup will be used as fallback. This should be fixed.");
  }
};

exports.getKorapayBankCode = (bankName) => {
  if (!bankName) return null;

  // 1. Normalize the input bank name for reliable matching
  const normalizedInputName = bankName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

  // --- Fallback/Error Check ---
  if (!KORA_BANK_LIST.length) {
    // Fallback to the hardcoded map temporarily if the API failed on startup
    const staticBankMap = {
      accessbank: "044",
      zenithbank: "057",
      guarantytrustbank: "058",
      firstbankofnigeria: "011",
      fidelitybank: "070",
      // Add other static banks here if your list is extensive
    };
    return staticBankMap[normalizedInputName] || null;
  }

  // 2. Search the Cached KORA_BANK_LIST
  const bank = KORA_BANK_LIST.find((b) => {
    if (!b.name) return false;
    // Normalize the bank name from the Kora API list for matching
    const normalizedKoraName = b.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
    return normalizedKoraName === normalizedInputName;
  });

  // 3. Return the code if found
  return bank ? bank.code : null;
};
