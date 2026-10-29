const vendors = [
  {
    vendorId: "V001",
    vendorName: "Blackhawk Network",
    vendorEmail: "support@blackhawknetwork.com",
    customerId: ["9566416404713", "9928712388841", "9012345678901"],
    customerEmail: ["customer1@example.com", "customer2@example.com",'sarath.m@klarion.ai'],
    giftCards: [
      {
        giftCardId: "GC101",
        giftCardName: "Visa Gift Card",
      },
      {
        giftCardId: "GC102",
        giftCardName: "Mastercard Gift Card",
      },
      {
        giftCardId: "GC103",
        giftCardName: "HubSpot gift card",
      },
    ],
  },
  {
    vendorId: "V002",
    vendorName: "HubSpot",
    vendorEmail: "james.hubspot@yopmail.com",
    customerId: ["9566416404713", "9928712388841"],
    customerEmail: ["rajeev.veettil@klarion.ai", "customer.hubspot@example.com"],
    giftCards: [
      {
        giftCardId: "GC201",
        giftCardName: "HubSpot gift card",
      },
    ],
  },
  {
    vendorId: "V003",
    vendorName: "Tango",
    vendorEmail: "support@tango.com",
    customerId: ["9928712388841", "7766554433221"],
    customerEmail: ["buyer@example.com","sarath.m@klarion.ai"],
    giftCards: [
      {
        giftCardId: "GC301",
        giftCardName: "Vanilla Visa Gift Card",
      },
    ],
  },
  {
    vendorId: "V004",
    vendorName: "Prepaid Technologies",
    vendorEmail: "help@prepaidtech.com",
    customerId: ["9012345678901", "6655443322110", "9566416404713"],
    customerEmail: ["orders@example.com", "finance@example.com"],
    giftCards: [
      {
        giftCardId: "GC401",
        giftCardName: "Target Gift Card",
      },
      {
        giftCardId: "GC402",
        giftCardName: "Amazon Gift Card",
      },
    ],
  },
];

module.exports = { vendors };
