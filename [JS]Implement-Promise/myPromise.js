// 1）Promise基本特性
// 1、Promise有三种状态：pending(进行中)、fulfilled(已成功)、rejected(已失败)
// 2、Promise对象接受一个回调函数作为参数, 该回调函数接受两个参数，分别是成功时的回调resolve和失败时的回调reject；另外resolve的参数除了正常值以外， 还可能是一个Promise对象的实例；reject的参数通常是一个Error对象的实例。
// 3、then方法返回一个新的Promise实例，并接收两个参数onResolved(fulfilled状态的回调)；onRejected(rejected状态的回调，该参数可选)
// 4、catch方法返回一个新的Promise实例
// 5、finally方法不管Promise状态如何都会执行，该方法的回调函数不接受任何参数
// 6、Promise.all()方法将多个多个Promise实例，包装成一个新的Promise实例，该方法接受一个由Promise对象组成的数组作为参数(Promise.all()方法的参数可以不是数组，但必须具有Iterator接口，且返回的每个成员都是Promise实例)，注意参数中只要有一个实例触发catch方法，都会触发Promise.all()方法返回的新的实例的catch方法，如果参数中的某个实例本身调用了catch方法，将不会触发Promise.all()方法返回的新实例的catch方法
// 7、Promise.race()方法的参数与Promise.all方法一样，参数中的实例只要有一个率先改变状态就会将该实例的状态传给Promise.race()方法，并将返回值作为Promise.race()方法产生的Promise实例的返回值
// 8、Promise.resolve()将现有对象转为Promise对象，如果该方法的参数为一个Promise对象，Promise.resolve()将不做任何处理；如果参数thenable对象(即具有then方法)，Promise.resolve()将该对象转为Promise对象并立即执行then方法；如果参数是一个原始值，或者是一个不具有then方法的对象，则Promise.resolve方法返回一个新的Promise对象，状态为fulfilled，其参数将会作为then方法中onResolved回调函数的参数，如果Promise.resolve方法不带参数，会直接返回一个fulfilled状态的 Promise 对象。需要注意的是，立即resolve()的 Promise 对象，是在本轮“事件循环”（event loop）的结束时执行，而不是在下一轮“事件循环”的开始时。
// 9、Promise.reject()同样返回一个新的Promise对象，状态为rejected，无论传入任何参数都将作为reject()的参数

// 2）Promise优点
// ①统一异步 API
// Promise 的一个重要优点是它将逐渐被用作浏览器的异步 API ，统一现在各种各样的 API ，以及不兼容的模式和手法。
// ②Promise 与事件对比
// 和事件相比较， Promise 更适合处理一次性的结果。在结果计算出来之前或之后注册回调函数都是可以的，都可以拿到正确的值。 Promise 的这个优点很自然。但是，不能使用 Promise 处理多次触发的事件。链式处理是 Promise 的又一优点，但是事件却不能这样链式处理。
// ③Promise 与回调对比
// 解决了回调地狱的问题，将异步操作以同步操作的流程表达出来。
// ④Promise 带来的额外好处是包含了更好的错误处理方式（包含了异常处理），并且写起来很轻松（因为可以重用一些同步的工具，比如 Array.prototype.map() ）。

// 3）Promise缺点
// 1、无法取消Promise，一旦新建它就会立即执行，无法中途取消。
// 2、如果不设置回调函数，Promise内部抛出的错误，不会反应到外部。
// 3、当处于Pending状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。
// 4、Promise 真正执行回调的时候，定义 Promise 那部分实际上已经走完了，所以 Promise 的报错堆栈上下文不太友好。

// 依照PromiseA+规范 的Promise

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

const resolvePromise = (promise, x, resolve, reject) => {
  if (x === promise) {
    // If promise and x refer to the same object, reject promise with a TypeError as the reason.
    reject(new TypeError('循环引用'))
  }
  // if x is an object or function,
  if (x !== null && typeof x === 'object' || typeof x === 'function') {
    // If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
    let called
    try { // If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
      let then = x.then // Let then be x.then
      // If then is a function, call it with x as this
      if (typeof then === 'function') {
        // If/when resolvePromise is called with a value y, run [[Resolve]](promise, y)
        // If/when rejectPromise is called with a reason r, reject promise with r.
        then.call(x, y => {
          if (called) return
          called = true
          resolvePromise(promise, y, resolve, reject)
        }, r => {
          if (called) return
          called = true
          reject(r)
        })
      } else {
        // If then is not a function, fulfill promise with x.
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    // If x is not an object or function, fulfill promise with x
    resolve(x)
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.value = undefined
    this.reason = undefined
    // 存放成功/失败的队列
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      // 如果value是一个Promise 递归解析
      if (value instanceof Promise) {
        return value.then(resolve, reject)
      }
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.value = value
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    try {
      executor(resolve, reject) // 立即执行
    } catch (error) {
      reject(error)
    }
  }
  then(onFulfilled, onRejected) {
    // 判断 onFulfilled, onRejected 是否是函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
    let newPromise = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (error) {
            reject(error)
          }

        })
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })

      }
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(newPromise, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(newPromise, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        });
      }
    })
    return newPromise
  }
  /**
   * Promise.catch
   * @description  用于promise方法链示，捕获前面 onFulfilled/onRejected 抛出的异常
   * @param {*} errorCallback 
   */
  catch(errorCallback) {
    return this.then(null, errorCallback)
  }
  /**
   * Promise.finally
   * @description finally 传入的函数 无论成功和失败都执行
   * @param {*} callback 回调函数
   * @returns 返回成功/失败
   */
  finally(callback) {
    return this.then((value) => {
      // 返回上一次的值
      return new Promise(callback()).then(() => value)
    }, error => {
      return new Promise(callback()).then(() => { throw error })
    })
  }
  /**
   * Promise.all
   * @description 当这个数组里的所有promise对象全部变为resolve状态的时候，才会resolve 当有一个promise对象变为reject状态时 直接 reject
   * @param {*} values promise对象组成的数组作为参数
   * @returns 返回一个promise实例
   */
  static all(values) {
    return new Promise((resolve, reject) => {
      let resultArr = []
      let count = 0
      const resultArrByKey = (index, value) => {
        resultArr[index] = value
        if (++count === values.length) {
          resolve(resultArr)
        }
      }
      values.forEach((promise, index) => {
        promise.then((value) => {
          resultArrByKey(index, value)
        }, reject)
      })
    })
  }
  /**
   * Promise.race
   * @description 只要有一个promise对象进入FULFILLED 或者  REJECTED 状态的话，就会继续执行后面的处理
   * @param {*} values  接受promise对象组成的数组作为参数
   * @returns 返回一个Promise实例
   */
  static race(values) {
    return new Promise((resolve, reject) => {
      values.forEach((promise) => {
        promise.then(resolve, reject)
      })
    })
  }
  // 默认产生一个成功的promise
  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value)
    })
  }
  // 默认产生一个失败的promise
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }
}

Promise.deferred = () => {
  let defer = {}
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}

module.exports = Promise
