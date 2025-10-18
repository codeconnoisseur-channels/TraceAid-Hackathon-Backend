import axios from "axios";

const options = {
  method: "POST",
  url: "https://api.qoreid.com/v1/webhooks/collection/verificationType",
  headers: { accept: "application/json" },
};

axios
  .request(options)
  .then((res) => console.log(res.data))
  .catch((err) => console.error(err));
