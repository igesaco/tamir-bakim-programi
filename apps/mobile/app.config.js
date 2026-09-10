const productionApiHost = 'tamir-bakim-api.onrender.com';

module.exports = ({ config }) => {
  const isWorkflowD =
    process.env.APP_VARIANT === 'workflowD' ||
    ['workflowD', 'workflowD-testflight'].includes(process.env.EAS_BUILD_PROFILE);

  if (!isWorkflowD) return config;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error('Workflow D için ayrı deneme API adresini EXPO_PUBLIC_API_URL olarak tanımlayın.');
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase().replace(/\.$/, '') === productionApiHost ||
    parsed.username || parsed.password || parsed.search || parsed.hash
  ) {
    throw new Error('Workflow D ayrı bir HTTPS deneme API adresi gerektirir; canlı API kullanılamaz.');
  }

  return {
    ...config,
    name: 'Tamir Bakım Deneme',
  };
};
