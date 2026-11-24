type Matrix=readonly [
  x0: number, x1: number, x2: number, x3: number,
  y0: number, y1: number, y2: number, y3: number,
  z0: number, z1: number, z2: number, z3: number,
  w0: number, w1: number, w2: number, w3: number,
];

type Vec2=readonly [x: number, y: number];
type Vec3=readonly [x: number, y: number, z: number];
type Vec4=readonly [x: number, y: number, z: number, w: number];
type VecN=readonly number[];

type Projection={
  aspect: number,
  fov: number,
  zNear: number,
  zFar: number
};

// TypeScript does not allow multiple rest elements (like [...A, ...B]) in type definitions,
// the TrailingScalars generic is used in place of ...number[] to allow for a bounded number of trailing elements

type TrailingScalars<A extends any[], B extends number[]=[]>=
  B["length"] extends 4 ? never :
    [...A, ...B] | TrailingScalars<A, [...B, number]>;

type Vec2Args=TrailingScalars<[...(Matrix | number)[], Vec2]>;
type Vec3Args=TrailingScalars<[...(Matrix | number)[], Vec3]>;
type Vec4Args=TrailingScalars<[...(Matrix | number)[], Vec4]>;
type VecNArgs=TrailingScalars<[...number[], number[]]>;
type MatrixArgs=[...(Matrix | number)[]];

//export function prod(...args: number[]): number;
export function prod(...args: Vec2Args): Vec2;
export function prod(...args: Vec3Args): Vec3;
export function prod(...args: Vec4Args): Vec4;
export function prod(...args: MatrixArgs): Matrix;
export function prod(...args: VecNArgs): number[];

export function transpose(M: Matrix): Matrix;

export function dot(a: VecN, b: VecN): number;

export function sum(...args: (Vec2)[]): Vec2;
export function sum(...args: (Vec3)[]): Vec3;
export function sum(...args: (Vec4)[]): Vec4;
export function sum(...args: (VecN)[]): VecN;

export function diff(a: Vec2, b: Vec2): Vec2;
export function diff(a: Vec3, b: Vec3): Vec3;
export function diff(a: Vec4, b: Vec4): Vec4;
export function diff(a: VecN, b: VecN): VecN;

export function norm(a: VecN): number;

export function unit(a: Vec2): Vec2;
export function unit(a: Vec3): Vec3;
export function unit(a: Vec4): Vec4;
export function unit(a: VecN): VecN;

export function mat(...args: (VecN)[]): Matrix;

export function cols(M: Matrix): [Vec3, Vec3, Vec3, Vec3];
export function cols(M: Matrix, n: 2): [Vec2, Vec2, Vec2, Vec2];
export function cols(M: Matrix, n: 3): [Vec3, Vec3, Vec3, Vec3];
export function cols(M: Matrix, n: 4): [Vec4, Vec4, Vec4, Vec4];

export function det(M: Matrix): number;

export function inverse(M: Matrix): Matrix;

export function cross(a: Vec3, b: Vec3): Vec3;

export function RX(angle: number, k?: number): Matrix;
export function RY(angle: number, k?: number): Matrix;
export function RZ(angle: number, k?: number): Matrix;
export function SA(s: number): Matrix;
export function SX(s: number): Matrix;
export function SY(s: number): Matrix;
export function SZ(s: number): Matrix;
export function TX(x: number): Matrix;
export function TY(y: number): Matrix;
export function TZ(z: number): Matrix;
export function MProj(h: Partial<Projection>): Matrix;
export function MOrtho(M: Matrix): Matrix;
