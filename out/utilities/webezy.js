"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = exports.FieldDescriptor_Type = exports.FieldDescriptor_Label = exports.Language = void 0;
var Language;
(function (Language) {
    Language[Language["unknown_language"] = 0] = "unknown_language";
    Language[Language["python"] = 1] = "python";
    Language[Language["typescript"] = 2] = "typescript";
    Language[Language["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(Language = exports.Language || (exports.Language = {}));
var FieldDescriptor_Label;
(function (FieldDescriptor_Label) {
    /** LABEL_UNKNOWN - 0 is reserved for errors */
    FieldDescriptor_Label[FieldDescriptor_Label["LABEL_UNKNOWN"] = 0] = "LABEL_UNKNOWN";
    FieldDescriptor_Label[FieldDescriptor_Label["LABEL_OPTIONAL"] = 1] = "LABEL_OPTIONAL";
    FieldDescriptor_Label[FieldDescriptor_Label["LABEL_REQUIRED"] = 2] = "LABEL_REQUIRED";
    FieldDescriptor_Label[FieldDescriptor_Label["LABEL_REPEATED"] = 3] = "LABEL_REPEATED";
    FieldDescriptor_Label[FieldDescriptor_Label["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(FieldDescriptor_Label = exports.FieldDescriptor_Label || (exports.FieldDescriptor_Label = {}));
var FieldDescriptor_Type;
(function (FieldDescriptor_Type) {
    /** TYPE_UNKNOWN - 0 is reserved for errors. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_UNKNOWN"] = 0] = "TYPE_UNKNOWN";
    /** TYPE_DOUBLE - Order is weird for historical reasons. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_DOUBLE"] = 1] = "TYPE_DOUBLE";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_FLOAT"] = 2] = "TYPE_FLOAT";
    /**
     * TYPE_INT64 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT64 if
     * negative values are likely.
     */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_INT64"] = 3] = "TYPE_INT64";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_UINT64"] = 4] = "TYPE_UINT64";
    /**
     * TYPE_INT32 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT32 if
     * negative values are likely.
     */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_INT32"] = 5] = "TYPE_INT32";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_FIXED64"] = 6] = "TYPE_FIXED64";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_FIXED32"] = 7] = "TYPE_FIXED32";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_BOOL"] = 8] = "TYPE_BOOL";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_STRING"] = 9] = "TYPE_STRING";
    /**
     * TYPE_GROUP - Tag-delimited aggregate.
     * Group type is deprecated and not supported in proto3. However, Proto3
     * implementations should still be able to parse the group wire format and
     * treat group fields as unknown fields.
     */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_GROUP"] = 10] = "TYPE_GROUP";
    /** TYPE_MESSAGE - Length-delimited aggregate. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_MESSAGE"] = 11] = "TYPE_MESSAGE";
    /** TYPE_BYTES - New in version 2. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_BYTES"] = 12] = "TYPE_BYTES";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_UINT32"] = 13] = "TYPE_UINT32";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_ENUM"] = 14] = "TYPE_ENUM";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_SFIXED32"] = 15] = "TYPE_SFIXED32";
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_SFIXED64"] = 16] = "TYPE_SFIXED64";
    /** TYPE_SINT32 - Uses ZigZag encoding. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_SINT32"] = 17] = "TYPE_SINT32";
    /** TYPE_SINT64 - Uses ZigZag encoding. */
    FieldDescriptor_Type[FieldDescriptor_Type["TYPE_SINT64"] = 18] = "TYPE_SINT64";
    FieldDescriptor_Type[FieldDescriptor_Type["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(FieldDescriptor_Type = exports.FieldDescriptor_Type || (exports.FieldDescriptor_Type = {}));
var Options;
(function (Options) {
    Options[Options["UNKNOWN_EXTENSION"] = 0] = "UNKNOWN_EXTENSION";
    Options[Options["FileOptions"] = 1] = "FileOptions";
    Options[Options["MessageOptions"] = 2] = "MessageOptions";
    Options[Options["FieldOptions"] = 3] = "FieldOptions";
    Options[Options["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(Options = exports.Options || (exports.Options = {}));
//# sourceMappingURL=webezy.js.map