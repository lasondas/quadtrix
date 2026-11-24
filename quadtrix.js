/*
  Quadtrix - a minimalistic linear algebra and matrix library for WebGL and WebGPU applications with emphasis on ease of use.
  In most cases CPU-side matrix operations are not the bottleneck so convenience is preferred over performance. In summary:

  - simple data representation
      - 16-element JS arrays represent 4x4 matrices and 4, 3, and 2-element JS arrays represent column vectors
      - matrices are in column major order for WebGL/WebGPU compatibility
      - immutability: input matrices are never changed
  - easy interoperability between 3d/2d vectors and 4x4 homogeneous matrices:
      - mat() to construct a matrix from up to four 2d, 3d or 4d vectors, missing values are taken from the unity matrix
      - cols() to extract the columns of a matrix as 3d vectors (second argument two specify different dimensionality)
      - prod() allows multiplying 4x4 matrix with 2d, 3d, or 4d vector, missing values taken from (0, 0, 0, 1)
      - prod() truncates result of matrix and vector product to match the dimension of the input vector
  - chaining of operations: prod() and sum() accept arbitrary number of arguments
  - matrix templates for rotation, scaling, translation, projection and orthonormalization
  - TypeScript definitions included
*/

export class DimError extends Error {
  constructor() {
    super("dimension mismatch");
  }
}

function multiply(A, B) {
  const k=B.length;

  // patch B with default values when fewer than 4 array elements are present
  if(k<4) {
    const [x, y, z, w]=B;
    B=[x ?? 0, y ?? 0, z ?? 0, w ?? 1];
  }

  // n: number of rows in output
  // m: number of columns in output
  const n=A.length**0.5;
  const m=B.length/n;

  if(n!==4 || !(m===1 || m===4)) {
    throw new DimError();
  }

  const C=[];

  for(let i=0; i<m; i++) {
    for(let j=0; j<n; j++) {
      let s=0;

      for(let k=0; k<n; k++) {
        s+=A[n*k+j]*B[n*i+k];
      }

      C.push(s);
    }
  }

  // make the return value the same size as B
  return C.slice(0, k);
}

/**
 * Computes the matrix product of the scalars, matrices and vectors specified.
 * When multiplying matrices by a vector smaller than 4x1, default values are taken from (0, 0, 0, 1)
 * and the output vector is reshaped to the same shape as the input vector.
 *
 * @param {...*} arguments - vectors and matrices represented by arrays and scalars by numbers
 * @returns {VecN} the product
 * @example
 *  // get a Vec3 by multiplying a Matrix by a Vec3
 *  p1=prod(M, p0);
 *  // this is equivalent to:
 *  p1=prod(M, p0.concat(1)).slice(0, 3);
 * @example
 *  // multiply array with a scalar, outputs [0, 2, 4, 6, 8, 10]
 *  prod([0, 1, 2, 3, 4, 5], 2);
 */
export function prod() {
  const Ms=Array.from(arguments).filter((x)=>typeof x!=="number");
  const ns=Array.from(arguments).filter((x)=>typeof x==="number");

  if(Ms.length===0) Ms.push(mat());

  // .reverse() below because multiplying from the right is more effecient
  // than from the left when multiplying multiple matrices and a vector

  let A=Ms.at(-1);

  for(const B of Ms.slice(0, -1).reverse()) {
    A=multiply(B, A);
  }

  const n=ns.reduce((a, b)=>a*b, 1);
  return A.map((x)=>n*x);
}

/**
 * Compute the transpose of a matrix
 *
 * @param {Matrix} M - the matrix
 * @returns {Matrix} the transposed matrix, as a new array instance
 */
export function transpose(M) {
  const n=M.length**0.5;
  const T=[];

  if(n!==Math.round(n)) {
    throw new DimError();
  }

  for(let i=0; i<n; i++) {
    for(let j=0; j<n; j++) {
      T.push(M[n*j+i]);
    }
  }

  return T;
}

/**
 * Compute the dot product of two vectors of the same size. Any array size is allowed
 *
 * @param {VecN} a - first vector
 * @param {VecN} b - second vector
 * @returns {number} the dot product
 */
export function dot(a, b) {
  if(a.length!==b.length) {
    throw new DimError();
  }

  let s=0;

  for(let i=0; i<a.length; i++) {
    s+=a[i]*b[i];
  }

  return s;
}

/**
 * Compute the sum of the given vectors.
 *
 * @param {...VecN} the vectors to sum
 * @returns {VecN} a new array instance containing the sum
 */
export function sum() {
  const a=arguments[0].slice().fill(0);

  for(const b of arguments) {
    if(b.length!==a.length) {
      throw new DimError();
    }

    for(let i=0; i<a.length; i++) {
      a[i]+=b[i];
    }
  }

  return a;
}

/**
 * Compute the difference of two vectors
 *
 * @param {VecN} a - first vector
 * @param {VecN} b - second vector
 * @returns {VecN} a new array instance containing the difference
 */
export function diff(a, b) {
  return sum(a, prod(b, -1));
}

/**
 * Compute the norm (length) of a vector
 *
 * @param {VecN} a - the vector
 * @returns {number} the norm
 */
export function norm(a) {
  return a.reduce((x, y)=>x+y**2, 0)**0.5;
}

/**
 * Compute the unit vector of a vector. The zero vector returns a zero vector.
 *
 * @param {VecN} a - the vector
 * @returns {number} a new array instance containing the unit vector
 */
export function unit(a) {
  return prod(a, 1/(norm(a) || 1));
}

/**
 * Construct a new 4x4 matrix from up to four column vectors. The column vectors can have fewer than four elements.
 * Missing elements are taken from the 4x4 identity matrix.
 *
 * @param {...VecN} up to four vectors with 0 to 4 elements.
 * @returns {Matrix} the constructed matrix
 */
export function mat() {
  const M=[
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];

  for(let i=0; i<4; i++) {
    const col=arguments[i] ?? [];

    for(let j=0; j<col.length; j++) {
      M[4*i+j]=col[j];
    }
  }

  return M;
}

/**
 * Deconstruct a 4x4 matrix into its columns. By default truncated into 3d vectors.
 * Second arguments specifies the desired output dimensionality, pass 4 to prevent truncating.
 *
 * @param {Matrix} M - the matrix
 * @param {number} n - number of rows in each returned column. The default is 3
 * @returns {[VecN, VecN, VecN, VecN]} the columns
 */
export function cols(M, n=3) {
  if(M.length!==16) throw new DimError();

  return [...Array(4)].map((_, i)=>M.slice(4*i+0, 4*i+n));
}

/**
 * Compute the determinant of a matrix
 *
 * @param {Matrix} M - the matrix
 * @returns {number} the determinant
 */
export function det(M) {
  // compute the determinante with the help of the wedge product /\ from geometric algebra.
  // the determinant is the scalar coefficient of the wedge product of all columns in M.
  // by associativity x /\ y /\ z /\ w = (x /\ y) /\ (z /\ w), which gives a nice way to compute the result

  // split M into vectors x, y, z and w. the digit indicates which basis element (e1, e2, e3, e4) is represented

  const [
    x1, x2, x3, x4,
    y1, y2, y3, y4,
    z1, z2, z3, z4,
    w1, w2, w3, w4,
  ]=M;

  // compute x /\ y

  const xy12=x1*y2 - y1*x2;
  const xy13=x1*y3 - y1*x3;
  const xy14=x1*y4 - y1*x4;
  const xy23=x2*y3 - y2*x3;
  const xy24=x2*y4 - y2*x4;
  const xy34=x3*y4 - y3*x4;

  // compute z /\ w

  const zw12=z1*w2 - w1*z2;
  const zw13=z1*w3 - w1*z3;
  const zw14=z1*w4 - w1*z4;
  const zw23=z2*w3 - w2*z3;
  const zw24=z2*w4 - w2*z4;
  const zw34=z3*w4 - w3*z4;

  // compute (x /\ y) /\ (z /\ w) based on the above

  // every term in the product is a scalar multiple of e1234. the e1324 and e2413 terms are negated because they equal -e1234.
  // this can be verified by normalizing to e1234-form by swapping neighboring basis elements. every swap negates the result:
  //   e1324 = -e1234
  //   e1423 = -e1243 = +e1234
  //   e2314 = -e2134 = +e1234
  //   e2413 = -e2143 = +e1243 = -e1234
  //   e3412 = -e3142 = +e1342 = -e1324 = +e1234

  return xy12*zw34 - xy13*zw24 + xy14*zw23 + xy23*zw14 - xy24*zw13 + xy34*zw12;
}

/**
 * Compute the inverse of an invertible matrix.
 *
 * @param {Matrix} M - the matrix
 * @returns {Matrix} the inverse
 */
export function inverse(M) {
  const k=1/det(M);
  const I=[];

  // TODO: figure out best way to handle non invertible input

  // compute the inverse using Cramer's rule

  // M: matrix to invert
  // X: M with column j replaced with column i from the identity matrix
  // I: the inverse, element at col i, row j given by det(X)/det(M)

  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      const X=M.slice();

      for(let k=0; k<4; k++) {
        X[4*j+k]=i===k ? 1 : 0;
      }

      I.push(k*det(X));
    }
  }

  return I;
}

/**
 * Compute the cross product of two vectors.
 *
 * @param {Vec3} a - the first vector
 * @param {Vec3} b - the second vector
 * @returns {Vec3} the cross product: a x b
 */
export function cross(a, b) {
  const [a0, a1, a2]=a;
  const [b0, b1, b2]=b;

  const c0=a1*b2 - a2*b1;
  const c1=a2*b0 - a0*b2;
  const c2=a0*b1 - a1*b0;

  return [c0, c1, c2];
}

/**
 * Create a homogeneous transformation matrix for rotating k*angle radians about the x-axis
 *
 * @param {number} angle - an angle in radians
 * @param {number} k - angle coefficient, default is 2*pi
 * @returns {Matrix} the transformation matrix
 */
export function RX(angle, k=2*Math.PI) {
  const s=Math.sin(k*angle);
  const c=Math.cos(k*angle);

  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0,-s, c, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for rotating k*angle radians about the y-axis
 *
 * @param {number} angle - an angle in radians
 * @param {number} k - angle coefficient, default is 2*pi
 * @returns {Matrix} the transformation matrix
 */
export function RY(angle, k=2*Math.PI) {
  const s=Math.sin(k*angle);
  const c=Math.cos(k*angle);

  return [
    c, 0,-s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for rotating k*angle radians about the z-axis
 *
 * @param {number} angle - an angle in radians
 * @param {number} k - angle coefficient, default is 2*pi
 * @returns {Matrix} the transformation matrix
 */
export function RZ(angle, k=2*Math.PI) {
  const s=Math.sin(k*angle);
  const c=Math.cos(k*angle);

  return [
    c, s, 0, 0,
   -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for scaling all axes
 *
 * @param {number} s - the scale factor
 * @returns {Matrix} the transformation matrix
 */
export function SA(s) {
  return [
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for scaling the x-axis
 *
 * @param {number} s - the scale factor
 * @returns {Matrix} the transformation matrix
 */
export function SX(s) {
  return [
    s, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for scaling the y-axis
 *
 * @param {number} s - the scale factor
 * @returns {Matrix} the transformation matrix
 */
export function SY(s) {
  return [
    1, 0, 0, 0,
    0, s, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for scaling the z-axis
 *
 * @param {number} s - the scale factor
 * @returns {Matrix} the transformation matrix
 */
export function SZ(s) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for translating x
 *
 * @param {number} x - translation amount
 * @returns {Matrix} the transformation matrix
 */
export function TX(x) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, 0, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for translating y
 *
 * @param {number} y - translation amount
 * @returns {Matrix} the transformation matrix
 */
export function TY(y) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, y, 0, 1
  ];
}

/**
 * Create a homogeneous transformation matrix for translating z
 *
 * @param {number} z - translation amount
 * @returns {Matrix} the transformation matrix
 */
export function TZ(z) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, z, 1
  ];
}

/**
 * Create a projection matrix
 *
 * @returns {Matrix} the projection matrix
 */
export function MProj(h) {

// TODO: allow specifying z limits for NDC, WebGPU and WebGL have different conventions

  const {aspect, fov, zNear, zFar}={
    aspect: 1,
    fov: Math.PI/2,
    zNear: -1,
    zFar: -1000,
    ...h,
  };

  // (x, y, z, w): input vector
  // (x', y', z', w'): transformed vector
  // a, b, c, d: values to be determined, the projection matrix is set up such that:
  //  x'=a*x
  //  y'=b*y
  //  z'=c*z+d (assuming w=1)
  //  w'=z

  // k controls the scaling of x' and y'. points that are on the top and bottom edge of the field of view are characterised by
  // |y/z|=tan(fov/2), and for the transformed y by |y'/z|=1. choose k such that |y/z|=tan(fov/2) <=> |y'/z|=1
  const k=1/Math.tan(fov/2);

  // TODO: does this make any sense for allowing positive far and near zs?
  const s=Math.sign(zNear);

  // apply aspect ratio to x, to fix top and bottom (could be applied to y with b=k*aspect to fix left and right instead)
  const a=s*k/aspect;
  const b=s*k;

  const [zn, zf]=[zNear, zFar];
  const [z0, z1]=[-1, 1];

  // let f(z)=z'/w', the z-value after perspective division.
  // solve for c and d in f(zn)=z0 and f(zf)=z1
  // for WebGL, z0=-1 and z1=1

  const c=(zn*z0-zf*z1)/(zn-zf);
  const d=zf*z1-c*zf;

  return [
    a, 0, 0, 0,
    0, b, 0, 0,
    0, 0, c, 1,
    0, 0, d, 0
  ];
}

/**
 * Orthonormalize matrix
 *
 * @param {Matrix} M - input matrix
 * @returns {Matrix} orthonormalized matrix
 */
export function MOrtho(M) {
  const [x0, y0, z0, w0]=cols(M);

  const z1=unit(cross(x0, y0));
  const x1=unit(cross(y0, z1));
  const y1=unit(y0);

  const x2=prod(x1, Math.sign(dot(x1, x0)));
  const y2=prod(y1, Math.sign(dot(y1, y0)));
  const z2=prod(z1, Math.sign(dot(z1, z0)));

  return mat(x2, y2, z2, w0);
}
