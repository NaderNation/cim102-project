const base = import.meta.env.BASE_URL;

// These are presentation fixtures. The exterior photos, sample locations and
// prebuilt interior scenes are illustrative, not a verified single property.
export const FEATURED_HOME = {
  id: "sample-harbor-view",
  title: "Harbor View Residence",
  address: "Sample home · Miami, FL",
  location: "Miami area, Florida",
  price: "875000",
  beds: "3",
  baths: "2",
  sqft: "2140",
  propertyType: "House",
  coverUrl: `${base}houses/coastal.jpg`,
  tourUrl: `${base}sample/harbor-view.spz`,
  latitude: 25.7617,
  longitude: -80.1918,
  description: "Explore the listing, see its approximate sample location, and walk through an illustrative prebuilt 3D interior before deciding whether to arrange a visit.",
};

export const ENTRY_DEMO_HOME = {
  id: "sample-garden-view",
  title: "Garden View Residence",
  address: "Sample home · Austin, TX",
  location: "Austin area, Texas",
  price: "740000",
  beds: "4",
  baths: "3",
  sqft: "2520",
  propertyType: "House",
  coverUrl: `${base}houses/estate-garden.jpg`,
  tourUrl: `${base}sample/harbor-view.spz`,
  alternateTourUrl: `${base}sample/garden-view.spz`,
  latitude: 30.2672,
  longitude: -97.7431,
  description: "This sample lets you demonstrate entering a property with one included image and opening a prepared walkthrough without an API wait. The working house interior is reused for this guided example; the second supplied scan can also be selected in the viewer.",
};

export function demoListingFor(property) {
  return property?.demoPresetId === ENTRY_DEMO_HOME.id ? ENTRY_DEMO_HOME : null;
}
