import clientPromise from "../mongodb";


const DATABASE_NAME = "kayakalap";

export async function getFacebookCollections() {
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);

  return {
    integrations: db.collection("facebook_integrations"),
    pages: db.collection("facebook_pages"),
    mappings: db.collection("facebook_form_mappings"),
    leads: db.collection("lead_ad"),
  };
}
