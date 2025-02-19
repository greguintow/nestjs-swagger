import { Expose, ExposeOptions } from 'class-transformer';
import { DECORATORS } from '../constants';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { getEnumType, getEnumValues } from '../utils/enum.utils';
import { createPropertyDecorator, getTypeIsArrayTuple } from './helpers';

export interface ApiPropertyOptions
  extends Omit<SchemaObjectMetadata, 'name' | 'enum'> {
  name?: string;
  enum?: any[] | Record<string, any>;
  enumName?: string;
    /**
   * Use class transformer to expose the field
   * @default true
   */
  expose?: boolean | ExposeOptions;
}

const isEnumArray = (obj: ApiPropertyOptions): boolean =>
  obj.isArray && !!obj.enum;

export function ApiProperty(
  options: ApiPropertyOptions = {}
): PropertyDecorator {
  return createApiPropertyDecorator(options);
}

export function createApiPropertyDecorator(
  options: ApiPropertyOptions = {},
  overrideExisting = true
): PropertyDecorator {
  const [type, isArray] = getTypeIsArrayTuple(options.type, options.isArray);
  options = {
    ...options,
    type,
    isArray
  };

  if (isEnumArray(options)) {
    options.type = 'array';

    const enumValues = getEnumValues(options.enum);
    options.items = {
      type: getEnumType(enumValues),
      enum: enumValues
    };
    delete options.enum;
  } else if (options.enum) {
    const enumValues = getEnumValues(options.enum);

    options.enum = enumValues;
    options.type = getEnumType(enumValues);
  }

  if (Array.isArray(options.type)) {
    options.type = 'array';
    options.items = {
      type: 'array',
      items: {
        type: options.type[0]
      }
    };
  }

  return (target: object, propertyKey: string) => {
    createPropertyDecorator(
      DECORATORS.API_MODEL_PROPERTIES,
      options,
      overrideExisting
    )(target, propertyKey);

    if (options.expose !== false) {
      Expose(typeof options.expose !== 'object' ? undefined : options.expose)(
        target,
        propertyKey,
      );
    }
  }
}

export function ApiPropertyOptional(
  options: ApiPropertyOptions = {}
): PropertyDecorator {
  return ApiProperty({
    ...options,
    required: false
  });
}

export function ApiResponseProperty(
  options: Pick<
    ApiPropertyOptions,
    'type' | 'example' | 'format' | 'enum' | 'deprecated'
  > = {}
): PropertyDecorator {
  return ApiProperty({
    readOnly: true,
    ...options
  });
}
