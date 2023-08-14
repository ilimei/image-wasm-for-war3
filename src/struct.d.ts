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
    [K in keyof T]: GetFieldDescInnerType<T[K]>;
};
export declare class Int8Field implements FieldType<number> {
    static field: Int8Field;
    static create(): Int8Field;
    readonly size = 1;
    /**
    *
    * @param {DataView} view
    * @param {number} value
    * @param {number} offset
    */
    write(view: DataView, value: number, offset: number): void;
    read(view: DataView, offset: number): number;
}
export declare class Int16Field implements FieldType<number> {
    static field: Int16Field;
    static create(): Int16Field;
    readonly size = 2;
    write(view: DataView, value: number, offset: number): void;
    read(view: DataView, offset: number): number;
}
export declare class Int32Field implements FieldType<number> {
    static field: Int32Field;
    static create(): Int32Field;
    readonly size = 4;
    write(view: DataView, value: number, offset: number): void;
    read(view: DataView, offset: number): number;
}
export declare class UInt32Field implements FieldType<number> {
    static field: UInt32Field;
    static create(): UInt32Field;
    readonly size = 4;
    write(view: DataView, value: number, offset: number): void;
    read(view: DataView, offset: number): number;
}
export declare class StringField implements FieldType<string> {
    static create(size: number): StringField;
    readonly size: number;
    constructor(size: number);
    write(view: DataView, value: string, offset: number): void;
    read(view: DataView, offset: number): string;
}
export declare function createStruct<T extends Record<string, FieldDesc<any, any>>>(fields: T): new () => FieldType<MapFieldDescsToValue<T>>;
