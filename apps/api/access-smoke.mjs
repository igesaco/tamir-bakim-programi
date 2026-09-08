const BASE_URL =
  process.env.BASE_URL ||
  'http://127.0.0.1:3100';

async function request(
  path,
  {
    method = 'GET',
    token,
    body,
    expectedStatus,
  } = {},
) {
  const response =
    await fetch(
      `${BASE_URL}${path}`,
      {
        method,
        headers: {
          Accept:
            'application/json',
          'Content-Type':
            'application/json',
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body,
              ),
      },
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (
    expectedStatus !==
      undefined &&
    response.status !==
      expectedStatus
  ) {
    throw new Error(
      `${method} ${path}: expected HTTP ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  if (
    expectedStatus ===
    undefined &&
    !response.ok
  ) {
    throw new Error(
      `${method} ${path}: HTTP ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return {
    status:
      response.status,
    data,
  };
}

function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new Error(
      `Assertion failed: ${message}`,
    );
  }
}

function createSyntheticNationalId() {
  const firstNine =
    [
      1, 2, 3, 4, 5,
      6, 7, 8, 9,
    ];

  const oddSum =
    firstNine[0] +
    firstNine[2] +
    firstNine[4] +
    firstNine[6] +
    firstNine[8];

  const evenSum =
    firstNine[1] +
    firstNine[3] +
    firstNine[5] +
    firstNine[7];

  const digit10 =
    ((oddSum * 7 -
      evenSum) %
      10 +
      10) %
    10;

  const firstTen = [
    ...firstNine,
    digit10,
  ];

  const digit11 =
    firstTen.reduce(
      (sum, digit) =>
        sum + digit,
      0,
    ) % 10;

  return [
    ...firstTen,
    digit11,
  ].join('');
}

async function main() {
  const tenantEmail =
    `owner-${Date.now()}@ci.example.com`;

  const tenantPassword =
    'TenantPassword_123!';

  const register =
    await request(
      '/auth/register',
      {
        method: 'POST',
        body: {
          organizationName:
            'CI Test Servis',
          branchName:
            'Merkez',
          firstName:
            'CI',
          lastName:
            'Owner',
          email:
            tenantEmail,
          phone:
            '5550000000',
          password:
            tenantPassword,
        },
      },
    );

  const tenantToken =
    register.data.token;

  const organizationId =
    register.data.organization.id;

  assert(
    tenantToken,
    'tenant registration must return a token',
  );

  const me =
    await request(
      '/users/me',
      {
        token:
          tenantToken,
      },
    );

  assert(
    me.data.features.includes(
      'CUSTOMERS',
    ),
    'Starter package must include CUSTOMERS',
  );

  assert(
    me.data.features.includes(
      'CUSTOMER_PORTAL',
    ),
    'Starter package must include CUSTOMER_PORTAL',
  );

  assert(
    !me.data.features.includes(
      'INVENTORY',
    ),
    'Starter package must not include INVENTORY',
  );

  await request(
    '/customers',
    {
      token:
        tenantToken,
      expectedStatus: 200,
    },
  );

  await request(
    '/inventory/parts',
    {
      token:
        tenantToken,
      expectedStatus: 403,
    },
  );

  const platform =
    await request(
      '/platform/login',
      {
        method: 'POST',
        body: {
          email:
            process.env.PLATFORM_FOUNDER_EMAIL,
          password:
            process.env.PLATFORM_FOUNDER_PASSWORD,
        },
      },
    );

  const platformToken =
    platform.data.token;

  assert(
    platformToken,
    'platform login must return a token',
  );

  assert(
    platform.data.user.actorType ===
      'PLATFORM',
    'platform actor type must be PLATFORM',
  );

  const packages =
    await request(
      '/platform/packages',
      {
        token:
          platformToken,
      },
    );

  assert(
    packages.data.length === 3,
    'exactly three default service packages must exist',
  );

  const packageCodes =
    new Set(
      packages.data.map(
        (item) =>
          item.code,
      ),
    );

  for (
    const code of
      [
        'STARTER',
        'PROFESSIONAL',
        'PREMIUM',
      ]
  ) {
    assert(
      packageCodes.has(code),
      `package ${code} must exist`,
    );
  }

  const organizations =
    await request(
      '/platform/organizations',
      {
        token:
          platformToken,
      },
    );

  const organization =
    organizations.data.find(
      (item) =>
        item.id ===
        organizationId,
    );

  assert(
    organization,
    'new tenant must be visible in platform organizations',
  );

  assert(
    organization.package?.code ===
      'STARTER',
    'new tenant must start on STARTER',
  );

  const impersonation =
    await request(
      `/platform/organizations/${organizationId}/impersonate`,
      {
        method: 'POST',
        token:
          platformToken,
      },
    );

  const agencyTenantToken =
    impersonation.data.token;

  assert(
    agencyTenantToken,
    'agency impersonation must return token',
  );

  await request(
    '/inventory/parts',
    {
      token:
        agencyTenantToken,
      expectedStatus: 200,
    },
  );

  const professional =
    packages.data.find(
      (item) =>
        item.code ===
        'PROFESSIONAL',
    );

  await request(
    `/platform/organizations/${organizationId}/package`,
    {
      method: 'PATCH',
      token:
        platformToken,
      body: {
        packageId:
          professional.id,
      },
    },
  );

  await request(
    '/inventory/parts',
    {
      token:
        tenantToken,
      expectedStatus: 200,
    },
  );

  await request(
    `/platform/organizations/${organizationId}/features/INVENTORY`,
    {
      method: 'PUT',
      token:
        platformToken,
      body: {
        enabled: false,
      },
    },
  );

  await request(
    '/inventory/parts',
    {
      token:
        tenantToken,
      expectedStatus: 403,
    },
  );

  await request(
    `/platform/organizations/${organizationId}/features/INVENTORY`,
    {
      method: 'DELETE',
      token:
        platformToken,
    },
  );

  await request(
    '/inventory/parts',
    {
      token:
        tenantToken,
      expectedStatus: 200,
    },
  );

  const nationalId =
    createSyntheticNationalId();

  const customer =
    await request(
      '/customers',
      {
        method: 'POST',
        token:
          tenantToken,
        body: {
          firstName:
            'Portal',
          lastName:
            'Test',
          phone:
            '5551112233',
          nationalId,
        },
      },
    );

  assert(
    !(
      'nationalIdHash' in
      customer.data
    ),
    'customer API must never expose nationalIdHash',
  );

  assert(
    customer.data
      .nationalIdLast4 ===
      nationalId.slice(-4),
    'customer API may expose only national ID last four digits',
  );

  const vehicle =
    await request(
      '/vehicles',
      {
        method: 'POST',
        token:
          tenantToken,
        body: {
          customerId:
            customer.data.id,
          plate:
            '47 CI 001',
          brand:
            'Test',
          model:
            'Vehicle',
          mileage:
            1000,
        },
      },
    );

  const portalStart =
    await request(
      '/customer-portal/access/start',
      {
        method: 'POST',
        body: {
          nationalId,
          plate:
            vehicle.data.plate,
        },
      },
    );

  assert(
    portalStart.data
      .developmentCode,
    'CI portal start must return development OTP',
  );

  const portalVerify =
    await request(
      '/customer-portal/access/verify',
      {
        method: 'POST',
        body: {
          challengeId:
            portalStart.data
              .challengeId,
          code:
            portalStart.data
              .developmentCode,
        },
      },
    );

  const portal =
    await request(
      '/customer-portal/me',
      {
        token:
          portalVerify.data
            .token,
      },
    );

  assert(
    portal.data.vehicle.id ===
      vehicle.data.id,
    'portal session must be restricted to verified vehicle',
  );

  assert(
    portal.data.customer
      .nationalIdLast4 ===
      nationalId.slice(-4),
    'portal must only expose last four national ID digits',
  );

  assert(
    !(
      'nationalIdHash' in
      portal.data.customer
    ),
    'portal must never expose national ID hash',
  );

  console.log(
    'ACCESS_SMOKE_OK',
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );
    process.exit(1);
  },
);
