import {
  ServiceItemType,
} from '@prisma/client';

export type MobileIntakeTemplateItem = {
  category: string;
  type: ServiceItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type MobileIntakeTemplate = {
  code: string;
  name: string;
  description: string;
  items: MobileIntakeTemplateItem[];
};

export const MOBILE_INTAKE_V3_TEMPLATES:
  MobileIntakeTemplate[] = [
  {
    code: 'PERIODIC_MAINTENANCE',
    name: 'Periyodik Bakım',
    description:
      'Standart periyodik bakım kontrol ve değişim kalemleri.',
    items: [
      {
        category: 'BAKIM',
        type: ServiceItemType.LABOR,
        name: 'Motor yağı değişimi',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'BAKIM',
        type: ServiceItemType.PART,
        name: 'Yağ filtresi',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'BAKIM',
        type: ServiceItemType.PART,
        name: 'Hava filtresi',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'BAKIM',
        type: ServiceItemType.PART,
        name: 'Polen filtresi',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Fren sistemi kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Sıvı ve kaçak kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Akü ve şarj sistemi kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Lastik kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
  },
  {
    code: 'BRAKE_SERVICE',
    name: 'Fren Bakımı',
    description:
      'Fren sistemi inceleme ve bakım iş kalemleri.',
    items: [
      {
        category: 'TAMIR',
        type: ServiceItemType.LABOR,
        name: 'Ön fren kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'TAMIR',
        type: ServiceItemType.LABOR,
        name: 'Arka fren kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Fren hidroliği kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
  },
  {
    code: 'ENGINE_DIAGNOSIS',
    name: 'Motor Arıza / İnceleme',
    description:
      'Motor arızası için teşhis ve ön inceleme paketi.',
    items: [
      {
        category: 'TAMIR',
        type: ServiceItemType.LABOR,
        name: 'Motor ön teşhis',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'TAMIR',
        type: ServiceItemType.LABOR,
        name: 'Arıza kodu / elektronik kontrol',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Kaçak ve mekanik ses kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
  },
  {
    code: 'AIR_CONDITIONING',
    name: 'Klima Bakımı',
    description:
      'Klima performans ve kaçak kontrolü.',
    items: [
      {
        category: 'BAKIM',
        type: ServiceItemType.LABOR,
        name: 'Klima performans kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Klima kaçak kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
  },
  {
    code: 'GENERAL_INSPECTION',
    name: 'Genel Kontrol',
    description:
      'Araç genel mekanik ve güvenlik kontrolü.',
    items: [
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Alt takım kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Aydınlatma kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
      {
        category: 'KONTROL',
        type: ServiceItemType.LABOR,
        name: 'Genel güvenlik kontrolü',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
  },
];
