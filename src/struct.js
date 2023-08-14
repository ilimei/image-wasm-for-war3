"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStruct = exports.StringField = exports.UInt32Field = exports.Int32Field = exports.Int16Field = exports.Int8Field = void 0;
class Int8Field {
    static field = new Int8Field();
    static create() {
        return Int8Field.field;
    }
    size = 1;
    /**
    *
    * @param {DataView} view
    * @param {number} value
    * @param {number} offset
    */
    write(view, value, offset) {
        view.setInt8(offset, value);
    }
    read(view, offset) {
        return view.getInt8(offset);
    }
}
exports.Int8Field = Int8Field;
class Int16Field {
    static field = new Int16Field();
    static create() {
        return Int16Field.field;
    }
    size = 2;
    write(view, value, offset) {
        view.setInt16(offset, value, true);
    }
    read(view, offset) {
        return view.getInt16(offset, true);
    }
}
exports.Int16Field = Int16Field;
class Int32Field {
    static field = new Int32Field();
    static create() {
        return Int32Field.field;
    }
    size = 4;
    write(view, value, offset) {
        view.setInt32(offset, value, true);
    }
    read(view, offset) {
        return view.getInt32(offset, true);
    }
}
exports.Int32Field = Int32Field;
class UInt32Field {
    static field = new UInt32Field();
    static create() {
        return UInt32Field.field;
    }
    size = 4;
    write(view, value, offset) {
        view.setUint32(offset, value, true);
    }
    read(view, offset) {
        return view.getUint32(offset, true);
    }
}
exports.UInt32Field = UInt32Field;
class StringField {
    static create(size) {
        return new StringField(size);
    }
    size;
    constructor(size) {
        this.size = size;
    }
    write(view, value, offset) {
        const data = new TextEncoder().encode(value);
        if (data.length > this.size) {
            throw new Error(`String is too long. Max length is ${this.size}`);
        }
        data.forEach((byte, index) => view.setUint8(offset + index, byte));
    }
    read(view, offset) {
        const buf = [];
        for (let i = 0; i < this.size; i++) {
            const value = view.getUint8(offset + i);
            if (value === 0) {
                break;
            }
            buf.push(value);
        }
        return new TextDecoder().decode(new Uint8Array(buf));
    }
}
exports.StringField = StringField;
function createStruct(fields) {
    return class Struct {
        size;
        _offsets;
        constructor() {
            this.size = Object.keys(fields).reduce((acc, name) => acc + fields[name].type.size * (fields[name].arrayLength || 1), 0);
            let offset = 0;
            this._offsets = Object.keys(fields).reduce((ret, name) => {
                const field = fields[name];
                ret[name] = offset;
                offset += field.type.size * (field.arrayLength || 1);
                return ret;
            }, {});
        }
        write(view, value, offset) {
            Object.keys(fields).forEach(name => {
                const field = fields[name];
                if (field.isArray) {
                    if (!Array.isArray(value[name])) {
                        throw new Error(`Field ${name} is not an array`);
                    }
                    if (field.arrayLength && value[name].length !== field.arrayLength) {
                        throw new Error(`Field ${name} array length is not ${field.arrayLength}`);
                    }
                    value[name].forEach((item, index) => {
                        field.type.write(view, item, offset + index * field.type.size);
                    });
                    offset += field.type.size * (field.arrayLength || 1);
                }
                else {
                    field.type.write(view, value[name], offset);
                    offset += field.type.size;
                }
            });
        }
        read(view, offset) {
            return Object.keys(fields).reduce((acc, name) => {
                const field = fields[name];
                if (field.isArray) {
                    acc[name] = new Array(field.arrayLength || 1).fill(0).map(() => {
                        const v = field.type.read(view, offset);
                        offset += field.type.size;
                        return v;
                    });
                }
                else {
                    acc[name] = field.type.read(view, offset);
                    offset += field.type.size;
                }
                return acc;
            }, {});
        }
    };
}
exports.createStruct = createStruct;
