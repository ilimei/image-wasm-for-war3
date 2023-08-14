export interface FieldType<T> {
    readonly size: number;
    write(view: DataView, value: T, offset: number): void;
    read(view: DataView, offset: number): T;
}

export interface FieldDesc<T extends FieldType<any>, A extends boolean> {
    type: T;
    isArray: A;
    arrayLength?: number;
}

export type GetFieldDescInnerType<T> = T extends FieldDesc<infer R, infer A> ? R extends FieldType<infer U> ? A extends true ? U[] : U : never : never;

export type MapFieldDescsToValue<T extends Record<string, FieldDesc<any, any>>> = {
    [K in keyof T]: GetFieldDescInnerType<T[K]>
}

export class Int8Field implements FieldType<number> {
    static field = new Int8Field();

    static create() {
        return Int8Field.field;
    }

    readonly size = 1;

    /**
    * 
    * @param {DataView} view 
    * @param {number} value 
    * @param {number} offset 
    */
    write(view: DataView, value: number, offset: number) {
        view.setInt8(offset, value);
    }

    read(view: DataView, offset: number) {
        return view.getInt8(offset);
    }
}

export class Int16Field implements FieldType<number> {
    static field = new Int16Field();

    static create() {
        return Int16Field.field;
    }

    readonly size = 2;

    write(view: DataView, value: number, offset: number) {
        view.setInt16(offset, value, true);
    }

    read(view: DataView, offset: number) {
        return view.getInt16(offset, true);
    }
}

export class Int32Field implements FieldType<number> {
    static field = new Int32Field();

    static create() {
        return Int32Field.field;
    }

    readonly size = 4;

    write(view: DataView, value: number, offset: number) {
        view.setInt32(offset, value, true);
    }

    read(view: DataView, offset: number) {
        return view.getInt32(offset, true);
    }
}

export class UInt32Field implements FieldType<number> {
    static field = new UInt32Field();

    static create() {
        return UInt32Field.field;
    }

    readonly size = 4;

    write(view: DataView, value: number, offset: number) {
        view.setUint32(offset, value, true);
    }

    read(view: DataView, offset: number) {
        return view.getUint32(offset, true);
    }
}

export class StringField implements FieldType<string> {
    static create(size: number) {
        return new StringField(size);
    }

    readonly size: number;

    constructor(size: number) {
        this.size = size;
    }

    write(view: DataView, value: string, offset: number): void {
        const data = new TextEncoder().encode(value);
        if (data.length > this.size) {
            throw new Error(`String is too long. Max length is ${this.size}`);
        }
        data.forEach((byte, index) => view.setUint8(offset + index, byte));
    }

    read(view: DataView, offset: number): string {
        const buf: number[] = [];
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

export function createStruct<T extends Record<string, FieldDesc<any, any>>>(fields: T): new () => FieldType<MapFieldDescsToValue<T>> {
    return class Struct {
        readonly size: number;
        readonly _offsets: Record<string, number>;

        constructor() {
            this.size = Object.keys(fields).reduce((acc, name) => acc + fields[name].type.size * (fields[name].arrayLength || 1), 0);
            let offset = 0;
            this._offsets = Object.keys(fields).reduce((ret, name) => {
                const field = fields[name];
                ret[name] = offset;
                offset += field.type.size * (field.arrayLength || 1);
                return ret;
            }, {} as Record<string, number>);
        }

        write(view: DataView, value: any, offset: number) {
            Object.keys(fields).forEach(name => {
                const field = fields[name];
                if (field.isArray) {
                    if (!Array.isArray(value[name])) {
                        throw new Error(`Field ${name} is not an array`);
                    }
                    if (field.arrayLength && value[name].length !== field.arrayLength) {
                        throw new Error(`Field ${name} array length is not ${field.arrayLength}`);
                    }
                    value[name].forEach((item: any, index: number) => {
                        field.type.write(view, item, offset + index * field.type.size);
                    });
                    offset += field.type.size * (field.arrayLength || 1);
                } else {
                    field.type.write(view, value[name], offset);
                    offset += field.type.size;
                }
            });
        }

        read(view: DataView, offset: number) {
            return Object.keys(fields).reduce((acc, name) => {
                const field = fields[name];
                if (field.isArray) {
                    acc[name] = new Array(field.arrayLength || 1).fill(0).map(() => {
                        const v = field.type.read(view, offset);
                        offset += field.type.size;
                        return v;
                    });
                } else {
                    acc[name] = field.type.read(view, offset);
                    offset += field.type.size;
                }
                return acc;
            }, {} as any);
        }
    } as any;
}