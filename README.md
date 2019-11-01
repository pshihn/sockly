# sockly 🧦

Sockly is the easiest way to work with WebSockets or a WebRTC data channel. 

Instead of endless message passing, you expose a function or object at one end. At the other end of the connection you simply call the function or use the object properties and mehods. 

For example, using a WebSocket, on the server you would:

```javascript
const calculator = {
  name: 'Awesome calculator',
  add(a, b) {
    return a + b;
  },
  subtract(a, b) {
    return a - b;
  }
};
sockly.expose(calculator, webSocket);
```

On the client, simply call that calculator
```javascript
const calculator = sockly.link(webSocket);
await calculator.add(4, 6);       // 10
await calculator.subtract(6, 4);  // 2
await calculator.name;            // Awesome calculator
```

## Use Cases

Any time you use WebSockets or RTCDataChannel for p2p applications on the web (Chat app, games, etc). 

Yes, one could manually add message handling easily, but it gets really annoying to maintain as more API is added over the socket. 

It's just easier to add the new API method and just call it from the client without making any other changes!

*Note: Sockly does not deal with creation/connection/lifecycle of WebSockets or WebRTC channels.*

## Install

Install from npm:
```
npm install --save sockly
```
ES6 import:
```
import {link, expose} from 'sockly'
```

Or using pika in the browser
```
import * as sockly from 'https://cdn.pika.dev/sockly';
```

## Usage

**`expose`** a function or an object 

and then **`link`** the exposed object at the other end. 

## Examples

See the live version of the calculator example above:

[Socket server code](https://glitch.com/edit/#!/sockly-basic-server)

[Client code](https://glitch.com/edit/#!/sockly-basic-client)

## How does it work

Sockly creates a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) when you `link` a connection. This proxy intercepts property gets/sets, and method calls. The proxy does the underlying message passing with the other end of the socket. 

## License
[MIT License]https://github.com/pshihn/sockly/blob/master/LICENSE) (c) [Preet Shihn](https://twitter.com/preetster)
