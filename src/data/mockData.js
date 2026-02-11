export const baseBatch = {
  id: 'irnvbtch_23143b63',
  title: 'Credit Limit Increase Journey - Jun 25',
  description: 'Credit limit increase journey for June 2025 batch',
  tag: 'Test',
  status: 'Active',
  type: 'Boost',
  journeyType: 'Credit Limit Increase',
  journeyVariant: 'Credit Limit Increase - Dark Theme',
  issuer: 'Federal Bank',
  genericUrls: true,
  startDate: '10 May, 2025 - 13:59',
  endDate: '15 Jun, 2025 - 13:59',
  expectedConversion: '50%',
  userBase: '81,169',
  notificationSetup: 'Send an email to abc@gmail.com, xyz@gmail.com everyday at 6:00PM',
  analytics: {
    finalBatchData: 81169,
    conversions: 6315,
    conversionRate: 7.78,
    daysToJourneyEnd: 20,
  },
  funnel: [
    { name: 'Total Customers', value: 81169 },
    { name: 'Visited Landing Page', value: 42350 },
    { name: 'Completed Journey', value: 12480 },
    { name: 'Attempted OTP Verification', value: 6315 },
  ],
};

export const offerBatches = [
  {
    id: 'ob_001',
    title: 'June ROI Reduction Offer',
    status: 'ACTIVE',
    startDate: '2025-05-15T00:00:00',
    endDate: '2025-05-31T23:59:59',
    eligibleCustomers: 12450,
    createdBy: 'Amogh P.',
    createdAt: '2025-05-10T14:30:00',
    analytics: {
      finalBatchData: 12450,
      conversions: 1890,
      conversionRate: 15.18,
      daysToJourneyEnd: 8,
    },
    funnel: [
      { name: 'Total Customers', value: 12450 },
      { name: 'Visited Landing Page', value: 6200 },
      { name: 'Completed Journey', value: 3100 },
      { name: 'Attempted OTP Verification', value: 1890 },
    ],
    offerDefinitions: [
      {
        id: 'od_1',
        name: 'ROI Reduction + PF Waiver',
        eligibility: {
          journeyStatus: 'NOT_STARTED',
          smartTags: ['High Value Customers', 'Premium Card Holders'],
          propensityRange: { min: 1, max: 5 },
          currentRoi: { operator: 'GT', value: 12 },
          events: [
            {
              eventType: 'click',
              eventTarget: 'Review Details',
              frequency: { operator: 'GTE', value: 2 },
              timeWindow: { value: 7, unit: 'days' },
            },
          ],
        },
        outcomes: [
          {
            type: 'roi',
            subType: 'relative',
            label: 'ROI \u2014 Relative',
            value: 1,
            display: 'Current ROI - 1%',
          },
          {
            type: 'pf',
            subType: 'flat',
            label: 'Processing Fee \u2014 Flat',
            value: 0,
            display: 'Rs 0',
          },
        ],
      },
      {
        id: 'od_2',
        name: 'Tag High-Intent',
        eligibility: {
          journeyStatus: 'NOT_STARTED',
          smartTags: ['High Value Customers'],
          decileRange: { min: 0, max: 2 },
        },
        outcomes: [
          {
            type: 'smart_tag',
            label: 'Attach Smart Tag',
            value: null,
            display: 'Premium Offer Eligible',
            smartTags: ['Premium Offer Eligible'],
          },
        ],
      },
    ],
  },
  {
    id: 'ob_002',
    title: 'May PF Waiver Campaign',
    status: 'EXPIRED',
    startDate: '2025-05-01T00:00:00',
    endDate: '2025-05-14T23:59:59',
    eligibleCustomers: 8320,
    createdBy: 'Rahul S.',
    createdAt: '2025-04-28T10:15:00',
    analytics: {
      finalBatchData: 8320,
      conversions: 1245,
      conversionRate: 14.96,
      daysToJourneyEnd: 0,
    },
    funnel: [
      { name: 'Total Customers', value: 8320 },
      { name: 'Visited Landing Page', value: 4100 },
      { name: 'Completed Journey', value: 2050 },
      { name: 'Attempted OTP Verification', value: 1245 },
    ],
    offerDefinitions: [
      {
        id: 'od_1',
        name: 'PF Waiver',
        eligibility: {
          journeyStatus: 'NOT_STARTED',
          decileRange: { min: 0, max: 3 },
        },
        outcomes: [
          {
            type: 'pf',
            subType: 'flat',
            label: 'Processing Fee \u2014 Flat',
            value: 0,
            display: 'Rs 0',
          },
        ],
      },
    ],
  },
  {
    id: 'ob_003',
    title: 'June Premium Incentive Bundle',
    status: 'SCHEDULED',
    startDate: '2025-06-01T00:00:00',
    endDate: '2025-06-10T23:59:59',
    eligibleCustomers: 0,
    createdBy: 'Amogh P.',
    createdAt: '2025-05-25T09:00:00',
    analytics: {
      finalBatchData: 0,
      conversions: 0,
      conversionRate: 0,
      daysToJourneyEnd: 30,
    },
    funnel: [
      { name: 'Total Customers', value: 0 },
      { name: 'Visited Landing Page', value: 0 },
      { name: 'Completed Journey', value: 0 },
      { name: 'Attempted OTP Verification', value: 0 },
    ],
    offerDefinitions: [
      {
        id: 'od_1',
        name: 'ROI Override + Merchant Reward',
        eligibility: {
          journeyStatus: 'NOT_STARTED',
          propensityRange: { min: 1, max: 3 },
          events: [
            {
              eventType: 'page_view',
              eventTarget: 'Offer Summary',
              frequency: { operator: 'GTE', value: 3 },
              timeWindow: { value: 14, unit: 'days' },
            },
            {
              eventType: 'cta_tap',
              eventTarget: 'Apply Now',
              frequency: null,
              timeWindow: { value: 2, unit: 'weeks' },
            },
          ],
        },
        outcomes: [
          {
            type: 'roi',
            subType: 'absolute',
            label: 'ROI \u2014 Absolute',
            value: 10,
            display: '10%',
          },
          {
            type: 'merchant_offer',
            label: 'Merchant Offer',
            value: null,
            display: 'Amazon - 10% Cashback, Swiggy - 20% Off',
            merchantOffers: ['Amazon - 10% Cashback', 'Swiggy - 20% Off'],
          },
          {
            type: 'smart_tag',
            label: 'Attach Smart Tag',
            value: null,
            display: 'Premium Offer Eligible',
            smartTags: ['Premium Offer Eligible'],
          },
        ],
      },
    ],
  },
];
