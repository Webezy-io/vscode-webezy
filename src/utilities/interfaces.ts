export interface VSCodeMessage {
    type: 'init' | 'event';
    page: string;
    resource: any;
}

/* eslint-disable @typescript-eslint/naming-convention */
export interface WebezyJson {
    domain: string;
    project?: Project;
    services: { [key: string]: ServiceDescriptor };
    packages: { [key: string]: PackageDescriptor };
    config?: WebezyConfig;
  }
  
  export interface Project {
    id?:
      | string
      | undefined;
    /** Unique URI identifier ex' /organizations/xxxx/resources/SomeType/SomeKind/SomeResource:0.0.1 */
    uri: string;
    /** Resource entity name ex' SomeResource */
    name: string;
    packageName: string;
    /** Version of the resource ex' 0.0.1 */
    version: string;
    /** The resource Type ex' SomeType */
    type: string;
    /** Some resource kind under specific type ex' SomeKind */
    kind: string;
    /** Array of properties */
    properties: { [key: string]: any }[];
    files: string[];
    services: string[];
    serverLanguage: string;
    server?: WebezyServer;
    clients: WebezyClient[];
  }

  /** Describes a service. */
export interface ServiceDescriptor {
    uri: string;
    name: string;
    fullName: string;
    methods: MethodDescriptor[];
    clientImpl: string;
    serverImpl: string;
    version: string;
    dependencies: string[];
    description: string;
  }

  export interface MethodDescriptor {
    uri: string;
    name: string;
    fullName: string;
    type: string;
    kind: string;
    /**
     * ServiceDescriptor containing_service = 3;
     * Input and output type names.  These are resolved in the same way as
     * FieldDescriptorProto.type_name, but must refer to a message type.
     */
    inputType: string;
    outputType: string;
    /** Identifies if client streams multiple client messages */
    clientStreaming: boolean;
    /** Identifies if server streams multiple server messages */
    serverStreaming: boolean;
    description: string;
  }

  export interface WebezyServer {
    language: Language;
  }
  
  export interface WebezyClient {
    outDir: string;
    language: Language;
  }
  
  export interface WebezyConfig {
    host: string;
    port: number;
  }
  
  export enum Language {
    unknown_language = 0,
    python = 1,
    typescript = 2,
    UNRECOGNIZED = -1,
  }

  export interface PackageDescriptor {
    uri: string;
    name: string;
    package: string;
    messages: Descriptor[];
    version: string;
    dependencies: string[];
    enums: Enum[];
    extensions: { [key: string]: any };
    description: string;
  }

  export interface Descriptor {
    uri: string;
    /** Name of this protocol message type. */
    name: string;
    /** Fully-qualified name of this protocol message type, which will include protocol “package” name and the name of any enclosing types. */
    fullName: string;
    /** Field descriptors for all fields in this type. */
    fields: FieldDescriptor[];
    type: string;
    kind: string;
    description: string;
    extensions: string[];
    extensionType: Options;
  }

  export interface FieldDescriptor {
    uri: string;
    name: string;
    fullName: string;
    index: number;
    fieldType: FieldDescriptor_Type;
    label: FieldDescriptor_Label;
    enumType?: Enum;
    type: string;
    kind: string;
    /** If the field type is another message an valid URI for the Descriptor */
    messageType?: string | undefined;
    extensions: { [key: string]: any };
    description?: string | undefined;
  }
  

  export interface EnumValueDescriptor {
    uri: string;
    name: string;
    number: number;
    index: number;
  }
  
  export interface Enum {
    uri: string;
    name: string;
    fullName: string;
    values: EnumValueDescriptor[];
  }

  export enum FieldDescriptor_Label {
    /** LABEL_UNKNOWN - 0 is reserved for errors */
    LABEL_UNKNOWN = 0,
    LABEL_OPTIONAL = 1,
    LABEL_REQUIRED = 2,
    LABEL_REPEATED = 3,
    UNRECOGNIZED = -1,
  }
  

export enum FieldDescriptor_Type {
    /** TYPE_UNKNOWN - 0 is reserved for errors. */
    TYPE_UNKNOWN = 0,
    /** TYPE_DOUBLE - Order is weird for historical reasons. */
    TYPE_DOUBLE = 1,
    TYPE_FLOAT = 2,
    /**
     * TYPE_INT64 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT64 if
     * negative values are likely.
     */
    TYPE_INT64 = 3,
    TYPE_UINT64 = 4,
    /**
     * TYPE_INT32 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT32 if
     * negative values are likely.
     */
    TYPE_INT32 = 5,
    TYPE_FIXED64 = 6,
    TYPE_FIXED32 = 7,
    TYPE_BOOL = 8,
    TYPE_STRING = 9,
    /**
     * TYPE_GROUP - Tag-delimited aggregate.
     * Group type is deprecated and not supported in proto3. However, Proto3
     * implementations should still be able to parse the group wire format and
     * treat group fields as unknown fields.
     */
    TYPE_GROUP = 10,
    /** TYPE_MESSAGE - Length-delimited aggregate. */
    TYPE_MESSAGE = 11,
    /** TYPE_BYTES - New in version 2. */
    TYPE_BYTES = 12,
    TYPE_UINT32 = 13,
    TYPE_ENUM = 14,
    TYPE_SFIXED32 = 15,
    TYPE_SFIXED64 = 16,
    /** TYPE_SINT32 - Uses ZigZag encoding. */
    TYPE_SINT32 = 17,
    /** TYPE_SINT64 - Uses ZigZag encoding. */
    TYPE_SINT64 = 18,
    UNRECOGNIZED = -1,
  }

export enum Options {
    UNKNOWN_EXTENSION = 0,
    FileOptions = 1,
    MessageOptions = 2,
    FieldOptions = 3,
    UNRECOGNIZED = -1,
}
  
export interface CustomType {
  label: string
	data: any
	kind: string
  children?: CustomType[]
}

export interface Projects {
  [x: string]: WebezyJson;
}

export interface VSCodeWebezyConfig {
  projects: { defaultProjects : string[] }
}