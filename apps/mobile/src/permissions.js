export function hasFeature(
  user,
  feature,
) {
  if (!feature) {
    return true;
  }

  return Boolean(
    user?.features?.includes(
      feature,
    ),
  );
}

export function hasPermission(
  user,
  permission,
) {
  if (!permission) {
    return true;
  }

  return Boolean(
    user?.permissions?.includes(
      permission,
    ),
  );
}

export function canUse(
  user,
  {
    feature,
    permission,
  },
) {
  return (
    hasFeature(
      user,
      feature,
    ) &&
    hasPermission(
      user,
      permission,
    )
  );
}
