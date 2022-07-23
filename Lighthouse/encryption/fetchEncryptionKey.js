const axios = require("axios");

const lighthouseConfig = require("../../lighthouse.config");
const { recoverKey, randSelect } = require("../../Utils/bls_helper");

module.exports = async (cid, publicKey, signedMessage,directAccessMode=true) => {
  try {
    const nodeIndexSelected = randSelect(3, 5);
    let nodeUrl = await Promise.all(
      nodeIndexSelected.map(
        (elem) => directAccessMode? lighthouseConfig.lighthouseBLSNodesRetrieval[elem]: lighthouseConfig.lighthouseBLSNodesRetrievalAccessControl[elem]
      )
    );

    // send encryption key
    const sentShades = await Promise.all(
      nodeUrl.map((url) => {
        return axios
          .post(
            url,
            {
              address: publicKey.toLowerCase(),
              cid: cid,
            },
            {
              headers: {
                Authorization: "Bearer " + signedMessage,
              },
            }
          )
          .then((res) => {
            return res.data;
          });
      })
    );

    const keys = sentShades.map((elem) => elem?.key);
    const indexes = sentShades.map((elem) => elem?.index);

    const key = await recoverKey(keys, indexes);
    return key;
  } catch {
    return null;
  }
};