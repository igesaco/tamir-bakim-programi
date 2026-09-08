import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '@prisma/client';

export const FEATURE_KEY =
  'required_feature';

export const Feature = (
  feature: FeatureKey,
) =>
  SetMetadata(
    FEATURE_KEY,
    feature,
  );
