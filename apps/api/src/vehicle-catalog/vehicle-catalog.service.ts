import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_TTL_MS =
  24 * 60 * 60 * 1000;

@Injectable()
export class VehicleCatalogService {
  private readonly cache =
    new Map<string, CacheEntry<any>>();

  private getCached<T>(
    key: string,
  ): T | null {
    const item = this.cache.get(key);

    if (
      !item ||
      item.expiresAt < Date.now()
    ) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  private setCached<T>(
    key: string,
    value: T,
  ) {
    this.cache.set(key, {
      value,
      expiresAt:
        Date.now() + CACHE_TTL_MS,
    });
  }

  private async request(
    path: string,
  ) {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        10000,
      );

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/${path}`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Vehicle catalog HTTP ${response.status}`,
        );
      }

      return await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'Araç marka/model kataloğuna şu anda ulaşılamıyor. Manuel marka ve model girişi kullanabilirsiniz.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async getMakes() {
    const key = 'makes';
    const cached =
      this.getCached<any[]>(key);

    if (cached) {
      return cached;
    }

    const data = await this.request(
      'GetAllMakes?format=json',
    );

    const byName =
      new Map<string, {
        id: number;
        name: string;
      }>();

    for (
      const item of data.Results ?? []
    ) {
      const name =
        String(
          item.Make_Name ?? '',
        ).trim();

      const id = Number(
        item.Make_ID,
      );

      if (!name || !id) {
        continue;
      }

      const normalized =
        name.toLocaleLowerCase(
          'tr-TR',
        );

      if (!byName.has(normalized)) {
        byName.set(normalized, {
          id,
          name,
        });
      }
    }

    const result = [
      ...byName.values(),
    ].sort((a, b) =>
      a.name.localeCompare(
        b.name,
        'tr',
      ),
    );

    this.setCached(key, result);

    return result;
  }

  async getModels(
    make: string,
    year?: number,
  ) {
    const cleanMake =
      String(make ?? '').trim();

    if (!cleanMake) {
      throw new BadRequestException(
        'Marka bilgisi gerekli.',
      );
    }

    if (
      year &&
      (
        !Number.isInteger(year) ||
        year < 1996 ||
        year > 2100
      )
    ) {
      throw new BadRequestException(
        'Model yılı geçersiz.',
      );
    }

    const key =
      `models:${cleanMake.toLowerCase()}:${year ?? 'all'}`;

    const cached =
      this.getCached<any[]>(key);

    if (cached) {
      return cached;
    }

    const encodedMake =
      encodeURIComponent(cleanMake);

    const path = year
      ? `GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
      : `GetModelsForMake/${encodedMake}?format=json`;

    const data =
      await this.request(path);

    const byName =
      new Map<string, {
        id: number;
        makeId: number;
        make: string;
        model: string;
      }>();

    for (
      const item of data.Results ?? []
    ) {
      const model =
        String(
          item.Model_Name ?? '',
        ).trim();

      const makeName =
        String(
          item.Make_Name ??
          cleanMake,
        ).trim();

      if (!model) {
        continue;
      }

      const normalized =
        model.toLocaleLowerCase(
          'tr-TR',
        );

      if (!byName.has(normalized)) {
        byName.set(normalized, {
          id: Number(
            item.Model_ID ?? 0,
          ),
          makeId: Number(
            item.Make_ID ?? 0,
          ),
          make: makeName,
          model,
        });
      }
    }

    const result = [
      ...byName.values(),
    ].sort((a, b) =>
      a.model.localeCompare(
        b.model,
        'tr',
      ),
    );

    this.setCached(key, result);

    return result;
  }
}
