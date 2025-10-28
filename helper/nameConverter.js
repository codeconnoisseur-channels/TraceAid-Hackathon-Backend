const organizationNameToTitleCase = (string) => {
  if (!string) return "";
  return string
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const individualNameToTitleCase = (name) => {
  if (!name || typeof name !== "string") return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};
const campaignNameToTitleCase = (name) => {
  if (!name || typeof name !== "string") return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

module.exports = {
  organizationNameToTitleCase,
  individualNameToTitleCase,
  campaignNameToTitleCase
};
