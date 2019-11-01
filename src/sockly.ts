type SocklyMessageType = 'G' | 'S' | 'A';

type ReqResCallback = [(value?: any) => void, (value?: any) => void];
type ProxyHandler = (message: SocklyMessageBase) => Promise<SocklyMessageResponse>;

interface SocklyMessageBase {
  type: SocklyMessageType;
  path?: string[];
  value?: any;
  args?: any[];
}

interface SocklyMessage extends SocklyMessageBase {
  id: string;
}

interface SocklyMessageResponse {
  id: string;
  type: 'R';
  value?: any;
  error?: string;
}

export type Connectable = WebSocket | RTCDataChannel;

export function expose(target: Object | Function, connection: Connectable): void {
  const reducePath = (list: string[]) => list.reduce<any>((o: any, prop) => (o ? o[prop] : o), target);
  connection.addEventListener('message', async (event) => {
    const data = (event as MessageEvent).data;
    if (typeof data === 'string') {
      const { id, type, value, path = [], args = [] } = JSON.parse(data) as SocklyMessage;
      if (id && type) {
        const response: SocklyMessageResponse = { id, type: 'R' };
        const ref = reducePath(path);
        const refParent = reducePath(path.slice(0, -1));
        switch (type) {
          case 'G': // Get
            response.value = ref;
            break;
          case 'S': // Set
            const prop = path.length && path.pop();
            if (prop) {
              refParent[prop] = value;
            }
            break;
          case 'A': // Apply
            try {
              response.value = await ref.apply(refParent, args);
            } catch (err) {
              response.error = err.message || err.toString();
            }
            break;
        }
        connection.send(JSON.stringify(response));
      }
    }
  });
}

function proxyHandler(connection: Connectable): ProxyHandler {
  const uid = `${Date.now()}-${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
  const callbacks = new Map<string, ReqResCallback>();
  let counter = 0;

  connection.addEventListener('message', (event) => {
    const data = (event as MessageEvent).data;
    if (typeof data === 'string') {
      const { id, type, value, error } = JSON.parse(data) as SocklyMessageResponse;
      if (id && type === 'R') {
        const cb = callbacks.get(id);
        if (cb) {
          if (error) {
            cb[1](new Error(error));
          } else {
            cb[0](value)
          }
        }
      }
    }
  });

  return (request) => {
    const id = `${uid}-${++counter}`;
    (request as SocklyMessage).id = id;
    return new Promise((resolve, reject) => {
      callbacks.set(id, [resolve, reject]);
      connection.send(JSON.stringify(request));
    });
  };
}

function proxy<T>(handler: ProxyHandler, path: string[] = []): T {
  const _proxy = new Proxy(function () { }, {
    get(_, prop: string | number, receiver) {
      if (prop === 'then') {
        if (path.length === 0) {
          return { then: () => receiver };
        }
        const getter = handler({ type: 'G', path });
        return getter.then.bind(getter);
      }
      return proxy(handler, path.concat(`${prop}`));
    },
    set(_, prop: number | string, value) {
      handler({ type: 'S', path: path.concat(`${prop}`), value });
      return true;
    },
    apply(_, __, args) {
      return handler({ type: 'A', path, args });
    }
  });
  return _proxy as any as T;
}

export function link<T>(connection: Connectable): T {
  return proxy(proxyHandler(connection));
}